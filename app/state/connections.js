// How many connections a game download opens at once (Settings → Downloads): 8, 16, 32 or 64, 16 by default. Kept in
// settings.json beside the other settings. A change reaches downloads that start or resume afterwards; one already
// running keeps the number it began with. Some file hosts refuse or throttle a client that opens many connections.

import { useEffect, useState } from 'react';
import { loadList, saveList } from './saved.js';

  var CHOICES = [8, 16, 32, 64];
  var DEFAULT = 16;
  var SETTINGS = "settings.json";
  var chosen = null;
  function connections() {
    if (chosen === null) {
      const saved = loadList(SETTINGS, "settings").connections;
      chosen = CHOICES.includes(saved) ? saved : DEFAULT;
    }
    return chosen;
  }
  var listeners = /* @__PURE__ */ new Set();
  function setConnections(count) {
    if (!CHOICES.includes(count)) return;
    chosen = count;
    const { connections: _old, ...settings } = loadList(SETTINGS, "settings");
    saveList(SETTINGS, "settings", count === DEFAULT ? settings : { ...settings, connections: count });
    for (const listener of listeners) listener(count);
  }
  function useConnections() {
    const [count, setCount] = (0, useState)(connections);
    (0, useEffect)(() => {
      listeners.add(setCount);
      return () => {
        listeners.delete(setCount);
      };
    }, []);
    return count;
  }

export { CHOICES, DEFAULT, connections, setConnections, useConnections };
