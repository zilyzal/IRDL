// ../pub-game-store/native/search/match.js
// reconstructed from the esbuild bundle in eboot.bin

import { games } from '../data/catalog.js';

  var fold = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var haystacks = games.map((game) => fold(`${game.title} ${game.developer} ${game.publisher}`));
  function searchGames(query) {
    // A game added while the app runs (state/catalog.js addImportedGame) joins the index here.
    while (haystacks.length < games.length) haystacks.push(fold(`${games[haystacks.length].title} ${games[haystacks.length].developer} ${games[haystacks.length].publisher}`));
    const needle = fold(query.trim());
    return needle ? games.filter((_, i) => haystacks[i].includes(needle)) : games;
  }

export { searchGames };
