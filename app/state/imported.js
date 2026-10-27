// "Imported games": the games the player saved from the phone's Import tab (companion/importer.js), kept in
// imported.json in the data folder in the same shape as a catalog feed, so the catalog takes them in exactly as
// it takes a feed's games (state/catalog.js) and a download from one is queued like any other. A feed is
// read as the app opens; a game saved while it runs is added live (state/catalog.js listens through onSaved), and
// only a removal, or a failed live add, waits for the next launch.

import { MAX_RELEASES, MAX_TOTAL_RELEASES, feedDocument, parseFeed } from './feed-format.js';
import { buildGame, hostName, randomTint, releasesFromBatches, squash } from './page-import.js';
import { webURL } from './download-sources.js';
import { loadList, saveList } from './saved.js';
import { coverFor, titleFor } from './covers.js';

  var FILE = "imported.json";
  // The "address" this list is parsed under: it only names the release ids, which stay the same across
  // launches (the download queue keeps them).
  var KEY = "irdl:imported";
  var MAX_ENTRIES = 1500;

  // `load(name, what)` / `persist(name, what, value)`: where the list lives (the data folder; tests give a map).
  function createImportedStore({ load = loadList, persist = saveList } = {}) {
    let restartNeeded = false;
    // The catalog (state/catalog.js) listens here and adds a saved game to itself while the app runs; a listener
    // answers true when it did, and the game then needs no restart.
    const savedListeners = new Set();
    const onSaved = (listener) => {
      savedListeners.add(listener);
      return () => savedListeners.delete(listener);
    };
    // Only the games named are parsed (a catalog upload comes in pieces, and every piece is one call).
    function applyLive(ids, quiet = false) {
      const wanted = new Set(ids);
      let full = [];
      try {
        full = parseFeed({ version: 1, name: "Imported games", games: readDocument().games.filter((game) => wanted.has(game.id)) }, KEY).games;
      } catch (error) {
        console.log(`imported: live parse failed: ${error.message}`);
      }
      if (full.length !== wanted.size) return false;
      for (const listener of savedListeners) {
        try {
          if (listener(full, { quiet }) === true) return true;
        } catch (error) {
          console.log(`imported: live update failed: ${error.message}`);
        }
      }
      return false;
    }
    const readDocument = () => {
      const saved = load(FILE, "imported games");
      const games = Array.isArray(saved?.games) ? saved.games : [];
      // The game's name goes by its Title ID (JobeesLair's list), not the name found in a link, unless the player renamed it.
      return { version: 1, name: "Imported games", games: games.map((game) => !game?.titleEdited && titleFor(game?.id) ? { ...game, title: titleFor(game.id) } : game) };
    };
    const write = (games) => persist(FILE, "imported games", { version: 1, name: "Imported games", games });

    // Every saved game as { game, page, releases }, validated again, for the catalog to merge in.
    function loadImportedGames() {
      try {
        return parseFeed(readDocument(), KEY).games;
      } catch (error) {
        console.log(`imported: not read: ${error.message}`);
        return [];
      }
    }
    // [id, direct] pairs for the live game counter.
    const importedIndex = () => loadImportedGames().map(({ game }) => [game.id, game.direct ? 1 : 0]);

    // What the phone shows: one line per saved game, newest first.
    function entries() {
      return readDocument().games.map((raw) => {
        const releases = Array.isArray(raw.releases) ? raw.releases : [];
        const labels = new Set(releases.map((release) => String(release.label || "").replace(/\s*part\s*\d+\s*$/i, "")));
        return {
          id: String(raw.id),
          title: String(raw.title || raw.id),
          platform: raw.platform === "ps4" ? "ps4" : "ps5",
          cover: typeof raw.art?.cover === "string" ? raw.art.cover : coverFor(String(raw.id))?.cover ?? null,
          tint: typeof raw.art?.tint === "string" ? raw.art.tint : null,
          links: releases.length,
          batches: [...labels].filter(Boolean),
          hosts: [...new Set(releases.map((release) => String(release.provider || "")).filter(Boolean))],
          from: typeof raw.importedFrom === "string" ? raw.importedFrom : null
        };
      }).reverse();
    }

    // Saves what the player kept (a draft, see page-import.js buildGame). A game with the same Title ID is
    // replaced: importing it again with a batch left out takes that batch out. Throws a plain sentence when it
    // cannot be kept. Returns { entry, replaced, restart }.
    function save(draft) {
      const raw = buildGame(draft);
      const games = readDocument().games;
      const at = games.findIndex((game) => game.id === raw.id);
      if (at < 0 && games.length >= MAX_ENTRIES) throw new Error(`Imported games hold up to ${MAX_ENTRIES} games. Remove one first.`);
      // It has to survive the same checks the catalog applies, or it would be dropped silently at the next launch.
      const checked = parseFeed({ version: 1, name: "check", games: [raw] }, KEY);
      if (!checked.games.length) throw new Error("None of those links could be used.");
      // The same game again: its new batches come first (so the newest link is the default download), the same
      // batches replace themselves, and the batches imported before stay as other sources.
      if (at >= 0) {
        const fresh = new Set(raw.releases.map((release) => release.record));
        const kept = (games[at].releases || []).filter((release) => !fresh.has(release.record));
        games[at] = { ...raw, releases: [...raw.releases, ...kept].slice(0, MAX_RELEASES), art: Object.keys(raw.art || {}).length ? raw.art : games[at].art };
      } else games.push(raw);
      write(games);
      const live = applyLive([raw.id]);
      if (!live) restartNeeded = true;
      return { entry: entries().find((entry) => entry.id === raw.id), replaced: at >= 0, restart: restartNeeded, live, sources: raw.releases.length };
    }
    const removedListeners = /* @__PURE__ */ new Set();
    const onRemoved = (listener) => {
      removedListeners.add(listener);
      return () => removedListeners.delete(listener);
    };
    function remove(id) {
      const games = readDocument().games;
      const next = games.filter((game) => game.id !== id);
      if (next.length === games.length) return false;
      write(next);
      let live = false;
      for (const listener of removedListeners) {
        try {
          if (listener(id) === true) live = true;
        } catch (error) {
          console.log(`imported: live removal failed: ${error.message}`);
        }
      }
      if (!live) restartNeeded = true;
      return true;
    }
    // ---- a whole catalog at once, and editing one game ----------------------------------------------------
    const releaseTotal = (games) => games.reduce((sum, game) => sum + (Array.isArray(game.releases) ? game.releases.length : 0), 0);
    const checkRoom = (games) => {
      if (games.length > MAX_ENTRIES) throw new Error(`Imported games hold up to ${MAX_ENTRIES} games. Remove some first.`);
      if (releaseTotal(games) > MAX_TOTAL_RELEASES) throw new Error(`Imported games hold up to ${MAX_TOTAL_RELEASES} download links in all. Remove some games first.`);
    };
    // `offered`: games in the catalog feed format (FEEDS.md). A game already here gets the new links in front of its
    // old ones (the same address once), and the new details. Returns { added, updated, skipped, total, live }.
    function saveMany(offered) {
      if (!Array.isArray(offered)) throw new Error("Send a list of games.");
      if (!offered.length) throw new Error("The catalog has no games.");
      const parsed = parseFeed({ version: 1, name: "Imported games", games: offered }, KEY);
      if (!parsed.games.length) throw new Error("None of those games could be used. Each needs an id like PPSA12345, a title and at least one https link.");
      const incoming = feedDocument({ name: "Imported games", games: parsed.games }).games;
      const games = readDocument().games;
      let added = 0, updated = 0;
      for (const raw of incoming) {
        const at = games.findIndex((game) => game.id === raw.id);
        if (at < 0) {
          games.push(raw);
          added++;
          continue;
        }
        const fresh = new Set(raw.releases.map((release) => release.url));
        const kept = (games[at].releases || []).filter((release) => !fresh.has(release.url));
        games[at] = { ...games[at], ...raw, title: games[at].titleEdited ? games[at].title : raw.title, releases: [...raw.releases, ...kept].slice(0, MAX_RELEASES), art: raw.art && Object.keys(raw.art).length ? raw.art : games[at].art };
        updated++;
      }
      checkRoom(games);
      write(games);
      const live = applyLive(incoming.map((game) => game.id), true);
      if (!live) restartNeeded = true;
      return { added, updated, skipped: offered.length - parsed.games.length, total: games.length, live, restart: restartNeeded };
    }
    const baseLabel = (label) => String(label || "").replace(/\s*part\s*\d+\s*$/i, "");
    // One saved game as the phone edits it: the cover, the title, and its links grouped into batches (one per record).
    function detail(id) {
      const raw = readDocument().games.find((game) => game.id === id);
      if (!raw) return null;
      const batches = [];
      for (const release of Array.isArray(raw.releases) ? raw.releases : []) {
        let batch = batches.find((item) => item.record === release.record);
        if (!batch) batches.push(batch = { record: String(release.record || ""), label: baseLabel(release.label), password: typeof release.archivePassword === "string" ? release.archivePassword : "", links: [] });
        batch.links.push({ url: release.url, filename: release.filename || "", provider: release.provider || "", part: Number(/part\s*(\d+)\s*$/i.exec(release.label || "")?.[1]) || null, site: release.site || "" });
      }
      return {
        id: raw.id,
        title: String(raw.title || raw.id),
        platform: raw.platform === "ps4" ? "ps4" : "ps5",
        cover: typeof raw.art?.cover === "string" ? raw.art.cover : coverFor(String(raw.id))?.cover ?? "",
        tint: typeof raw.art?.tint === "string" ? raw.art.tint : "",
        sourceUrl: typeof raw.importedFrom === "string" ? raw.importedFrom : "",
        batches
      };
    }
    // `spec`: { title, cover, tint, batches: [{ record?, label, links: [{ url }] }] }, in the order wanted (the first is the
    // default download). A batch with a record keeps the links named from it; one without is new, built from its links.
    function update(id, spec) {
      const games = readDocument().games;
      const at = games.findIndex((game) => game.id === id);
      if (at < 0) throw new Error("That game is not in the store.");
      const raw = games[at];
      const old = Array.isArray(raw.releases) ? raw.releases : [];
      const title = squash(spec?.title).slice(0, 200);
      if (!title) throw new Error("Give the game a title.");
      const next = [];
      for (const batch of Array.isArray(spec?.batches) ? spec.batches.slice(0, 24) : []) {
        const label = squash(batch?.label).slice(0, 60);
        const urls = (Array.isArray(batch?.links) ? batch.links : []).map((link) => typeof link === "string" ? link : link?.url).filter((url) => typeof url === "string");
        if (typeof batch?.record === "string" && old.some((release) => release.record === batch.record)) {
          const pool = old.filter((release) => release.record === batch.record);
          for (const url of urls) {
            const release = pool.find((item) => item.url === url);
            if (!release) continue;
            const part = /(\s*part\s*\d+)\s*$/i.exec(release.label || "")?.[1];
            const renamed = { ...release, label: `${label || baseLabel(release.label)}${part ? ` ${part.trim()}` : ""}`.slice(0, 80) };
            if (typeof batch.password === "string") {
              const password = batch.password.trim().slice(0, 256);
              if (password) renamed.archivePassword = password;
              else delete renamed.archivePassword;
            }
            next.push(renamed);
          }
        } else if (urls.length) {
          const groups = new Map();
          for (const url of urls) {
            let host;
            try {
              host = hostName(webURL(url.trim()).url);
            } catch {
              continue;
            }
            groups.set(host, [...groups.get(host) ?? [], { url }]);
          }
          const hosts = [...groups].map(([host, links]) => ({ host, links }));
          next.push(...releasesFromBatches([{ key: label || "added", label: label || "Added", password: batch.password, hosts }], title, raw.importedFrom));
        }
      }
      if (!next.length) throw new Error("A game needs at least one link. Remove the game instead.");
      const art = { ...raw.art };
      const cover = typeof spec?.cover === "string" ? spec.cover.trim() : "";
      // The cover is left alone unless the edit names one (covers come from the game's Title ID now).
      if (!("cover" in (spec || {})) && !("tint" in (spec || {}))) {
        // unchanged
      } else if (/^https?:\/\//i.test(cover)) {
        try {
          art.cover = webURL(cover).url;
          art.hero = art.cover;
          delete art.tint;
        } catch {
        }
      } else {
        delete art.cover;
        delete art.hero;
        delete art.coverFallbacks;
        art.tint = typeof spec?.tint === "string" && /^#[0-9a-f]{6}$/i.test(spec.tint) ? spec.tint : art.tint || randomTint();
      }
      const edited = { ...raw, title, art, releases: next.slice(0, MAX_RELEASES) };
      if (title !== raw.title) edited.titleEdited = true;
      const checked = parseFeed({ version: 1, name: "check", games: [edited] }, KEY);
      if (!checked.games.length) throw new Error("None of those links could be used.");
      games[at] = edited;
      checkRoom(games);
      write(games);
      const live = applyLive([id], true);
      if (!live) restartNeeded = true;
      return { entry: entries().find((entry) => entry.id === id), live, restart: restartNeeded };
    }
    // Every saved game in the catalog feed format, so the same file imports back (here or on another console).
    const exportAll = () => ({ version: 1, name: "IRDL library", games: readDocument().games });
    return { entries, importedIndex, loadImportedGames, detail, exportAll, needsRestart: () => restartNeeded, onRemoved, onSaved, remove, save, saveMany, update };
  }
  var store = createImportedStore();
  var { detail, exportAll, entries, importedIndex, loadImportedGames, needsRestart, onRemoved, onSaved, remove, save, saveMany, update } = store;

export { createImportedStore, detail, exportAll, entries, importedIndex, loadImportedGames, needsRestart, onRemoved, onSaved, remove, save, saveMany, update };
