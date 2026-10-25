// ../pub-game-store/native/search/match.js
// reconstructed from the esbuild bundle in eboot.bin

import { games } from '../data/catalog.js';

  var fold = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Each game's folded text, kept until its title changes (an edit from the phone) or the game goes.
  var haystacks = /* @__PURE__ */ new WeakMap();
  function haystack(game) {
    const key = `${game.title} ${game.developer} ${game.publisher}`;
    let kept = haystacks.get(game);
    if (!kept || kept.key !== key) haystacks.set(game, kept = { key, text: fold(key) });
    return kept.text;
  }
  function searchGames(query) {
    const needle = fold(query.trim());
    return needle ? games.filter((game) => haystack(game).includes(needle)) : games;
  }

export { searchGames };
