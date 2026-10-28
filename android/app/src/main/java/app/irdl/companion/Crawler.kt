package app.irdl.companion

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.isActive
import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import org.jsoup.nodes.Node
import org.jsoup.nodes.TextNode
import java.io.IOException
import java.net.URI

data class CrawlProgress(
    val phase: String = "idle", // idle | pages | posts | review | saving | done
    val pages: Int = 0, val posts: Int = 0, val postsDone: Int = 0,
    val games: Int = 0, val noId: Int = 0, val failed: Int = 0, val current: String = ""
)

/** One game found on the site, as the console's Import tab keeps a game: its Title ID and the batches of links. */
class DraftGame(val id: String, var title: String, val platform: String, val sourceUrl: String, val batches: MutableList<JSONObject>) {
    val urls = HashSet<String>()
    fun json(): JSONObject = JSONObject().put("id", id).put("title", title).put("sourceUrl", sourceUrl).put("batches", JSONArray(batches))
}

class CrawlResult(
    val url: String, val site: String, val pages: Int, val posts: Int,
    val games: List<DraftGame>, val noId: Int, val failed: Int
) {
    val batches get() = games.sumOf { it.batches.size }
}

class BlockedException(code: Int) : IOException("The site refused the phone (HTTP $code). It may sit behind a bot check; open it in a browser first, or try again later.")

fun hostKey(url: String): String = try { URI(url).host?.lowercase()?.removePrefix("www.") ?: "" } catch (error: Exception) { "" }

fun normalizeUrl(input: String): String {
    var text = input.trim()
    if (text.isEmpty()) return ""
    if (!text.startsWith("http://", true) && !text.startsWith("https://", true)) text = "https://$text"
    return text.substringBefore("#")
}

/**
 * Reads a whole site section: the listing and every page after it, every post on them, and what the console makes of each post
 * (its Title ID, title and batches of links). The phone fetches the pages (its own connection, so a site that turns the console
 * away still works); the console reads each post with the same reader the Import tab uses, so what comes out is what a single
 * post would have given.
 */
class SiteCrawler(startUrl: String, private val report: (CrawlProgress) -> Unit) {
    private val start = normalizeUrl(startUrl)
    private val host = hostKey(start)
    private var progress = CrawlProgress()

    private fun update(block: (CrawlProgress) -> CrawlProgress) {
        synchronized(this) {
            progress = block(progress)
            report(progress)
        }
    }

    suspend fun run(): CrawlResult = coroutineScope {
        if (host.isEmpty()) throw IOException("That is not a web address.")
        update { CrawlProgress(phase = "pages", current = start) }
        val posts = LinkedHashSet<String>()
        val visited = HashSet<String>()
        var url: String? = start
        var number = 1
        var emptyRun = 0
        while (number <= MAX_PAGES && isActive) {
            val here: String = url ?: break
            visited.add(here.trimEnd('/'))
            var doc: Document? = null
            try {
                doc = fetch(here)
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                if (number == 1) throw error
            }
            if (doc == null) break
            val fresh = postLinks(doc, visited).count { posts.add(it) }
            val page = number
            val found = posts.size
            update { it.copy(pages = page, posts = found, current = here) }
            emptyRun = if (fresh == 0) emptyRun + 1 else 0
            if (emptyRun >= 2) break
            url = nextPage(doc, here, number, visited, posts.size)
            number++
            delay(PAGE_DELAY)
        }
        if (posts.isEmpty()) throw IOException("No posts were found on that page. Open a category or archive address (the list of posts), not a single post.")

        update { it.copy(phase = "posts", postsDone = 0) }
        val drafts = LinkedHashMap<String, DraftGame>()
        var noId = 0
        var failed = 0
        var done = 0
        val queue = Channel<String>(Channel.UNLIMITED)
        posts.forEach { queue.trySend(it) }
        queue.close()
        val workers = (1..WORKERS).map {
            async(Dispatchers.IO) {
                for (post in queue) {
                    ensureActive()
                    var outcome = 0 // 0 kept, 1 no Title ID, 2 failed
                    try {
                        val preview = analyse(post)
                        outcome = if (preview == null) 2 else if (!merge(drafts, preview, post)) 1 else 0
                    } catch (error: CancellationException) {
                        throw error
                    } catch (error: ClosedException) {
                        throw error
                    } catch (error: SignedOutException) {
                        throw error
                    } catch (error: Exception) {
                        outcome = 2
                    }
                    synchronized(drafts) {
                        done++
                        if (outcome == 1) noId++
                        if (outcome == 2) failed++
                        val snapshot = Triple(done, drafts.size, noId to failed)
                        update { it.copy(postsDone = snapshot.first, games = snapshot.second, noId = snapshot.third.first, failed = snapshot.third.second, current = post) }
                    }
                    delay(POST_DELAY)
                }
            }
        }
        workers.awaitAll()
        CrawlResult(start, host, progress.pages, posts.size, drafts.values.toList(), noId, failed)
    }

    // ---- the web ---------------------------------------------------------------------------------------------

