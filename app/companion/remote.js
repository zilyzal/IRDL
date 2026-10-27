// The phone's shortcuts, on the console side: the ones that open a part of the app are handed to the
// navigation (Header.jsx, useRemoteShortcuts), which owns the sections and Settings.

import { useEffect, useRef } from 'react';

  var listeners = /* @__PURE__ */ new Set();
  // Runs on the companion's timer: a shortcut nobody listens for (the store not mounted yet) is dropped.
  function runShortcut(action) {
    for (const listener of listeners) {
      try {
        listener(action);
      } catch (error) {
        console.log(`companion: shortcut ${action} failed: ${error?.message}`);
      }
    }
  }
  // `handler(action)`: "home" | "downloads" | "search" | "settings" (the latest handler is called).
  function useRemoteShortcuts(handler) {
    const latest = (0, useRef)(handler);
    latest.current = handler;
    (0, useEffect)(() => {
      const listener = (action) => latest.current(action);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);
  }

export { runShortcut, useRemoteShortcuts };
