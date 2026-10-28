package app.irdl.companion

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import java.text.DateFormat
import java.util.Date

@Composable
fun IrdlApp(model: AppModel) {
    IrdlTheme {
        Surface(color = Ink.canvas, modifier = Modifier.fillMaxSize()) {
            when (model.stage) {
                AppModel.Stage.STARTING -> Centered { Logo(72); Spacer(16); Text("IRDL", color = Ink.fg, fontSize = 22.sp, fontWeight = FontWeight.Bold) }
                AppModel.Stage.SEARCHING -> Centered {
                    Logo(72); Spacer(16)
                    Text("Looking for your console", color = Ink.fg, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(12)
                    Bar(model.scanPercent / 100f, Modifier.padding(horizontal = 48.dp))
                    Spacer(8)
                    Note("Scanning this Wi-Fi network…")
                }
                AppModel.Stage.PIN -> PinScreen(model)
                AppModel.Stage.READY -> Main(model)
            }
        }
    }
}

@Composable
fun Centered(content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { content() }
}

@Composable
fun Logo(size: Int) {
    androidx.compose.foundation.Image(painterResource(R.drawable.logo_fg), contentDescription = "IRDL", modifier = Modifier.size(size.dp))
}

// ---- first run: the PIN, once ---------------------------------------------------------------------------------

@Composable
fun PinScreen(model: AppModel) {
    var pin by rememberSaveable { mutableStateOf("") }
    var address by rememberSaveable { mutableStateOf("") }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(24)
        Logo(88)
        Text("Connect to your console", color = Ink.fg, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        if (model.foundHost.isNotEmpty()) {
            Panel {
                Label("Console found", model.foundHost)
                Note("Enter the 6-digit PIN shown in IRDL on the console (Settings → Phone companion). You only need to do this once; this phone stays connected.")
                Field(pin, { pin = it.filter(Char::isDigit).take(6) }, "PIN", keyboard = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), secret = true)
                Primary(if (model.pinBusy) "Connecting…" else "Connect", Modifier.fillMaxWidth(), enabled = !model.pinBusy && pin.length >= 4) { model.login(pin) }
            }
        }
        if (model.pinError.isNotEmpty()) Note(model.pinError, Ink.bad)
        Panel {
            Label(if (model.foundHost.isEmpty()) "Type the console's address" else "Not your console?")
            Field(address, { address = it }, "Console IP, for example 192.168.1.20", keyboard = KeyboardOptions(keyboardType = KeyboardType.Uri))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Ghost("Use this address", Modifier.weight(1f), enabled = address.isNotBlank() && !model.pinBusy) { model.useAddress(address) }
                Ghost("Scan again", Modifier.weight(1f)) { model.rescan() }
            }
        }
    }
}

// ---- main ---------------------------------------------------------------------------------------------------

private enum class Tab(val title: String) { HOME("Home"), GAMES("Games"), QUEUE("Queue"), SITES("Sites"), SETTINGS("Settings") }

