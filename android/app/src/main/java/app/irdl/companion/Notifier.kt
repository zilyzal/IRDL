package app.irdl.companion

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

object Notifier {
    const val WATCH = "watch"
    const val DOWNLOADS = "downloads"
    const val ALERTS = "alerts"
    const val CRAWL = "crawl"
    const val WATCH_ID = 1
    const val CRAWL_ID = 2

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val manager = context.getSystemService(NotificationManager::class.java)
        fun channel(id: String, name: String, importance: Int, description: String) {
            val channel = NotificationChannel(id, name, importance)
            channel.description = description
            manager.createNotificationChannel(channel)
        }
        channel(WATCH, "Connection", NotificationManager.IMPORTANCE_MIN, "Shows that the phone is watching your console.")
        channel(DOWNLOADS, "Downloads", NotificationManager.IMPORTANCE_DEFAULT, "A download finished, failed or needs you.")
        channel(ALERTS, "Console", NotificationManager.IMPORTANCE_DEFAULT, "The console went away, came back, or needs the PIN again.")
        channel(CRAWL, "Site fetch", NotificationManager.IMPORTANCE_LOW, "Progress and results of reading a whole site.")
    }

    private fun open(context: Context): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }

    fun watching(context: Context, text: String): Notification =
        NotificationCompat.Builder(context, WATCH)
            .setSmallIcon(R.drawable.ic_stat)
            .setContentTitle("IRDL")
            .setContentText(text)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setContentIntent(open(context))
            .build()

    private fun allowed(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    /** Shows (or replaces) a notification. [progress] is (done, total) for a bar; [ongoing] keeps it from being swiped away. */
    fun post(
        context: Context, id: Int, channel: String, title: String, text: String,
        ongoing: Boolean = false, progress: Pair<Int, Int>? = null
    ) {
        if (!allowed(context)) return
        val builder = NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_stat)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setAutoCancel(!ongoing)
            .setOngoing(ongoing)
            .setOnlyAlertOnce(ongoing)
            .setContentIntent(open(context))
        if (progress != null) builder.setProgress(progress.second.coerceAtLeast(1), progress.first, false)
        try {
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.notify(id, builder.build())
        } catch (error: SecurityException) {
        }
    }

    fun cancel(context: Context, id: Int) {
        context.getSystemService(NotificationManager::class.java).cancel(id)
    }
}
