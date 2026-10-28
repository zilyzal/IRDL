package app.irdl.companion

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext
import java.net.Inet4Address
import java.net.NetworkInterface

/** Finds the console on the Wi-Fi: the phone's own network, every address on port 9898, asking for the IRDL page. */
object Discovery {
    private fun localPrefixes(): List<String> {
        val found = LinkedHashSet<String>()
        try {
            for (network in NetworkInterface.getNetworkInterfaces().toList()) {
                if (!network.isUp || network.isLoopback) continue
                for (address in network.inetAddresses.toList()) {
                    if (address !is Inet4Address || !address.isSiteLocalAddress) continue
                    val parts = (address.hostAddress ?: continue).split(".")
                    if (parts.size == 4) found.add("${parts[0]}.${parts[1]}.${parts[2]}")
                }
            }
        } catch (error: Exception) {
        }
        return found.toList()
    }

    /** The console's address, or null. Tries [known] first (the address it had last time). */
    suspend fun find(known: String = "", onProgress: (Int) -> Unit = {}): String? = withContext(Dispatchers.IO) {
        if (known.isNotEmpty() && Console.isConsole(known, 1500)) return@withContext known
        val prefixes = localPrefixes()
        val addresses = prefixes.flatMap { prefix -> (1..254).map { "$prefix.$it" } }
        val gate = Semaphore(64)
        var scanned = 0
        coroutineScope {
            val results = addresses.map { address ->
                async {
                    val found = gate.withPermit { if (Console.isConsole(address, 700)) address else null }
                    synchronized(this@Discovery) { scanned++ }
                    onProgress(scanned * 100 / addresses.size.coerceAtLeast(1))
                    found
                }
            }
            results.awaitAll().firstOrNull { it != null }
        }
    }
}
