// The cover for a game, found by its Title ID (data/covers.js, from JobeesLair 0.5.1): the same pictures it shows, with
// the same fall-backs. A game whose Title ID is not in the list gets the one address JobeesLair's list ends on, built
// from the Title ID; if that does not load either, the game shows its colour tile.

import { covers } from '../data/covers.js';

  var SONY = "https://image.api.playstation.com/vulcan/ap/rnd/";
  var expand = (code) => code[0] === "s" ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${code.slice(1)}/library_600x900.jpg` : code[0] === "u" ? code.slice(1) : `${SONY}${code}?w=384&thumb=false`;
  var guess = (id) => `https://cover.spectrumlibrary.online/COVER/${id}.png`;
  // { cover, coverFallbacks } or null
  function coverFor(id, { guessed = true } = {}) {
    const known = covers[id];
    if (known && known.length > 1) return { cover: expand(known[1]), coverFallbacks: known.slice(2).map(expand) };
    return guessed && /^(?:PPSA|CUSA)\d{5}$/.test(id) ? { cover: guess(id), coverFallbacks: [] } : null;
  }

// The game's name, by Title ID, or "" when the list does not have it.
var titleFor = (id) => covers[id]?.[0] ?? "";

export { coverFor, titleFor };
