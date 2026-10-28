package app.irdl.companion

import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/** The console answered, but IRDL is not running on it (only the helper that keeps the phone page up is). */
class ClosedException : IOException("IRDL is closed on the console.")

/** The console does not know this phone (its PIN was changed, or it was never entered). */
class SignedOutException : IOException("Signed out. Enter the PIN again.")

class ApiException(val status: Int, message: String) : IOException(message)

/** The console's phone companion API, over plain HTTP on the local network. Every call blocks: use it off the main thread. */
object Console {
    const val PORT = 9898

    @Volatile var host: String = ""
    @Volatile var cookie: String = ""

    private fun open(method: String, path: String, timeout: Int, hostName: String): HttpURLConnection {
        val connection = URL("http://$hostName:$PORT$path").openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = timeout
        connection.readTimeout = timeout
        connection.useCaches = false
        connection.instanceFollowRedirects = false
        connection.setRequestProperty("X-JBH", "1")
        connection.setRequestProperty("Connection", "close")
        connection.setRequestProperty("Accept", "application/json")
        if (cookie.isNotEmpty()) connection.setRequestProperty("Cookie", "jbh=$cookie")
        return connection
    }

    private fun send(connection: HttpURLConnection, body: JSONObject?) {
        if (body == null) return
        val bytes = body.toString().toByteArray(Charsets.UTF_8)
        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setFixedLengthStreamingMode(bytes.size)
        connection.outputStream.use { it.write(bytes) }
    }

    private fun read(connection: HttpURLConnection): Pair<Int, JSONObject> {
        val status = connection.responseCode
        val stream = if (status >= 400) connection.errorStream else connection.inputStream
        val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
        val json = try { JSONObject(text) } catch (error: Exception) { JSONObject() }
        return status to json
    }

    /** One call: [method] [path], with a JSON body for POST. Throws [ClosedException], [SignedOutException] or [ApiException]. */
    fun call(method: String, path: String, body: JSONObject? = null, timeout: Int = 12000): JSONObject {
        val connection = open(method, path, timeout, host)
        try {
            send(connection, if (method == "POST" && body == null) JSONObject() else body)
            val (status, json) = read(connection)
            if (json.optString("app") == "closed") throw ClosedException()
            if (status == 401) throw SignedOutException()
            if (status >= 400) throw ApiException(status, json.optString("error", "The console answered HTTP $status."))
            return json
        } finally {
            connection.disconnect()
        }
    }

    fun get(path: String, timeout: Int = 12000) = call("GET", path, null, timeout)
    fun post(path: String, body: JSONObject? = null, timeout: Int = 12000) = call("POST", path, body, timeout)
    fun delete(path: String) = call("DELETE", path)

    /** Signs in with the 6-digit PIN; returns the session cookie the console gives this phone (good for a year). */
    fun login(pin: String, hostName: String = host): String {
        val connection = open("POST", "/auth", 10000, hostName)
        try {
            send(connection, JSONObject().put("pin", pin))
            val (status, json) = read(connection)
            if (status == 200) {
                val header = connection.headerFields.entries
                    .firstOrNull { it.key.equals("Set-Cookie", ignoreCase = true) }?.value
                    ?.firstOrNull { it.startsWith("jbh=") }
                    ?: throw ApiException(500, "The console did not give a session.")
                return header.substringAfter("jbh=").substringBefore(";")
            }
            val wait = json.optInt("retryAfter", 0)
            val message = json.optString("error", "Wrong PIN.")
            throw ApiException(status, if (wait > 0 && status == 401) "$message Wait $wait s before the next try." else message)
        } finally {
            connection.disconnect()
        }
    }

    /** True when an IRDL console answers on [hostName] (its page is served without a PIN). */
    fun isConsole(hostName: String, timeout: Int = 900): Boolean {
        return try {
            val connection = URL("http://$hostName:$PORT/").openConnection() as HttpURLConnection
            connection.connectTimeout = timeout
            connection.readTimeout = timeout
            connection.setRequestProperty("Connection", "close")
            try {
                if (connection.responseCode != 200) return false
                val head = connection.inputStream.bufferedReader().use { reader ->
                    val buffer = CharArray(24000)
                    val n = reader.read(buffer)
                    if (n > 0) String(buffer, 0, n) else ""
                }
                head.contains("X-JBH")
            } finally {
                connection.disconnect()
            }
        } catch (error: Exception) {
            false
        }
    }
}

// ---- what the console says, as plain values --------------------------------------------------------------

data class QueueJob(
    val id: String, val gameId: String, val title: String, val state: String,
    val written: Long, val total: Long, val percent: Double, val speed: Long,
    val error: String, val message: String, val part: Int, val parts: Int,
    val actions: List<String>, val extractFailed: Boolean
) {
    val active get() = state in ACTIVE
    val done get() = state in DONE
    val waiting get() = state == "queued"
    companion object {
        val ACTIVE = setOf("resolving", "connecting", "downloading", "verifying", "extracting", "installing", "pausing")
        val DONE = setOf("downloaded", "file-downloaded", "installer-required", "installed", "extraction-required", "extracted", "attention")
        fun of(json: JSONObject) = QueueJob(
            id = json.optString("id"), gameId = json.optString("gameId"), title = json.optString("title"),
            state = json.optString("state"), written = json.optLong("written"), total = json.optLong("total"),
            percent = if (json.isNull("percent")) -1.0 else json.optDouble("percent", -1.0),
            speed = json.optLong("bytesPerSecond"), error = json.optString("error"), message = json.optString("message"),
            part = json.optInt("part"), parts = json.optInt("parts"),
            actions = json.optJSONArray("actions").strings(), extractFailed = json.optBoolean("extractFailed")
        )
    }
}

data class GameCard(val id: String, val title: String, val platform: String, val year: Int, val sizeGb: Double, val cover: String) {
    companion object {
        fun of(json: JSONObject) = GameCard(
            id = json.optString("id"), title = json.optString("title"), platform = json.optString("platform"),
            year = if (json.isNull("year")) 0 else json.optInt("year"),
            sizeGb = if (json.isNull("sizeGb")) 0.0 else json.optDouble("sizeGb"),
            cover = if (json.isNull("cover")) "" else json.optString("cover")
        )
    }
}

data class Source(val name: String, val detail: String, val size: String, val group: String)

data class Drive(val name: String, val free: Long, val total: Long) {
    companion object {
        fun of(json: JSONObject) = Drive(
            name = json.optString("name"),
            free = if (json.isNull("free")) -1 else json.optLong("free"),
            total = if (json.isNull("total")) -1 else json.optLong("total")
        )
    }
}

data class Feed(val url: String, val name: String, val games: Int, val state: String, val error: String) {
    companion object {
        fun of(json: JSONObject) = Feed(
            url = json.optString("url"), name = if (json.isNull("name")) "" else json.optString("name"),
            games = json.optInt("games"), state = json.optString("state"), error = json.optString("error")
        )
    }
}

data class ConsoleSite(val site: String, val games: Int, val links: Int)

fun JSONArray?.strings(): List<String> = if (this == null) emptyList() else List(length()) { optString(it) }
fun <T> JSONArray?.map(block: (JSONObject) -> T): List<T> = if (this == null) emptyList() else List(length()) { block(getJSONObject(it)) }
