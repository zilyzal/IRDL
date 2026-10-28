package app.irdl.companion

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** After a restart the phone starts watching the console again without opening the app. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        Prefs.init(context)
        try {
            WatchService.start(context)
        } catch (error: Exception) {
        }
    }
}
