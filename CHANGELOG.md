# Changelog

What changed in each version of IRDL. Each release on [GitHub](https://github.com/zilyzal/irdl/releases)
carries the files and their SHA-256 checksums.

## 0.5.0

First IRDL build, a clean copy of [JobeesLair](https://github.com/JVK3R/JobeesLair) 0.5.0 by JVK3R (GPL-3.0).

### New

- **Import tab on the phone companion.** Paste a post page's address: the console reads it and finds the
  title, Title ID, cover and the `.rar` download links. The links are sorted into batches (one per version) so
  you can untick the ones you don't want, drop a host everywhere, and save the game into the store.
  Pasting links (or the page's source) works when a site refuses the console.
- **Saved games** are kept in `imported.json` and join the store like a feed's games; a batch's volumes on one
  host are joined into one download set.
- **The phone companion now listens on port 9898** (then 8080, then any free port if that is taken).
- **A new mark, icon and home-screen art.**

### Changed

- **No bundled catalog.** IRDL starts empty: games come from the Import tab and from feeds you add.
- Its own title ID, `PPSA99573`, so it installs next to JobeesLair.
- The update check reads releases of `zilyzal/irdl`.
- The donation panel and the bundled screen-saver slides are gone.
