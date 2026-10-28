package app.irdl.companion

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import java.io.IOException
import kotlinx.coroutines.Job as CoroutineJob

enum class Link { UNKNOWN, CONNECTED, CLOSED, OFFLINE, SIGNED_OUT }

/** What the watcher last saw, shared with the screens so the queue is asked for once, not twice. */
object Watch {
    val jobs = MutableStateFlow<List<QueueJob>>(emptyList())
    val link = MutableStateFlow(Link.UNKNOWN)
    val poke = Channel<Unit>(Channel.CONFLATED)
}

/** Keeps the phone watching the console's queue while the app is closed, and tells you when something needs you. */
class WatchService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var loop: CoroutineJob? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Prefs.init(this)
        Notifier.ensureChannels(this)
        val note = Notifier.watching(this, "Watching your console")
        if (Build.VERSION.SDK_INT >= 34) startForeground(Notifier.WATCH_ID, note, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        else startForeground(Notifier.WATCH_ID, note)
        if (loop == null) loop = scope.launch { watch() }
        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    private suspend fun watch() {
        var known: Map<String, String>? = null
        var misses = 0
        var announcedOffline = false
        var announcedClosed = false
        var lastText = ""
        while (scope.isActive) {
            if (!Prefs.paired) {
                stopSelf()
                return
            }
            try {
                val list = Console.get("/api/queue", 6000).optJSONArray("jobs").map { QueueJob.of(it) }
                misses = 0
                if (announcedOffline && Prefs.alerts) Notifier.post(this, 20, Notifier.ALERTS, "Console is back", "Your PS5 is reachable again.")
                announcedOffline = false
                announcedClosed = false
                Watch.link.value = Link.CONNECTED
                Watch.jobs.value = list
                known = alert(known, list)
                val active = list.count { it.active }
                val queued = list.count { it.waiting }
                val speed = list.sumOf { it.speed }
                val text = when {
                    active > 0 -> "Downloading $active" + (if (queued > 0) " · $queued waiting" else "") + " · " + speedText(speed)
                    queued > 0 -> "$queued waiting in the queue"
                    else -> "Connected to your console"
                }
                if (text != lastText) {
                    lastText = text
                    Notifier.post(this, Notifier.WATCH_ID, Notifier.WATCH, "IRDL", text, ongoing = true)
                }
            } catch (error: SignedOutException) {
                Watch.link.value = Link.SIGNED_OUT
                if (Prefs.alerts) Notifier.post(this, 21, Notifier.ALERTS, "Sign in again", "The console no longer knows this phone. Open IRDL and enter the PIN.")
                stopSelf()
                return
            } catch (error: ClosedException) {
                Watch.link.value = Link.CLOSED
                if (!announcedClosed && Prefs.alerts) Notifier.post(this, 22, Notifier.ALERTS, "IRDL is closed", "IRDL is not running on the console. Open the app to open it again.")
                announcedClosed = true
            } catch (error: IOException) {
                misses++
                if (misses == 5 || misses > 5 && misses % 30 == 0) rediscover()
                if (misses >= 3) {
                    Watch.link.value = Link.OFFLINE
                    if (!announcedOffline && Prefs.alerts) Notifier.post(this, 20, Notifier.ALERTS, "Console not reachable", "The phone cannot reach your PS5 on this network.")
                    announcedOffline = true
                }
            }
            withTimeoutOrNull(4000) { Watch.poke.receive() }
        }
    }

    /** The console may have a new address on the router: look for it and keep the same session. */
    private suspend fun rediscover() {
        val found = Discovery.find() ?: return
        if (found != Console.host) {
            Prefs.saveConsole(found, Console.cookie)
            if (Prefs.alerts) Notifier.post(this, 23, Notifier.ALERTS, "Console found again", "Your PS5 is now at $found.")
        }
    }

    /** Notifies about every job whose state changed since the last look; returns the states now. */
    private fun alert(before: Map<String, String>?, list: List<QueueJob>): Map<String, String> {
        val now = list.associate { it.id to it.state }
        if (before == null || !Prefs.alerts) return now
        for (job in list) {
            val was = before[job.id] ?: continue
            if (was == job.state) continue
            val id = 100 + (job.id.hashCode() and 0xffff)
            when {
                job.state == "failed" && was != "failed" ->
                    Notifier.post(this, id, Notifier.DOWNLOADS, "Download failed", job.title + (if (job.error.isNotEmpty()) "\n" + job.error.take(160) else ""))
                job.state == "awaiting-browser" ->
                    Notifier.post(this, id, Notifier.DOWNLOADS, "Needs the console's browser", job.title + "\nOpen it on the console to pass the site's check.")
                job.state == "installer-required" ->
                    Notifier.post(this, id, Notifier.DOWNLOADS, "Ready to install", job.title)
                job.state == "attention" ->
                    Notifier.post(this, id, Notifier.DOWNLOADS, "Needs a look", job.title + (if (job.error.isNotEmpty()) "\n" + job.error.take(160) else ""))
                job.done && was !in QueueJob.DONE ->
                    Notifier.post(this, id, Notifier.DOWNLOADS, "Download finished", job.title)
            }
        }
        return now
    }

    companion object {
        fun start(context: Context) {
            if (!Prefs.paired) return
            ContextCompat.startForegroundService(context, Intent(context, WatchService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, WatchService::class.java))
        }
    }
}

fun speedText(bytesPerSecond: Long): String = when {
    bytesPerSecond <= 0 -> "idle"
    bytesPerSecond >= 1_000_000 -> String.format("%.1f MB/s", bytesPerSecond / 1_000_000.0)
    else -> String.format("%d KB/s", bytesPerSecond / 1000)
}
