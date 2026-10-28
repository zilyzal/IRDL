# IRDL installation guide

IRDL 1.2.0 · Title ID `PPSA99573`

> [!WARNING]
> **Download only what you own or have permission to access.** You are responsible for what you
> download. IRDL hosts nothing; see the
> [Content Neutrality & DMCA Notice](README.md#content-neutrality--dmca-notice).

## What you need

- A **jailbroken PS5** with **kstuff**, running **[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)**
  (it finds `.exfat` images in a `homebrew` folder and installs them).
- An **ELF loader on port 9021** (or a resident Lapy). It gives IRDL file access to `/data` and
  your USB drives. Without it the app opens but stays inside its own sandbox.
- **`IRDL.exfat`** from the [latest release](https://github.com/zilyzal/IRDL/releases/latest),
  and an exFAT USB drive, or an FTP client that can reach the console.

Tested on firmware **13.60** with kstuff and ShadowMount+. Other setups may work but are unchecked.

## Install

**USB drive:** on the top level of an exFAT drive, create a folder named exactly `homebrew`, copy
`IRDL.exfat` into it (unzipped, still ending in `.exfat`), and plug the drive into the PS5.

**FTP:** upload `IRDL.exfat` to `/data/homebrew/IRDL.exfat` in binary mode.

ShadowMount+ installs it within a minute and shows a notification. Then open **IRDL** from the
home screen.

IRDL has its own title ID, so it installs next to Overdrive. If an older IRDL image with
the same ID is in a `homebrew` folder, remove it first so only one image claims the ID.

## Updating

- **From 0.4.1 on,** the app updates itself: a badge with the new version appears in the top bar. Select
  it, then **Download and install** (or turn on **Settings → About → Install updates automatically**).
  Each file is checked against GitHub's SHA-256 before it is used, and if the new version doesn't start,
  the old one is put back.
- **From 0.4.0 or earlier,** install by hand once: copy the new `IRDL.exfat` over the old one in
  `homebrew`, then open it. (Those versions used another title ID, so an in-app update can't cross over.)
  Your **download list and play time carry over**; **settings, favorites, feeds and your TorBox API key
  start fresh**, so set them up again. The old home-screen icon can be deleted.
- **By hand at any time:** close IRDL and copy the new `IRDL.exfat` over the old one.

**Removing:** delete `IRDL.exfat` from `homebrew` first, then the home-screen icon (the other way
round, ShadowMount+ puts the icon back).

## First launch

The **Terms of Use** appear on every launch; press <kbd>✕</kbd> on **Continue**. The first start can take a
few seconds longer while the app gets file access. Open **Settings** with the gear at the right of the top
bar; <kbd>L1</kbd> <kbd>R1</kbd> switch sections and <kbd>○</kbd> goes back or closes.

## Phone companion

A live dashboard, games, the download queue (pause or resume everything, move a game to the top), your feeds
and your library (export and import it as a file), from your phone. The console serves it, so there is nothing to install.

1. The companion is **on by default**, and so is **Keep it on when IRDL is closed**. **Settings → Phone
   companion & remote access** shows the address and the PIN.
2. The PIN is **989898** until you change it (**Change PIN**; repeated digits like `111111` and runs like
   `123456` are refused).
3. On a phone on the **same Wi-Fi**, open the address shown on the card (usually port `9898`) and enter the
   PIN. The **Import** tab is the first page.

Change the PIN under **Change PIN** in the same card; every phone is signed out. Wrong PINs are slowed
down and the companion locks after 20 (switch it off and on to unlock).

**While IRDL is closed (experimental):** turn on **Keep it on when IRDL is closed** in the same
card. A small helper (it needs the ELF loader on port 9021) then answers on the same address with the same
PIN whenever the app is closed: open IRDL from your phone, see the queue, and run installed payloads.
It steps aside while the app runs, and stops when you switch it off (or the console restarts; open
IRDL once to start it again).

> [!IMPORTANT]
> Anyone on your network who knows the PIN can sign in while the companion is on, and 989898 is the same on
> every console. Change it, and keep the companion off on a shared network.

## Importing a game from a post page

(The same steps are in **Settings → Source Addition Guide**, under the phone import guide.)

The phone companion's **Import** tab turns a post page into a game in your store, with its cover, title and
Title ID, so you don't type a catalog by hand. Use it only for pages whose downloads you have the right to
use.

1. Open the companion on your phone (see above), or on the console itself at `http://localhost:9898` in its web
   browser (same PIN), and tap **Import**.
2. Paste into the one box and tap **Fetch**. It takes a post's address, download links (any order, one per
   line), or both. The console reads the page itself (your phone's browser cannot, sites don't allow it), which
   takes a few seconds. Pasted links are sorted into parts and shown first; with no page, the game's name is
   taken from the file names and you type the Title ID.
3. Check the **title** and **Title ID**. If the page has no Title ID, type it in (`PPSA12345` or `CUSA12345`); Save stays
   off until it is valid. The cover is found from the Title ID; a game without one gets a colour tile.
4. Under **Batches** you get one card per version found on the page, each with its hosts and part counts.
   Parts of one multipart set stay in one batch; different sets are separate batches.
   - Untick a batch to leave it out, or tap **Keep only this batch**.
   - The chips under the batch cards drop a host (say, one you don't use) from every batch at once.
   - **Show links** lists exactly what will be saved. A warning appears when a part is missing from a set.
   - If an archive is locked, type its password in the batch's **Archive password** box (optional).
   - Only `.rar` volumes become batches. Other links to file hosts on the page appear apart, under **Not .rar**,
     switched off.
5. Tap **Save**. The game is in the store at once, with a pop-up showing its cover and a **Download** button.
   If adding it live ever fails, reopen IRDL on the console and it will be there.

Importing a game again adds the new batches in front of the old ones; the newest link is the default download,
and the sources list shows the site each link came from.

**Saved games** at the bottom of the tab lists what you have kept:

- **Edit** changes the title, renames and reorders batches (the first is the default download), deletes single
  links or whole batches, and adds links as a new batch.
- **Fetch again** re-reads the game's page. **Remove** takes it out.

**Upload a catalog.** Under the saved games, choose a `.json` file (or paste it) in the [feed format](FEEDS.md): a
feed object, a list of games, or one game. It is sent in small pieces and every game joins the store at once.

**Persian.** The فا / EN button at the top of the phone page switches it to Persian, laid out right to left.

**If the site refuses the console** (some sites block anything but a browser), open the page on your phone,
copy its download links, and paste them into the same box (with or without the address). Links, or the
page's source, work.

The importer recognises the common file hosts, but it can't know every page layout. If a page splits wrongly,
use **Show links** to see what it found, and edit the batch name on its card, or fix it afterwards with **Edit**.

## Catalog feeds

A feed is a JSON file at an `http(s)` address that adds games or sources (up to 4 feeds, 2 MiB each).
The format is in **[FEEDS.md](FEEDS.md)**; add only feeds for content you have the right to download.

- **On the console:** **Settings → Catalog feeds → Add a feed**, type the full address of the `.json`
  file and confirm.
- **From your phone:** the companion's **Feeds** tab, paste the address and tap **Add**.
- **Mirrors:** add another address that serves the same feed (**Add a mirror** on the feed, up to 4). If
  the feed's own domain goes down, a refresh uses a mirror, and the last good copy stays on the console.

Feeds refresh a few seconds after launch (or **Refresh feeds**); new games show the next time you open the
app.

## Downloading

1. Open a game, choose **Download**, then pick the source and the drive.
2. Follow it on the **Downloads** page (the download icon in the top bar). <kbd>□</kbd> pauses or resumes,
   <kbd>△</kbd> opens the game page.
3. Finished games install through ShadowMount+, which waits until no game is open: **close IRDL** to
   let it finish.

The DualSense light shows the queue: slow breath = idle, green = downloading, amber = paused, red = failed
(turn it off under **Settings → Look & feel**).

**TorBox (optional):** in **Settings → Debrid providers** enter your TorBox API key and select **Test
connection**. Sources on hosts TorBox supports then get a **TorBox** button that downloads in the app with
no browser step.

## Troubleshooting

- **It doesn't appear on the home screen:** check ShadowMount+ is running, the folder is named exactly
  `homebrew` at the top level, the file still ends in `.exfat` (a PC can leave `.exfat.zip`), and give it a
  minute while the copy finishes.
- **A USB drive shows no space or won't download:** make sure the ELF loader (port 9021) was running when
  the app started, then reopen the app.
- **The phone can't open the address:** use the exact address on the card; the phone and PS5 must be on the
  same network (guest networks and "AP isolation" block it).
- **Forgot the PIN:** it is shown on the phone companion card while it is on, or choose **Change PIN**.
- **A feed failed:** `HTTP 404` means a wrong address, `Not JSON` means the address is a web page rather
  than the `.json` file, and `No usable games` means check the fields against [FEEDS.md](FEEDS.md).
- **"This archive can't be extracted on the console":** the archive needs more memory to unpack than the app can use (a very large compression dictionary). Pick another source, or unpack it on a PC.
- **"The archive's password is missing or wrong":** open the game's **Edit** on the phone and set the batch's password.
- **Downloads fail or stall:** lower **Settings → Downloads → Connections per download**; some links dislike many connections.
- **Something else:** the app keeps a debug log at `/data/ps5-react/PPSA99573/logs/jobeeslair.log`
  (readable over FTP, with keys, tokens and addresses blanked out). Attach it to a bug report.