@Composable
fun Main(model: AppModel) {
    var tab by rememberSaveable { mutableStateOf(Tab.HOME.name) }
    val current = Tab.valueOf(tab)
    val snackbar = remember { SnackbarHostState() }
    val link by Watch.link.collectAsState()
    LaunchedEffect(model.notice) {
        val text = model.notice
        if (text != null) {
            snackbar.showSnackbar(text)
            model.notice = null
        }
    }
    Scaffold(
        containerColor = Ink.canvas,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            Row(Modifier.fillMaxWidth().background(Ink.deep).padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Logo(34)
                Column(Modifier.weight(1f)) {
                    Text("IRDL", color = Ink.fg, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("by Zilyzal", color = Ink.subtle, fontSize = 11.sp)
                }
                val (text, color) = when (link) {
                    Link.CONNECTED -> "Connected" to Ink.good
                    Link.CLOSED -> "IRDL closed" to Ink.warn
                    Link.OFFLINE -> "Offline" to Ink.bad
                    else -> "Connecting" to Ink.subtle
                }
                Text(text, color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        },
        bottomBar = {
            NavigationBar(containerColor = Ink.deep) {
                Tab.values().forEach { item ->
                    NavigationBarItem(
                        selected = item == current, onClick = { tab = item.name },
                        icon = {
                            when (item) {
                                Tab.HOME -> Icon(Icons.Filled.Home, item.title)
                                Tab.GAMES -> Icon(Icons.Filled.Search, item.title)
                                Tab.QUEUE -> Icon(painterResource(R.drawable.ic_stat), item.title)
                                Tab.SITES -> Icon(Icons.Filled.Add, item.title)
                                Tab.SETTINGS -> Icon(Icons.Filled.Settings, item.title)
                            }
                        },
                        label = { Text(item.title, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = Ink.canvas, selectedTextColor = Ink.ice, indicatorColor = Ink.ice, unselectedIconColor = Ink.subtle, unselectedTextColor = Ink.subtle)
                    )
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (current) {
                Tab.HOME -> HomeScreen(model, link)
                Tab.GAMES -> GamesScreen(model)
                Tab.QUEUE -> QueueScreen(model)
                Tab.SITES -> SitesScreen(model)
                Tab.SETTINGS -> SettingsScreen(model)
            }
        }
    }
    model.detail?.let { GameDialog(model, it) }
}

@Composable
fun HomeScreen(model: AppModel, link: Link) {
    val d = model.dash
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (link == Link.CLOSED) Panel {
            Label("IRDL is closed on the console")
            Note("Only the helper is running. Open IRDL from here to use the store and downloads.")
            Primary("Open IRDL on the console", Modifier.fillMaxWidth()) { model.launchIrdl() }
        }
        if (link == Link.OFFLINE) Panel {
            Label("Console not reachable")
            Note("The phone cannot reach ${model.host}. Is the PS5 on and on this Wi-Fi? The phone keeps trying and will tell you when it is back.")
            Ghost("Try now", Modifier.fillMaxWidth()) { model.refreshNow() }
        }
        Panel {
            Label("Downloading", if (d.speed > 0) speedText(d.speed) else "")
            val active = d.active
            if (active == null) Note(if (d.running > 0) "${d.running} waiting in the queue" else "Nothing is downloading.")
            else JobBody(active)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Stat("Active", d.running.toString(), Modifier.weight(1f))
            Stat("Done", d.done.toString(), Modifier.weight(1f))
            Stat("Failed", d.failed.toString(), Modifier.weight(1f), if (d.failed > 0) Ink.bad else Ink.fg)
        }
        Panel {
            Label("Storage")
            if (d.drives.isEmpty()) Note("No drives reported.")
            d.drives.forEach { drive ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(drive.name, color = Ink.fg, fontSize = 14.sp)
                    Text(if (drive.free >= 0) sizeText(drive.free) + " free" + (if (drive.total > 0) " of " + sizeText(drive.total) else "") else "unknown", color = Ink.muted, fontSize = 13.sp)
                }
                if (drive.free >= 0 && drive.total > 0) Bar(1f - drive.free.toFloat() / drive.total.toFloat(), color = Ink.accent)
            }
        }
        Note("IRDL ${d.version} · console ${model.host}", Ink.subtle)
    }
}

@Composable
fun Stat(name: String, value: String, modifier: Modifier, color: Color = Ink.fg) {
    Column(modifier.background(Ink.panel, Corner).padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = color, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text(name, color = Ink.subtle, fontSize = 12.sp)
    }
}

// ---- games ----------------------------------------------------------------------------------------------------

@Composable
fun GamesScreen(model: AppModel) {
    var query by rememberSaveable { mutableStateOf(model.gamesQuery) }
    LaunchedEffect(query) {
        if (model.games.isEmpty() || query != model.gamesQuery) {
            delay(if (model.games.isEmpty() && query.isEmpty()) 0 else 350)
            model.searchGames(query)
        }
    }
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Spacer(8)
        Field(query, { query = it }, "Search the console's games")
        if (model.gamesError.isNotEmpty()) Note(model.gamesError, Ink.bad)
        if (model.games.isEmpty() && !model.gamesBusy && model.gamesError.isEmpty()) Note("No games found.")
        LazyVerticalGrid(GridCells.Adaptive(112.dp), Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(model.games, key = { it.id }) { game ->
                if (game === model.games.lastOrNull()) LaunchedEffect(game.id, model.games.size) { model.searchGames(model.gamesQuery, more = true) }
                Column(Modifier.clickable { model.openGame(game) }.background(Ink.panel, Corner)) {
                    Cover(game.cover, Modifier.fillMaxWidth().aspectRatio(3f / 4f))
                    Text(game.title, color = Ink.fg, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(8.dp))
                }
            }
        }
    }
}

@Composable
fun Cover(url: String, modifier: Modifier) {
    if (url.isEmpty()) Box(modifier.background(Ink.panel2))
    else AsyncImage(model = url, contentDescription = null, contentScale = ContentScale.Crop, modifier = modifier.clip(Corner).background(Ink.panel2))
}

@Composable
fun GameDialog(model: AppModel, detail: GameDetail) {
    val card = detail.card
    AlertDialog(
        onDismissRequest = { model.closeGame() },
        containerColor = Ink.panel,
        title = { Text(card.title, color = Ink.fg, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Cover(card.cover, Modifier.size(width = 96.dp, height = 128.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Note(listOfNotNull(card.platform.uppercase().ifEmpty { null }, card.year.takeIf { it > 0 }?.toString(), card.sizeGb.takeIf { it > 0 }?.let { String.format(java.util.Locale.US, "%.1f GB", it) }).joinToString(" · "))
                        if (detail.developer.isNotEmpty()) Note(detail.developer, Ink.subtle)
                    }
                }
                if (detail.summary.isNotEmpty()) Note(detail.summary)
                if (detail.loading) Bar(null)
                if (detail.sources.isNotEmpty()) Label("Sources", detail.sources.size.toString())
                detail.sources.forEach { source ->
                    Column {
                        Text(source.name, color = Ink.fg, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Note(listOf(source.detail, source.size).filter { it.isNotEmpty() }.joinToString(" · "), Ink.subtle)
                    }
                }
            }
        },
        confirmButton = { Primary("Download", enabled = !detail.loading) { model.download(card.id); model.closeGame() } },
        dismissButton = { TextButton({ model.closeGame() }) { Text("Close", color = Ink.muted) } }
    )
}

// ---- queue ----------------------------------------------------------------------------------------------------

@Composable
fun JobBody(job: QueueJob) {
    Text(job.title, color = Ink.fg, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
    val color = when {
        job.state == "failed" -> Ink.bad
        job.done -> Ink.good
        job.state == "paused" -> Ink.warn
        else -> Ink.ice
    }
    Text(prettyState(job.state) + if (job.parts > 1) " · part ${job.part} of ${job.parts}" else "", color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    if (job.active || job.state == "paused" || job.state == "queued") {
        Bar(if (job.percent >= 0) (job.percent / 100.0).toFloat() else null, color = color)
        val bytes = if (job.total > 0) sizeText(job.written) + " of " + sizeText(job.total) else if (job.written > 0) sizeText(job.written) else ""
        val line = listOf(bytes, if (job.percent >= 0) String.format(java.util.Locale.US, "%.0f%%", job.percent) else "", if (job.speed > 0) speedText(job.speed) else "").filter { it.isNotEmpty() }.joinToString(" · ")
        if (line.isNotEmpty()) Note(line)
    }
    if (job.error.isNotEmpty()) Note(job.error, Ink.bad)
    else if (job.message.isNotEmpty()) Note(job.message, Ink.subtle)
}

private val ACTION_NAMES = linkedMapOf("pause" to "Pause", "resume" to "Resume", "top" to "To top", "browser" to "Open in browser", "cancel" to "Cancel", "clear" to "Remove")

@Composable
fun QueueScreen(model: AppModel) {
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Spacer(8)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Ghost("Pause all", Modifier.weight(1f)) { model.bulk("pause-all") }
            Ghost("Resume all", Modifier.weight(1f)) { model.bulk("resume-all") }
        }
        if (model.jobs.isEmpty()) Note("The queue is empty. Pick a game in the Games tab to download it.")
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(model.jobs, key = { it.id }) { job ->
                Panel {
                    JobBody(job)
                    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ACTION_NAMES.forEach { (action, name) ->
                            if (action in job.actions) Ghost(name, danger = action == "cancel") { model.act(action, job.id) }
                        }
                    }
                }
            }
            item { Spacer(8) }
        }
    }
}

// ---- sites: fetch a whole catalog, see what was added, delete it ----------------------------------------------

@Composable
fun SitesScreen(model: AppModel) {
    var address by rememberSaveable { mutableStateOf("") }
    var confirm by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { model.loadSites() }
    val phase = model.crawlPhase
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Panel {
            Label("Fetch a whole site")
            Note("Paste the address of a site's list of games (a category or archive page). The phone reads every page of the list and every post on it, finds the games and their download links, and asks before anything goes to the console.")
            Field(address, { address = it }, "https://example.com/category/ps5/", keyboard = KeyboardOptions(keyboardType = KeyboardType.Uri), single = true)
            Primary("Fetch the site", Modifier.fillMaxWidth(), enabled = address.isNotBlank() && phase != "running" && phase != "saving") { model.startCrawl(address) }
        }
        val p = model.crawlProgress
        when (phase) {
            "running" -> Panel {
                Label(if (p.phase == "pages") "Reading pages" else "Reading posts")
                if (p.phase == "pages") {
                    Bar(null)
                    Note("Page ${p.pages} · ${p.posts} posts found")
                } else {
                    Bar(if (p.posts > 0) p.postsDone.toFloat() / p.posts else null)
                    Note("Post ${p.postsDone} of ${p.posts} · ${p.games} games" + (if (p.noId > 0) " · ${p.noId} without a Title ID" else "") + (if (p.failed > 0) " · ${p.failed} failed" else ""))
                }
                if (p.current.isNotEmpty()) Note(p.current, Ink.subtle)
                Ghost("Cancel", Modifier.fillMaxWidth(), danger = true) { model.cancelCrawl() }
            }
            "review" -> model.crawlResult?.let { r ->
                Panel {
                    Label("Ready to add", r.site)
                    Text("${r.pages} pages · ${r.posts} posts", color = Ink.fg, fontSize = 15.sp)
                    Text("${r.games.size} games · ${r.batches} batches of links", color = Ink.ice, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    if (r.noId > 0) Note("${r.noId} posts had no Title ID and were skipped.", Ink.warn)
                    if (r.failed > 0) Note("${r.failed} posts could not be read.", Ink.warn)
                    Note("Several versions of the same game are added as separate sources on the console's download page.")
                    if (r.games.isEmpty()) Ghost("Close", Modifier.fillMaxWidth()) { model.dismissCrawl() }
                    else Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Primary("Add ${r.games.size} games to the console", Modifier.weight(2f)) { model.confirmCrawl() }
                        Ghost("Discard", Modifier.weight(1f)) { model.dismissCrawl() }
                    }
                }
            }
            "saving" -> Panel {
                Label("Adding to the console")
                val total = model.crawlResult?.games?.size ?: 0
                Bar(if (total > 0) model.savedGames.toFloat() / total else null)
                Note("${model.savedGames} of $total games")
            }
            "done" -> Panel {
                Label("Added")
                Note("The games are on the console. If IRDL was open there, restart it to see them in the store.", Ink.good)
                Ghost("OK", Modifier.fillMaxWidth()) { model.dismissCrawl() }
            }
            "error" -> Panel {
                Label("Could not finish")
                Note(model.crawlMessage, Ink.bad)
                Ghost("Close", Modifier.fillMaxWidth()) { model.dismissCrawl() }
            }
        }
        Label("Added sites", model.consoleSites.size.toString())
        if (model.consoleSites.isEmpty()) Note("No site catalogs yet.")
        model.consoleSites.forEach { site ->
            val local = model.localSites.firstOrNull { bare(it.site) == bare(site.site) }
            Panel {
                Text(site.site, color = Ink.fg, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Note("${site.games} games · ${site.links} links" + if (local != null) " · added " + DateFormat.getDateInstance().format(Date(local.addedAt)) else "")
                if (local != null) Note("${local.pages} pages and ${local.posts} posts were read", Ink.subtle)
                Ghost("Delete this catalog", Modifier.fillMaxWidth(), danger = true) { confirm = site.site }
            }
        }
    }
    confirm?.let { site ->
        val info = model.consoleSites.firstOrNull { it.site == site }
        AlertDialog(
            onDismissRequest = { confirm = null },
            containerColor = Ink.panel,
            title = { Text("Delete $site?", color = Ink.fg) },
            text = { Note("This removes ${info?.games ?: 0} games' links from this site from the console too. Games with links from other sites stay.") },
            confirmButton = { TextButton({ model.deleteSite(site); confirm = null }) { Text("Delete", color = Ink.bad, fontWeight = FontWeight.Bold) } },
            dismissButton = { TextButton({ confirm = null }) { Text("Keep", color = Ink.muted) } }
        )
    }
}

// ---- settings -------------------------------------------------------------------------------------------------

@Composable
fun SettingsScreen(model: AppModel) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Panel {
            Label("Notifications")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Tell me what happens", color = Ink.fg, fontSize = 15.sp)
                    Note("Downloads that finish, fail or need you, the console going away or coming back, and site fetches.", Ink.subtle)
                }
                Switch(model.alerts, { model.changeAlerts(it) }, colors = SwitchDefaults.colors(checkedTrackColor = Ink.ice, checkedThumbColor = Ink.canvas))
            }
        }
        Panel {
            Label("Console", model.host)
            Note("This phone is signed in and stays connected; the PIN is not asked again.")
            Ghost("Open IRDL on the console", Modifier.fillMaxWidth()) { model.launchIrdl() }
            Ghost("Disconnect this phone", Modifier.fillMaxWidth(), danger = true) { model.disconnect() }
        }
        Panel {
            Label("About")
            Note("IRDL companion for Android, by Zilyzal. Open source; nothing here has been tested on a real console.", Ink.subtle)
        }
    }
}