    private fun fetch(url: String): Document {
        var attempt = 0
        while (true) {
            val response = Jsoup.connect(url)
                .userAgent(AGENT)
                .header("Accept-Language", "en-US,en;q=0.9")
                .timeout(25000)
                .maxBodySize(4_000_000)
                .followRedirects(true)
                .ignoreHttpErrors(true)
                .ignoreContentType(true)
                .execute()
            val code = response.statusCode()
            if (code in 200..299) return response.parse()
            if ((code == 429 || code >= 500 && code != 503) && attempt < 2) {
                attempt++
                Thread.sleep(1500L * attempt)
                continue
            }
            if (code == 403 || code == 503) throw BlockedException(code)
            throw IOException("HTTP $code")
        }
    }

    private fun hidden(a: Element): Boolean = a.parents().any {
        it.tagName() in setOf("nav", "header", "footer", "aside") ||
            MENU.containsMatchIn(it.className()) || MENU.containsMatchIn(it.id())
    }

    private fun candidate(raw: String, visited: Set<String>): String? {
        val url = raw.substringBefore("#")
        if (!url.startsWith("http") || hostKey(url) != host) return null
        val uri = try { URI(url) } catch (error: Exception) { return null }
        val path = uri.path ?: ""
        val query = uri.query
        if (PAGINATION.containsMatchIn(url) || ASSET.containsMatchIn(path) || SKIP_PATH.containsMatchIn(path)) return null
        val shortLink = query != null && Regex("(^|&)p=\\d+$").containsMatchIn(query)
        if (path.isEmpty() || path == "/") return if (shortLink) url else null
        val clean = if (shortLink) url else url.substringBefore("?")
        if (clean.trimEnd('/') in visited || clean.trimEnd('/') == start.substringBefore("?").trimEnd('/')) return null
        return clean
    }

    private fun postLinks(doc: Document, visited: Set<String>): List<String> {
        val inCards = doc.select(CARDS).filter { !hidden(it) }.mapNotNull { candidate(it.absUrl("href"), visited) }.distinct()
        if (inCards.isNotEmpty()) return inCards
        return doc.select("a[href]").filter { !hidden(it) }.mapNotNull { candidate(it.absUrl("href"), visited) }.distinct()
    }

    private fun nextPage(doc: Document, current: String, number: Int, visited: Set<String>, postCount: Int): String? {
        fun usable(raw: String): String? {
            val url = raw.substringBefore("#")
            if (!url.startsWith("http") || hostKey(url) != host || url.trimEnd('/') in visited) return null
            return url
        }
        doc.selectFirst("link[rel=next], a[rel=next]")?.absUrl("href")?.let { usable(it) }?.let { return it }
        val anchors = doc.select("a[href]")
        anchors.firstOrNull { a ->
            a.className().lowercase().contains("next") || a.attr("aria-label").lowercase().contains("next") ||
                a.text().trim().lowercase() in NEXT_WORDS
        }?.absUrl("href")?.let { usable(it) }?.let { return it }
        val want = number + 1
        val numbered = Regex("/page/$want(/|$|\\?)|[?&](paged|page|pg)=$want(&|$)")
        anchors.firstOrNull { numbered.containsMatchIn(it.absUrl("href")) }?.absUrl("href")?.let { usable(it) }?.let { return it }
        // Nothing on the page says where the list goes on: WordPress-style addresses are tried while the list keeps giving posts.
        if (postCount >= 3) {
            val base = start.substringBefore("?").replace(Regex("/page/\\d+/?$"), "").trimEnd('/')
            return usable("$base/page/$want/")
        }
        return null
    }

    // ---- one post ----------------------------------------------------------------------------------------------

    private fun simplified(doc: Document, url: String): String {
        val out = StringBuilder("<html><head><title>")
        out.append(escape(doc.title().take(300))).append("</title>")
        for (property in listOf("og:title", "og:image")) {
            val content = doc.selectFirst("meta[property=$property]")?.attr("content").orEmpty()
            if (content.isNotBlank()) out.append("<meta property='").append(property).append("' content='").append(escape(content.take(500))).append("'>")
        }
        out.append("</head><body>")
        doc.select("script, style, noscript, svg, form, iframe, nav, footer, aside, header, #comments, .comments, .comment-list, .sidebar, .widget, .related, .sharedaddy, .share, .wp-block-latest-posts").remove()
        val body = doc.body()
        var root: Element = doc.selectFirst("article, .entry-content, .post-content, .post-body, .single-content, main, #content, .content") ?: body
        if (root.select("a[href]").isEmpty()) root = body
        val state = Budget()
        walk(root, out, state)
        out.append("</body></html>")
        return out.toString()
    }

    private class Budget(var bytes: Int = 0)

    private fun emit(out: StringBuilder, piece: String, state: Budget): Boolean {
        if (state.bytes > HTML_LIMIT) return false
        state.bytes += piece.toByteArray(Charsets.UTF_8).size
        out.append(piece)
        return true
    }

