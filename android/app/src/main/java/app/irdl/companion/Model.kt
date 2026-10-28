package app.irdl.companion

import android.app.Application
import android.os.SystemClock
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.URLEncoder

data class Dash(
    val version: String = "", val active: QueueJob? = null, val running: Int = 0, val done: Int = 0,
    val failed: Int = 0, val total: Int = 0, val speed: Long = 0, val drives: List<Drive> = emptyList()
)

data class GameDetail(val card: GameCard, val summary: String, val developer: String, val sources: List<Source>, val loading: Boolean)

fun enc(text: String): String = URLEncoder.encode(text, "UTF-8")
fun bare(site: String): String = site.lowercase().removePrefix("www.")

fun message(error: Throwable): String = when (error) {
    is ClosedException, is SignedOutException, is ApiException, is BlockedException -> error.message ?: "Something went wrong."
    is java.net.SocketTimeoutException -> "The request timed out."
    is java.net.ConnectException, is java.net.UnknownHostException, is java.net.NoRouteToHostException -> "Cannot reach the site or the console."
    else -> error.message ?: "Something went wrong."
}

class AppModel(application: Application) : AndroidViewModel(application) {
    enum class Stage { STARTING, SEARCHING, PIN, READY }

    private val context get() = getApplication<Application>()

    // ---- connecting ---------------------------------------------------------------------------------------
    var stage by mutableStateOf(Stage.STARTING)
    var scanPercent by mutableStateOf(0)
    var foundHost by mutableStateOf("")
    var pinError by mutableStateOf("")
    var pinBusy by mutableStateOf(false)
    var notice by mutableStateOf<String?>(null)
    var alerts by mutableStateOf(true)
    var host by mutableStateOf("")

    // ---- what the console says ----------------------------------------------------------------------------
    var dash by mutableStateOf(Dash())
    var jobs by mutableStateOf<List<QueueJob>>(emptyList())

    // ---- games --------------------------------------------------------------------------------------------
    var gamesQuery by mutableStateOf("")
    var games by mutableStateOf<List<GameCard>>(emptyList())
    var gamesTotal by mutableStateOf(0)
    var gamesBusy by mutableStateOf(false)
    var gamesError by mutableStateOf("")
    var detail by mutableStateOf<GameDetail?>(null)
    private var gamesToken = 0

    // ---- sites --------------------------------------------------------------------------------------------
    var consoleSites by mutableStateOf<List<ConsoleSite>>(emptyList())
    var localSites by mutableStateOf<List<AddedSite>>(emptyList())
    var crawlPhase by mutableStateOf("idle") // idle | running | review | saving | done | error
    var crawlProgress by mutableStateOf(CrawlProgress())
    var crawlResult by mutableStateOf<CrawlResult?>(null)
    var crawlMessage by mutableStateOf("")
    var savedGames by mutableStateOf(0)
    private var crawlJob: Job? = null

    private var poller: Job? = null
    private var foreground = false
    private var misses = 0

    init {
        Prefs.init(application)
        Notifier.ensureChannels(application)
        alerts = Prefs.alerts
        host = Console.host
        localSites = Prefs.sites()
        viewModelScope.launch(Dispatchers.IO) { begin() }
    }

    private fun say(text: String) {
        notice = text
    }

    private fun io(block: suspend () -> Unit): Job = viewModelScope.launch(Dispatchers.IO) {
        try {
            block()
        } catch (error: CancellationException) {
            throw error
        } catch (error: SignedOutException) {
            signedOut()
        } catch (error: Exception) {
            say(message(error))
        }
    }

    // ---- start, find the console, PIN, once ----------------------------------------------------------------
    private suspend fun begin() {
        if (!Prefs.paired) {
            scan()
            return
        }
        try {
            Console.get("/api/info", 6000)
        } catch (error: SignedOutException) {
            signedOut()
            return
        } catch (error: Exception) {
            // Closed or not reachable right now: the phone stays paired and the screens say what is going on.
        }
        enterReady()
    }

    suspend fun scan() {
        stage = Stage.SEARCHING
        scanPercent = 0
        val found = Discovery.find(Console.host) { scanPercent = it }
        foundHost = found ?: ""
        pinError = if (found == null) "No console found on this Wi-Fi. Make sure IRDL is open on the console and this phone is on the same network, or type the console's address below." else ""
        stage = Stage.PIN
    }

    fun rescan() {
        viewModelScope.launch(Dispatchers.IO) { scan() }
    }

    fun useAddress(text: String) {
        val address = text.trim().removePrefix("http://").substringBefore("/").substringBefore(":")
        if (address.isEmpty()) return
        pinBusy = true
        viewModelScope.launch(Dispatchers.IO) {
            if (Console.isConsole(address, 3000)) {
                foundHost = address
                pinError = ""
            } else {
                pinError = "No IRDL console answered at $address."
            }
            pinBusy = false
        }
    }

