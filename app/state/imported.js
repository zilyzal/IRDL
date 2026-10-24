// "Imported games": the games the player saved from the phone's Import tab (companion/importer.js), kept in
// imported.json in the data folder in the same shape as a catalog feed, so the catalog takes them in exactly as
// it takes a feed's games (state/catalog.js) and a download from one is queued like any other. A feed is
// read as the app opens; a game saved while it runs is added live (state/catalog.js listens through onSaved), and
// only a removal, or a failed live add, waits for the next launch.

import { parseFeed } from './feed-format.js';
import { buildGame } from './page-import.js';
import { loadList, saveList } from './saved.js';

  var FILE = "imported.json";
  // The "address" this list is parsed under: it only names the release ids, which stay the same across
  // launches (the download queue keeps them).
  var KEY = "irdl:imported";
  var MAX_ENTRIES = 400;

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
    function applyLive(id) {
      const full = loadImportedGames().find((item) => item.game.id === id);
      if (!full) return false;
      for (const listener of savedListeners) {
        try {
          if (listener(full) === true) return true;
        } catch (error) {
          console.log(`imported: live update failed: ${error.message}`);
        }
      }
      return false;
    }
    const readDocument = () => {
      const saved = load(FILE, "imported games");
      return { version: 1, name: "Imported games", games: Array.isArray(saved?.games) ? saved.games : [] };
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
          cover: typeof raw.art?.cover === "string" ? raw.art.cover : null,
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
        games[at] = { ...raw, releases: [...raw.releases, ...kept].slice(0, 200), art: Object.keys(raw.art || {}).length ? raw.art : games[at].art };
      } else games.push(raw);
      write(games);
      const live = applyLive(raw.id);
      if (!live) restartNeeded = true;
      return { entry: entries().find((entry) => entry.id === raw.id), replaced: at >= 0, restart: restartNeeded, live, sources: raw.releases.length };
    }
    function remove(id) {
      const games = readDocument().games;
      const next = games.filter((game) => game.id !== id);
      if (next.length === games.length) return false;
      write(next);
      restartNeeded = true;
      return true;
    }
    return { entries, importedIndex, loadImportedGames, needsRestart: () => restartNeeded, onSaved, remove, save };
  }
  var store = createImportedStore();
  var { entries, importedIndex, loadImportedGames, needsRestart, onSaved, remove, save } = store;

export { createImportedStore, entries, importedIndex, loadImportedGames, needsRestart, onSaved, remove, save };
