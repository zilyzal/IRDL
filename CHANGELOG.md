# Changelog

What changed in each version of IRDL. Each [release](https://github.com/zilyzal/IRDL/releases) carries its
files and their SHA-256 checksums.

## 1.2.7

### New

- **Queue management from the phone:** Pause all, Resume all and Move to top.
- **Export library / Import library** on the phone (Shortcuts), to save your games as a file and add them back.
- **Resume extraction:** a download whose extraction failed offers **Extract again** instead of downloading
  again.
- **Disk space check:** a download refuses to start when the drive has too little room, and says how much is
  needed.
- The full download size is read as early as possible; while it is only an estimate it is shown with a `~`.
- The update window is easier to read: a fixed-position progress bar, a readable changelog and a cleaner layout.

### Changed

- The Homebrew section is removed from the app and the phone, along with the remote tab and the green dot.
  The version now sits next to the language button. "On the console" is now **Shortcuts**.
- After an update the app waits a few seconds longer before it opens again.

### Fixed

- Opening IRDL from the phone page while the app is closed no longer shows a false error.

## 1.2.6

### New

- **The phone stays signed in.** After the PIN is entered once, the phone is remembered for a year (until the
  PIN is changed), also while the app is closed.

### Fixed

- Editing a game from the phone no longer pops up "added" for it.
- A game you renamed keeps its name when the same game is imported again.
- Typing a title before the Title ID lookup finishes no longer gets it overwritten.
- A catalog upload measures each game in bytes, so a game with non-English text is not sent past the console's
  request limit.
- A game keeps at most 64 links everywhere, as the feed format allows.

## 1.2.5

### Changed

- **1024 MiB limit after downloading.** RAR archives with up to a 1 GiB dictionary are accepted when nothing is
  downloading (it was 128 MiB). The limit is only a ceiling: an archive uses the dictionary it declares. While
  downloads run, or a set extracts as it downloads, it stays 32 MiB. If the console cannot give that much
  memory the download fails with "the decoder ran out of memory".

## 1.2.4

### New

- **The memory error says why.** The failed download shows the archive's dictionary size and the limit that
  refused it, or that the decoder ran out of memory.
- **128 MiB limit after downloading.** RAR archives with up to a 128 MiB dictionary extract when nothing is
  downloading; while downloads run (or a set extracts as it downloads) the limit stays 32 MiB.
- **Extracting while downloading** now says when Extract after downloading (Settings → Downloads) would fix it,
  instead of the general message. The check at the start of a download no longer refuses what the later
  extraction could take.

## 1.2.3

### Fixed

- **Large RAR dictionaries.** The memory check before extraction counted every RAR dictionary twice, so the
  larger limit added in 1.2.2 never took effect. It now compares the archive's real dictionary with the RAR
  worker's limit.

## 1.2.2

### New

- **Extract after downloading** (Settings → Downloads, off by default). A set is extracted only once every
  part has downloaded instead of while later parts still download.
- **Larger RAR dictionaries (first step).** The RAR worker takes a larger dictionary when nothing else is
  downloading. A second check before extraction still refused them; 1.2.3 fixes that.

## 1.2.1

### Fixed

- **Recent and Browse tabs.** They are now real tabs like Home: they stay highlighted, and L1 / R1 step
  Home → Recent → Browse → Homebrew and back.

## 1.2.0

### New

- **Archive password.** Each batch has an optional password field in the phone's Import tab (before saving)
  and in Edit. It is tried first when the archive is extracted; a missing or wrong password shows "The archive's
  password is missing or wrong" with what to do.
- **Names and covers by Title ID** in the phone page too: fetching a game shows its real name and cover, and
  saved games use the game's name instead of the one in the link (rename it in Edit to keep your own).
- **Connections per download** (Settings → Downloads, above the speed limit): 8, 16, 32 or 64. The default is
  now 16 (it was 64). Some links misbehave with more connections.

### Changed

- The home page is more compact: a smaller "add games" panel so the covers fit without scrolling, and
  "Continue downloading" is gone. The top bar reads **Home**, **Recent** (jumps to Recently added) and
  **Browse** (jumps to the library).
- The Library shows the same covers as the store page.
- The game page no longer has the Details panel.
- Download sources show just the version (from the link or file name) instead of "Archive".
- The pop-up's Back button is the same size as Download.
- "Report a problem" is gone from the phone page.

## 1.1.2

### Changed

- The in-app phone import guide and the home hint match the app: games appear at once, the cover comes from
  the Title ID, and the guide mentions editing and catalog upload.
- README, install guide and changelog tidied; credits shortened to one line at the bottom of the README.

## 1.1.1

### New

- **Covers by Title ID.** Pictures for about 1,350 games from JobeesLair 0.5.1's list are built in. A game you
  import, upload or get from a feed shows its cover when the Title ID matches; a game not in the list tries the
  address that list ends on, then falls back to a colour tile.

### Removed

- The phone's cover chooser and uploader. Covers come from the Title ID only.

## 1.1.0

### New

- **Upload a catalog from the phone.** Choose or paste a JSON catalog in the [feed format](FEEDS.md); every game
  joins the running store at once. A game that is already there gets the new links in front of its old ones.
- **Edit a saved game from the phone:** title, batch names and order (the first batch is the default download),
  delete links or batches, add links as a new batch.
- **Phone page in Persian** (فا / EN button), and small wording fixes in the app's Persian.
- **A pop-up when a game is added live:** its cover, a Download button and a smaller Back button.
- **Recently added** replaces Recently viewed on the store page.

### Fixed

- Two different multipart sets are two batches; files share a batch only when their names are identical apart
  from the part number.
- Stray white specks around the logo.
- From JobeesLair 0.5.1: extracted games start (files are made executable), cancelling during extraction,
  deleting a game no longer holds the download queue, games in a `backport` folder, Rootz direct links, the
  updater's socket line and release check, and the progress bar.

### Changed

- The header shows "by" over "Zilyzal" beside the logo; the "IRDL" text is gone.

## 1.0.1

### New

- **A game you import shows up at once** in the running store, with no restart. If adding it live fails, the
  game is still saved and the phone says to reopen IRDL.

### Changed

- "by Zilyzal" beside the logo; the credits in Settings and the README are shorter.

## 1.0.0

### New

- New logo, icon and home-screen backgrounds.
- **Delete the RAR files after extracting** (Settings → Downloads, on by default).
- A phone import guide next to the Source Addition Guide.
- A Title ID missing from the page is read from the links (`PPSA…` in a link or file name).
- **Importing a game again adds to it:** new batches come first, the newest link is the default download, and
  the sources list shows each link's site. The same links imported again replace themselves.
- Import is the first page of the phone companion.

### Changed

- The companion is on by default with the PIN **989898**, and **Keep it on when IRDL is closed** is on by
  default. Change the PIN in Settings.
- Link health checks are gone: links you add by hand always count as available.

### Removed

- The screen saver and its setting under Look & feel.

## 0.5.1

### Fixed

- The app froze on its first screen when the store had no catalog. The home page is rebuilt for an empty store
  and IRDL opens straight onto it.

### New

- **English and Persian (فارسی)**, laid out right to left. Pick it in Settings → Language, or it follows the
  console's language.
- The Import box takes an address, download links in any order, or both, and the phone page opens in the
  console's own browser at `http://localhost:9898`.

## 0.5.0

First IRDL build, a copy of [JobeesLair](https://github.com/JVK3R/JobeesLair) 0.5.0 by JVK3R (GPL-3.0).

### New

- **Import tab on the phone companion:** paste a post page's address and the console finds the title, Title ID
  and `.rar` links, sorted into batches you can untick before saving.
- Saved games are kept in `imported.json` and join the store like a feed's games.
- The phone companion listens on port 9898 (then 8080, then any free port).
- New mark, icon and home-screen art.

### Changed

- No bundled catalog: games come from the Import tab and from feeds you add.
- Its own title ID, `PPSA99573`, so it installs next to JobeesLair.
- The update check reads releases of `zilyzal/IRDL`.
- The donation panel and the bundled screen-saver slides are gone.
