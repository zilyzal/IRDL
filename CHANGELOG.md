# Changelog

What changed in each version of IRDL. Each release on [GitHub](https://github.com/zilyzal/IRDL/releases)
carries the files and their SHA-256 checksums.

## 1.0.0

### New

- **New logo and background.** The home-screen icon, the in-app mark, the phone page and the home-screen
  backgrounds use the new artwork.
- **Cover from a link, a photo, or a colour.** In the phone's Import editor, tap the cover to use another
  image link or a photo from your phone. A photo gives the game a tile in its main colour (the console loads
  pictures from links only). With no picture, the game gets a random colour tile.
- **Delete the RAR files after extracting** is an option under Settings → Downloads, on by default.
- **A phone import guide** next to the Source Addition Guide.
- **A Title ID missing from the page** is read from the links (`PPSA…` in a link or file name).
- **Importing a game again adds to it.** Its new batches come first and the newest link is the default
  download; the sources list shows the site each link came from. The same links imported again replace
  themselves.
- **Import is the first page** of the phone companion.

### Changed

- The companion is on by default with the PIN **989898**, and **Keep it on when IRDL is closed** is on by
  default. Change the PIN in Settings.
- Link health checks are gone: links you add by hand always count as available.

### Removed

- The screen saver, and its setting under Look & feel.

## 0.5.1

### Fixed

- **The app froze on its first screen.** The home page's spotlight needed a featured game that a store with no
  catalog (or with imported games, which carry no hero art) never has, so it failed while drawing and the
  screen stayed on the intro. The home page is rebuilt for this: a panel showing how to add games, then the
  downloads and games below it. IRDL now opens straight onto it, with no intro, startup notice, reveal or
  "What's new" panel.

### New

- **English and Persian (فارسی).** The interface has a full Persian translation, laid out right to left; the
  other languages are gone. English stays the default; Persian is picked in Settings → Language, or follows the
  console's language.
- **The Import box takes an address, download links in any order (sorted into parts), or both**, and the same
  page opens in the console's own browser at `http://localhost:9898`.

## 0.5.0

First IRDL build, a clean copy of [JobeesLair](https://github.com/JVK3R/JobeesLair) 0.5.0 by JVK3R (GPL-3.0).

### New

- **Import tab on the phone companion.** Paste a post page's address: the console reads it and finds the
  title, Title ID, cover and the `.rar` download links. The links are sorted into batches (one per version) so
  you can untick the ones you don't want, drop a host everywhere, and save the game into the store.
  One box takes an address, download links in any order (sorted into parts for you), or both; links alone work
  when a site refuses the console. The same page opens in the console's own browser at
  `http://localhost:9898`.
- **Saved games** are kept in `imported.json` and join the store like a feed's games; a batch's volumes on one
  host are joined into one download set.
- **The phone companion now listens on port 9898** (then 8080, then any free port if that is taken).
- **A new mark, icon and home-screen art.**

### Changed

- **No bundled catalog.** IRDL starts empty: games come from the Import tab and from feeds you add.
- Its own title ID, `PPSA99573`, so it installs next to JobeesLair.
- The update check reads releases of `zilyzal/IRDL`.
- The donation panel and the bundled screen-saver slides are gone.
