package app.irdl.companion

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/** A catalog this phone added from a site: what the phone knows beyond what the console keeps (the console lists a site's games and links). */
data class AddedSite(val site: String, val url: String, val addedAt: Long, val pages: Int, val posts: Int, val games: Int)

object Prefs {
    private lateinit var store: SharedPreferences

    fun init(context: Context) {
        store = context.applicationContext.getSharedPreferences("irdl", Context.MODE_PRIVATE)
        Console.host = store.getString("host", "") ?: ""
        Console.cookie = store.getString("cookie", "") ?: ""
    }

    fun saveConsole(host: String, cookie: String) {
        Console.host = host
        Console.cookie = cookie
        store.edit().putString("host", host).putString("cookie", cookie).apply()
    }

    fun forgetConsole() {
        Console.host = ""
        Console.cookie = ""
        store.edit().remove("host").remove("cookie").apply()
    }

    val paired get() = Console.host.isNotEmpty() && Console.cookie.isNotEmpty()

    var alerts: Boolean
        get() = store.getBoolean("alerts", true)
        set(value) { store.edit().putBoolean("alerts", value).apply() }

    var language: String
        get() = store.getString("language", "en") ?: "en"
        set(value) { store.edit().putString("language", value).apply() }

    fun sites(): List<AddedSite> {
        val array = try { JSONArray(store.getString("sites", "[]")) } catch (error: Exception) { JSONArray() }
        return List(array.length()) {
            val o = array.getJSONObject(it)
            AddedSite(o.optString("site"), o.optString("url"), o.optLong("addedAt"), o.optInt("pages"), o.optInt("posts"), o.optInt("games"))
        }
    }

    fun saveSite(entry: AddedSite) {
        val rest = sites().filter { it.site != entry.site }
        write(listOf(entry) + rest)
    }

    fun dropSite(site: String) = write(sites().filter { it.site != site })

    private fun write(list: List<AddedSite>) {
        val array = JSONArray()
        list.forEach {
            array.put(JSONObject().put("site", it.site).put("url", it.url).put("addedAt", it.addedAt)
                .put("pages", it.pages).put("posts", it.posts).put("games", it.games))
        }
        store.edit().putString("sites", array.toString()).apply()
    }
}
