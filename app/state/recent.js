// "Recently added": the games that came into the catalog from the phone's Import tab or a catalog upload, newest
// first, kept across launches. The same channel tells the app a game has just arrived so it can offer it (AddedDialog).

import { useEffect, useState } from 'react';
import { savedList } from './saved.js';

  var LIMIT = 12;
  var recent = savedList("added.json", "recently added");
  var listeners = /* @__PURE__ */ new Set();
  var announced = null;
  function recordAdded(ids) {
    const fresh = [...new Set(ids)];
    if (!fresh.length) return;
    recent.set([...fresh, ...recent.get().filter((other) => !fresh.includes(other))].slice(0, LIMIT));
  }
  // `ids`: the games just added live. The popup shows the newest and says how many came.
  function announceAdded(ids) {
    if (!ids.length) return;
    announced = { id: ids[ids.length - 1], count: ids.length };
    for (const listener of listeners) listener(announced);
  }
  function dismissAdded() {
    announced = null;
    for (const listener of listeners) listener(null);
  }
  function useAnnounced() {
    const [value, setValue] = (0, useState)(announced);
    (0, useEffect)(() => {
      listeners.add(setValue);
      setValue(announced);
      return () => listeners.delete(setValue);
    }, []);
    return value;
  }
  var useRecent = recent.useList;

export { announceAdded, dismissAdded, recordAdded, useAnnounced, useRecent };
