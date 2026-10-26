<p align="center">
  <img src=".github/readme/logo-dark.svg#gh-dark-mode-only" alt="IRDL" height="64">
  <img src=".github/readme/logo-light.svg#gh-light-mode-only" alt="IRDL" height="64">
</p>

<p align="center">
  <b>A catalog browser and download manager for a jailbroken PS5.</b><br>
  Version 1.2.6 · Title ID <code>PPSA99573</code>
</p>

<p align="center">
  <a href="https://github.com/zilyzal/IRDL/releases/latest"><b>Download</b></a> ·
  <a href="INSTALLATION-GUIDE.md">Install guide</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="FEEDS.md">Catalog feeds</a>
</p>

> [!WARNING]
> **You are responsible for what you download.** Only download content you legally own or have
> permission to access: your own backups, homebrew, freeware. IRDL hosts and distributes nothing; see the
> [Content Neutrality & DMCA Notice](#content-neutrality--dmca-notice).

IRDL runs on a jailbroken PS5 with [ShadowMount+](https://github.com/drakmor/ShadowMountPlus). It starts with
an **empty catalog**: you fill it yourself, from your phone or from feeds.

## Quick start

1. Install IRDL ([install guide](INSTALLATION-GUIDE.md)) and open it.
2. Open **Settings → Phone companion** for the address and QR code, then open it on your phone and sign in with
   the PIN (default `989898`; change it in Settings).
3. In the **Import** tab, add games (below). They appear in the store straight away.

## Add games from your phone

The companion listens on **port 9898**: `http://<console address>:9898` from a phone, or
`http://localhost:9898` in the console's own web browser.

- **Import from a post page.** Paste a post's address, download links (any order), or both, and tap **Fetch**.
  The console reads the title, Title ID and `.rar` links, and sorts the links into **batches**, one per
  version. Parts of one multipart set stay together; different sets stay apart. Untick what you don't want and
  **Save**. Importing the same game again adds to it, with the newest links first.
- **Upload a catalog.** Choose or paste a JSON catalog in the [feed format](FEEDS.md); every game in it joins
  the store at once.
- **Edit a game.** Change its title, rename or reorder batches (the first is the default download), delete
  links, or add new ones.
- **Persian.** The phone page has a فا / EN button; the app itself has a full Persian translation.

When a game is added, the console shows a pop-up with its cover and a **Download** button. Covers are matched
by Title ID; a game without one gets a colour tile. More in the
[installation guide](INSTALLATION-GUIDE.md#importing-a-game-from-a-post-page).

## What else it does

- **Catalog feeds** of your own: up to 4 JSON feeds with mirror addresses, so a feed survives its domain going
  down ([FEEDS.md](FEEDS.md)).
- **Homebrew section:** open-source PS5 apps, emulators and payloads, installed and kept up to date from their
  authors' own releases (nothing is rehosted).
- **Downloads** straight to internal storage or a USB drive, with a live dashboard, pause, resume and retry;
  split archives are downloaded and extracted for you, and the `.rar` files can be deleted afterwards. An
  optional password per batch covers protected archives, the number of connections is yours to pick (8 to 64),
  and **Extract after downloading** (Settings → Downloads) waits for every part before extracting, which also
  lets RAR archives with a large dictionary (up to 1024 MiB) extract.
- **Labels every source** (Folder Dump, .exfat Image, FFPKG, Backport) and **13.60 Ready**.
- **Library, play time and Make Room:** what's installed and how long you played it, free up space safely, move
  games between drives, and find out why a game won't start.
- **Phone companion:** dashboard, queue, feeds and a virtual remote, PIN-protected.

## Content Neutrality & DMCA Notice

IRDL is a user-driven download tool, not a content service.

- **No copyrighted files are hosted here:** not on a project server, not in this repository, not in the app
  image. Your console fetches files directly from the third-party addresses you choose.
- **There is no bundled catalog.** The games in your store are the ones you import or the feeds you add. They
  are fetched and read on your console; the project runs no feed server and does not see what you add or
  download.
- **You are responsible for what you add and download.**

**To report infringing content in this repository,** open a
[takedown issue](https://github.com/zilyzal/IRDL/issues/new?template=takedown.yml) or use GitHub's
[DMCA process](https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy), naming
this repository, with the work and its owner, where it is, your contact details, a good-faith statement that
the use is not authorized, and a statement under penalty of perjury that the notice is accurate and you are
the owner or authorized to act. Content hosted by someone else is outside the project's control; send the
notice to its host too.

This notice is not legal advice and does not change the [LICENSE](LICENSE). IRDL is an unofficial homebrew
project, not affiliated with or endorsed by Sony Interactive Entertainment. PlayStation and PS5 are trademarks
of Sony Interactive Entertainment.

## Build it yourself

| Path | What it is |
| --- | --- |
| `app/` | The application (JSX, state, phone page) and `app.json` |
| `app/state/page-import.js` | Reads a post page: title, Title ID, `.rar` batches |
| `app/companion/` | The phone companion: routes, importer, Import tab, Persian layer |
| `ps5-react/` | The framework it runs on, from [half144/ps5-react](https://github.com/half144/ps5-react) |
| `tests/` | Tests and sample pages |
| `packaging/` | Builds the exFAT image and adds the docs to it |

On Linux (or WSL) with `clang-18`, `llvm-18`, `cmake`, `ninja-build`, `nodejs`, `npm`, `zlib1g-dev`,
`build-essential`, `pkg-config`, `unzip`, `curl`, `exfatprogs` and Pillow (`ps5-react/requirements.txt`):

```sh
cd ps5-react
python3 tools/build_ps5.py --app-dir ../app --llvm /usr/bin
cp -a dist/PPSA99573 ../stage
../packaging/stage-docs.sh ../stage
sudo ../packaging/make-exfat.sh ../stage ../IRDL.exfat IRDL
```

The GitHub **build** workflow does the same. The tests need only Node.js 22+: `npm test`.

To release: raise the version in `app/version.js`, run the build workflow, test the image on a console, then
publish the draft release tagged with the same version (for example `v1.2.6`), with `IRDL.exfat` and `update.zip`
attached, so installed copies can update themselves.

## Credits

Based on [JobeesLair](https://github.com/JVK3R/JobeesLair) by JVK3R and [PS5 React](https://github.com/half144/ps5-react)
by half144. Made by zilyzal. Licensed GPL-3.0-or-later ([LICENSE](LICENSE)).
