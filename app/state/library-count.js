// The live game counter: how many titles are indexed, and how many of them have a direct download (a
// source the app fetches by itself, with no browser page to pass). It counts the bundled catalog and
// what each catalog feed lists right now, so a title two lists share counts once, and it is counted as
// direct when any list has a direct source for it. A feed refresh, a mirror answering when the feed's own
// address is down, and a feed removed all change the lists and so the count (state/feeds.js tells the
// hooks below). It reads only the id lists kept in memory; nothing here opens a file or the network.

import { useEffect, useState } from 'react';
import { bundledIndex, currentCatalogVersion, onCatalogChange } from './catalog.js';
import { feedIndexVersion, feedIndexes, subscribeFeeds } from './feeds.js';
import { importedIndex } from './imported.js';

  // `lists`: arrays of [id, direct] pairs. { titles, direct } over their union.
  function tally(lists) {
    const seen = /* @__PURE__ */ new Map();
    for (const list of lists) for (const [id, direct] of list) seen.set(id, (seen.get(id) || 0) | (direct ? 1 : 0));
    let direct = 0;
    for (const flag of seen.values()) direct += flag;
    return { titles: seen.size, direct };
  }
  var cached = null, cachedAt = -1, cachedCatalog = -1;
  // The current count, recomputed only when a feed's list changed since the last one.
  function libraryCount() {
    const version = feedIndexVersion();
    if (!cached || version !== cachedAt || cachedCatalog !== currentCatalogVersion()) {
      cachedCatalog = currentCatalogVersion();
      const feeds = feedIndexes();
      cached = { ...tally([bundledIndex, importedIndex(), ...feeds]), feeds: feeds.length };
      cachedAt = version;
    }
    return cached;
  }
  function useLibraryCount() {
    const [count, setCount] = (0, useState)(libraryCount);
    (0, useEffect)(() => {
      const update = () => setCount(libraryCount());
      update();
      const stop = subscribeFeeds(update);
      const stopCatalog = onCatalogChange(update);
      return () => {
        stop();
        stopCatalog();
      };
    }, []);
    return count;
  }

export { libraryCount, tally, useLibraryCount };
