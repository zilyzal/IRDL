<p align="center">
  <img src=".github/readme/logo-dark.svg#gh-dark-mode-only" alt="IRDL" height="64">
  <img src=".github/readme/logo-light.svg#gh-light-mode-only" alt="IRDL" height="64">
</p>

<p align="center">
  <b>A catalog browser and download manager for a jailbroken PS5.</b><br>
  Version 0.5.0 · Title ID <code>PPSA99573</code> · by zilyzal<br>
  <i>A clean copy of <a href="https://github.com/JVK3R/JobeesLair">JobeesLair</a> by JVK3R (GPL-3.0), with its own Import tab.</i>
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

## Import from your phone (or the console's own browser)

The companion listens on **port 9898**: `http://<console address>:9898` from a phone (the address and a QR
code are in Settings → Phone companion), or `http://localhost:9898` in the console's own web browser. Its
**Import** tab has one box that takes a **post page's address**, **download links**, or both:

1. Paste and tap **Fetch**. The console reads the page and finds the **title**, **Title ID**, **cover** and the
   **`.rar` download links**. Links you paste are sorted into their parts whatever order they come in, and
   show first.
2. The links come sorted into **batches**, one per version. Untick a batch to leave it out, tap
   **Keep only this batch**, or drop a host everywhere with the chips.
3. **Save.** Reopen IRDL on the console and the game is in the store, its volumes joined into one download set
   per batch and host.

If a site refuses the console, the links you pasted beside its address are used on their own. Only `.rar` volumes become
batches; other file-host links on the page are listed apart and left off. Details are in the
[installation guide](INSTALLATION-GUIDE.md#importing-a-game-from-a-post-page).

## What else it does

- **Catalog feeds** of your own: up to 4 JSON feeds with mirror addresses, so a feed survives its domain going
  down ([FEEDS.md](FEEDS.md)).
- **Homebrew section:** open-source PS5 apps, emulators and payloads, installed and kept up to date from their
  authors' own releases (nothing is rehosted).
- **Downloads** straight to internal storage or a USB drive, with a live dashboard, pause, resume and retry;
  split archives are downloaded and extracted for you.
- **Labels every source** (Folder Dump, .exfat Image, FFPKG, Backport), **13.60 Ready**, broken-link marks.
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
| `app/` | The application (JSX, state, phone page) and `app.json` (title ID `PPSA99573`) |
| `app/state/page-import.js` | Reads a post page: title, Title ID, cover, `.rar` batches |
| `app/companion/` | The phone companion: `api.js` routes, `importer.js`, `import-ui.js` (the Import tab) |
| `ps5-react/` | The framework it runs on, vendored from [half144/ps5-react](https://github.com/half144/ps5-react) |
| `tests/` | Tests, including `import.test.mjs` and its sample pages in `tests/fixtures/pages/` |
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

To publish: raise the version in `app/version.js`, run the build workflow, test the image on a console, then
publish a release tagged with the same version (`v0.5.0`), with `IRDL.exfat` and `update.zip` attached, so
installed copies can update themselves.

## Credits

IRDL is a copy of **[JobeesLair](https://github.com/JVK3R/JobeesLair)** by **JVK3R**, which was inspired by
**MyLuxy**'s [Overdrive](https://github.com/MyLuxy/overdrive). Thanks also to:

- **drakmor** ([ShadowMount+](https://github.com/drakmor/ShadowMountPlus))
- **nexgen999** ([PS5 Repository List](https://github.com/nexgen999/PS5-Repository-List)), the source of the
  Homebrew section's list
- **Every homebrew developer** whose work the Homebrew section lists
- **PS5 React — created by half144 and PS5 React contributors.**
  [github.com/half144/ps5-react](https://github.com/half144/ps5-react)

Distributed under the GPL-3.0-or-later ([LICENSE](LICENSE)). Third-party notices are in `notices/` inside the
app and in `ps5-react/docs/DEPENDENCIES.md`.
