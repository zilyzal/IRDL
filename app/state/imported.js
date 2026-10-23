// "Imported games": the games the player saved from the phone's Import tab (companion/importer.js), kept in
// imported.json in the data folder in the same shape as a catalog feed, so the catalog takes them in exactly as
// it takes a feed's games (state/catalog.js) and a download from one is queued like any other. A feed is
// read once as the app opens, so a game saved now shows in the store the next time IRDL is opened.

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
      if (at >= 0) games[at] = raw;
      else games.push(raw);
      write(games);
      restartNeeded = true;
      return { entry: entries().find((entry) => entry.id === raw.id), replaced: at >= 0, restart: true };
    }
    function remove(id) {
      const games = readDocument().games;
      const next = games.filter((game) => game.id !== id);
      if (next.length === games.length) return false;
      write(next);
      restartNeeded = true;
      return true;
    }
    return { entries, importedIndex, loadImportedGames, needsRestart: () => restartNeeded, remove, save };
  }
  var store = createImportedStore();
  var { entries, importedIndex, loadImportedGames, needsRestart, remove, save } = store;

export { createImportedStore, entries, importedIndex, loadImportedGames, needsRestart, remove, save };