    private fun walk(node: Node, out: StringBuilder, state: Budget) {
        if (state.bytes > HTML_LIMIT) return
        when (node) {
            is TextNode -> {
                val text = node.text().trim()
                if (text.isNotEmpty()) emit(out, escape(text) + " ", state)
            }
            is Element -> {
                val tag = node.tagName()
                if (tag == "a") {
                    val href = node.absUrl("href")
                    val text = escape(node.text().trim().take(90))
                    if (href.startsWith("http")) emit(out, "<a href='" + escape(href.take(900)) + "'>" + text + "</a> ", state)
                    else if (text.isNotEmpty()) emit(out, "$text ", state)
                    return
                }
                val block = tag in BLOCKS
                val heading = tag.length == 2 && tag[0] == 'h' && tag[1].isDigit()
                if (heading) emit(out, "<h3>", state) else if (block) emit(out, "<p>", state)
                for (child in node.childNodes()) walk(child, out, state)
                if (heading) emit(out, "</h3>", state) else if (block) emit(out, "</p>", state)
            }
        }
    }

    private fun escape(text: String): String = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&#39;")

    /** What the console makes of the post, or null when it could not read it. */
    private suspend fun analyse(post: String): JSONObject? {
        val html = simplified(fetch(post), post)
        val job = Console.post("/api/import/fetch", JSONObject().put("text", html).put("url", post)).optString("job")
        if (job.isEmpty()) return null
        repeat(100) {
            delay(250)
            val answer = Console.get("/api/import/job?id=$job")
            when (answer.optString("state")) {
                "ready" -> return answer.optJSONObject("preview")
                "failed" -> return null
            }
        }
        return null
    }

    /** Adds the post's batches to its game; false when the post names no Title ID. */
    private fun merge(drafts: MutableMap<String, DraftGame>, preview: JSONObject, post: String): Boolean {
        val id = preview.optString("titleId")
        if (id.isEmpty()) return false
        val batches = preview.optJSONArray("batches") ?: return true
        synchronized(drafts) {
            val game = drafts.getOrPut(id) {
                DraftGame(id, preview.optString("title").ifBlank { id }, preview.optString("platform", "ps5"), post, mutableListOf())
            }
            for (index in 0 until batches.length()) {
                val batch = batches.getJSONObject(index)
                val hosts = JSONArray()
                var first = ""
                var links = 0
                val groups = batch.optJSONArray("hosts") ?: continue
                for (g in 0 until groups.length()) {
                    val group = groups.getJSONObject(g)
                    val list = JSONArray()
                    val found = group.optJSONArray("links") ?: continue
                    for (l in 0 until found.length()) {
                        val link = found.getJSONObject(l)
                        val address = link.optString("url")
                        if (address.isEmpty()) continue
                        if (first.isEmpty()) first = address
                        val entry = JSONObject().put("url", address)
                        if (!link.isNull("part")) entry.put("part", link.optInt("part"))
                        if (link.optString("filename").isNotEmpty()) entry.put("filename", link.optString("filename"))
                        list.put(entry)
                        links++
                    }
                    if (list.length() > 0) hosts.put(JSONObject().put("host", group.optString("host")).put("links", list))
                }
                if (links == 0 || first in game.urls) continue
                batch.optJSONArray("hosts")?.let { all ->
                    for (g in 0 until all.length()) {
                        val found = all.getJSONObject(g).optJSONArray("links") ?: continue
                        for (l in 0 until found.length()) game.urls.add(found.getJSONObject(l).optString("url"))
                    }
                }
                game.batches.add(JSONObject().put("key", batch.optString("key")).put("label", batch.optString("label")).put("hosts", hosts))
            }
        }
        return true
    }

    companion object {
        private const val MAX_PAGES = 1000
        private const val WORKERS = 3
        private const val PAGE_DELAY = 400L
        private const val POST_DELAY = 200L
        private const val HTML_LIMIT = 38000
        private const val AGENT = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
        private const val CARDS = "article a[href], .post a[href], .entry-title a[href], .post-title a[href], h1 a[href], h2 a[href], h3 a[href], .card a[href], .item a[href]"
        private val MENU = Regex("menu|sidebar|widget|footer|header|navbar|breadcrumb|pagination|related", RegexOption.IGNORE_CASE)
        private val SKIP_PATH = Regex("/(category|categories|tag|tags|author|authors|archive|archives|feed|comments|wp-(admin|login|json|content|includes)|search|login|register|signup|contact|about|privacy|privacy-policy|dmca|terms|cart|checkout|my-account)(/|$)", RegexOption.IGNORE_CASE)
        private val ASSET = Regex("\\.(jpe?g|png|gif|webp|svg|ico|css|js|json|xml|rss|txt|pdf|mp4|mp3|zip|rar|7z|exe|apk)$", RegexOption.IGNORE_CASE)
        private val PAGINATION = Regex("/page/\\d+|[?&](paged|page|pg)=\\d+", RegexOption.IGNORE_CASE)
        private val NEXT_WORDS = setOf("next", "next page", "next »", "next ›", "»", "›", "→", "older", "older posts", "older posts »", ">", ">>", "بعدی", "صفحه بعد")
        private val BLOCKS = setOf("p", "div", "li", "ul", "ol", "br", "tr", "td", "th", "table", "section", "article", "blockquote", "pre", "dd", "dt", "dl", "figure", "figcaption", "details", "summary")
    }
}