    fun login(pin: String) {
        if (foundHost.isEmpty() || pin.length < 4) return
        pinBusy = true
        pinError = ""
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val cookie = Console.login(pin, foundHost)
                Prefs.saveConsole(foundHost, cookie)
                host = foundHost
                enterReady()
            } catch (error: Exception) {
                pinError = message(error)
            }
            pinBusy = false
        }
    }

    private fun enterReady() {
        host = Console.host
        misses = 0
        stage = Stage.READY
        WatchService.start(context)
        if (foreground) startPolling()
        loadSites()
    }

    private fun signedOut() {
        val address = Console.host
        Prefs.saveConsole(address, "")
        WatchService.stop(context)
        poller?.cancel()
        foundHost = address
        pinError = "The console no longer knows this phone. Enter the PIN again."
        stage = Stage.PIN
    }

    fun disconnect() {
        WatchService.stop(context)
        Notifier.cancel(context, Notifier.WATCH_ID)
        poller?.cancel()
        Prefs.forgetConsole()
        host = ""
        dash = Dash()
        jobs = emptyList()
        consoleSites = emptyList()
        Watch.link.value = Link.UNKNOWN
        rescan()
    }

    // ---- polling while the app is on screen ----------------------------------------------------------------
    fun setForeground(value: Boolean) {
        foreground = value
        if (value && stage == Stage.READY) startPolling()
        if (!value) poller?.cancel()
    }

    private fun startPolling() {
        if (poller?.isActive == true) return
        poller = viewModelScope.launch(Dispatchers.IO) {
            while (isActive) {
                refresh()
                delay(3000)
            }
        }
    }

    fun refreshNow() {
        viewModelScope.launch(Dispatchers.IO) { refresh() }
        Watch.poke.trySend(Unit)
    }

    private fun refresh() {
        try {
            val d = Console.get("/api/dashboard", 8000)
            val list = Console.get("/api/queue", 8000).optJSONArray("jobs").map { QueueJob.of(it) }
            val counts = d.optJSONObject("counts")
            val active = d.optJSONObject("active")
            dash = Dash(
                version = d.optJSONObject("info")?.optString("version") ?: "",
                active = if (active != null) QueueJob.of(active) else null,
                running = counts?.optInt("active") ?: 0, done = counts?.optInt("done") ?: 0,
                failed = counts?.optInt("failed") ?: 0, total = counts?.optInt("total") ?: 0,
                speed = d.optLong("speed"), drives = d.optJSONArray("drives").map { Drive.of(it) }
            )
            jobs = list
            Watch.jobs.value = list
            Watch.link.value = Link.CONNECTED
            misses = 0
        } catch (error: SignedOutException) {
            signedOut()
        } catch (error: ClosedException) {
            Watch.link.value = Link.CLOSED
        } catch (error: IOException) {
            misses++
            if (misses >= 2) Watch.link.value = Link.OFFLINE
        }
    }

    fun launchIrdl() {
        io {
            try {
                Console.post("/api/launch", null, 30000)
            } catch (error: ClosedException) {
                // The helper answers with the closed marker even when it starts the app.
            }
            say("Opening IRDL on the console…")
            repeat(20) {
                delay(1500)
                refresh()
                if (Watch.link.value == Link.CONNECTED) return@io
            }
        }
    }

    // ---- games --------------------------------------------------------------------------------------------
    fun searchGames(query: String, more: Boolean = false) {
        if (more && (gamesBusy || games.size >= gamesTotal)) return
        val token = if (more) gamesToken else ++gamesToken
        if (!more) gamesQuery = query
        val offset = if (more) games.size else 0
        gamesBusy = true
        io {
            try {
                val answer = Console.get("/api/games?q=${enc(query)}&offset=$offset&limit=30")
                val list = answer.optJSONArray("games").map { GameCard.of(it) }
                if (token == gamesToken) {
                    games = if (more) games + list else list
                    gamesTotal = answer.optInt("total")
                    gamesError = ""
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: SignedOutException) {
                throw error
            } catch (error: Exception) {
                if (token == gamesToken) gamesError = message(error)
            } finally {
                if (token == gamesToken) gamesBusy = false
            }
        }
    }

    fun openGame(card: GameCard) {
        detail = GameDetail(card, "", "", emptyList(), true)
        io {
            try {
                val answer = Console.get("/api/game?id=${enc(card.id)}")
                val sources = answer.optJSONArray("sources").map {
                    Source(it.optString("name"), it.optString("detail"), it.optString("size"), it.optString("group"))
                }
                if (detail?.card?.id == card.id)
                    detail = GameDetail(card, answer.optString("summary"), answer.optString("developer"), sources, false)
            } catch (error: CancellationException) {
                throw error
            } catch (error: SignedOutException) {
                throw error
            } catch (error: Exception) {
                if (detail?.card?.id == card.id) detail = GameDetail(card, "", "", emptyList(), false)
                say(message(error))
            }
        }
    }

    fun closeGame() {
        detail = null
    }

    fun download(id: String) {
        io {
            val answer = Console.post("/api/download", JSONObject().put("id", id))
            say("Queued " + answer.optString("title", "the game"))
            refresh()
            Watch.poke.trySend(Unit)
        }
    }

    // ---- the queue ----------------------------------------------------------------------------------------
    fun act(name: String, id: String) {
        io {
            val list = Console.post("/api/queue/$name", JSONObject().put("id", id)).optJSONArray("jobs").map { QueueJob.of(it) }
            jobs = list
            Watch.jobs.value = list
            Watch.poke.trySend(Unit)
        }
    }

    fun bulk(name: String) {
        io {
            val list = Console.post("/api/queue/$name").optJSONArray("jobs").map { QueueJob.of(it) }
            jobs = list
            Watch.jobs.value = list
            Watch.poke.trySend(Unit)
        }
    }

    // ---- sites --------------------------------------------------------------------------------------------
    fun loadSites() {
        io {
            val answer = Console.get("/api/import/sites")
            consoleSites = answer.optJSONArray("sites").map { ConsoleSite(it.optString("site"), it.optInt("games"), it.optInt("links")) }
            localSites = Prefs.sites()
        }
    }

    fun deleteSite(site: String) {
        io {
            Console.delete("/api/import/site?site=${enc(site)}")
            Prefs.sites().filter { bare(it.site) == bare(site) }.forEach { Prefs.dropSite(it.site) }
            loadSites()
            say("Removed $site and its games from the console.")
            if (Prefs.alerts) Notifier.post(context, 30, Notifier.CRAWL, "Catalog removed", "$site and the games it added are gone from the console.")
        }
    }

    private fun progressNote(p: CrawlProgress) {
        if (!Prefs.alerts) return
        if (p.phase == "pages") Notifier.post(context, Notifier.CRAWL_ID, Notifier.CRAWL, "Reading the site", "Page ${p.pages} · ${p.posts} posts found", ongoing = true)
        else Notifier.post(context, Notifier.CRAWL_ID, Notifier.CRAWL, "Reading posts", "${p.postsDone} of ${p.posts} posts · ${p.games} games", ongoing = true, progress = p.postsDone to p.posts)
    }

    fun startCrawl(input: String) {
        val url = normalizeUrl(input)
        if (hostKey(url).isEmpty()) {
            crawlMessage = "Type the address of a site's list of posts, for example https://example.com/category/games/"
            crawlPhase = "error"
            return
        }
        crawlJob?.cancel()
        crawlResult = null
        crawlMessage = ""
        crawlPhase = "running"
        crawlProgress = CrawlProgress(phase = "pages", current = url)
        crawlJob = viewModelScope.launch(Dispatchers.IO) {
            var last = 0L
            try {
                val result = SiteCrawler(url) { p ->
                    crawlProgress = p
                    val now = SystemClock.elapsedRealtime()
                    if (now - last > 800) {
                        last = now
                        progressNote(p)
                    }
                }.run()
                crawlResult = result
                crawlPhase = "review"
                Notifier.cancel(context, Notifier.CRAWL_ID)
                Notifier.post(context, 31, Notifier.CRAWL, "Site read", "${result.pages} pages, ${result.games.size} games found on ${result.site}. Open IRDL to add them to the console.")
            } catch (error: CancellationException) {
                Notifier.cancel(context, Notifier.CRAWL_ID)
                throw error
            } catch (error: Exception) {
                crawlMessage = message(error)
                crawlPhase = "error"
                Notifier.cancel(context, Notifier.CRAWL_ID)
                Notifier.post(context, 31, Notifier.CRAWL, "Site fetch stopped", crawlMessage)
            }
        }
    }

    fun cancelCrawl() {
        crawlJob?.cancel()
        crawlPhase = "idle"
        crawlResult = null
    }

    fun dismissCrawl() {
        crawlPhase = "idle"
        crawlResult = null
        crawlMessage = ""
    }

    /** Sends what the player agreed to, a few games per request, and remembers the site so it can be removed again. */
    fun confirmCrawl() {
        val result = crawlResult ?: return
        crawlPhase = "saving"
        savedGames = 0
        crawlJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                var batch = JSONArray()
                var size = 0
                var sent = 0
                fun flush() {
                    if (batch.length() == 0) return
                    Console.post("/api/import/site-games", JSONObject().put("games", batch), 40000)
                    sent += batch.length()
                    savedGames = sent
                    batch = JSONArray()
                    size = 0
                }
                for (game in result.games) {
                    val json = game.json()
                    val bytes = json.toString().toByteArray(Charsets.UTF_8).size
                    if (size + bytes > 40000 && batch.length() > 0) flush()
                    batch.put(json)
                    size += bytes
                }
                flush()
                Prefs.saveSite(AddedSite(result.site, result.url, System.currentTimeMillis(), result.pages, result.posts, result.games.size))
                localSites = Prefs.sites()
                crawlPhase = "done"
                loadSites()
                if (Prefs.alerts) Notifier.post(context, 32, Notifier.CRAWL, "Catalog added", "${result.games.size} games from ${result.site} are on the console. Restart IRDL there to see them in the store if it was open.")
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                crawlMessage = message(error)
                crawlPhase = "error"
            }
        }
    }

    // ---- settings -----------------------------------------------------------------------------------------
    fun changeAlerts(value: Boolean) {
        Prefs.alerts = value
        alerts = value
    }
}
