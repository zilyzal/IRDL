// Whether a download in parts opens the browser for its next part by itself (0.5.0 Pre Release 3; on by
// default). Kept in settings.json beside the other settings; the download queue asks each time a part needs
// the browser, so a change applies to the next part.

import { useEffect, useState } from 'react';
import { loadList, saveList } from './saved.js';

  var SETTINGS = "settings.json";
  var value = null;
  var listeners = /* @__PURE__ */ new Set();
  function autoContinueParts() {
    if (value === null) value = loadList(SETTINGS, "settings").autoContinueParts !== false;
    return value;
  }
  function setAutoContinueParts(on) {
    value = Boolean(on);
    saveList(SETTINGS, "settings", { ...loadList(SETTINGS, "settings"), autoContinueParts: value });
    for (const listener of listeners) listener(value);
  }
  function useAutoContinueParts() {
    const [on, setOn] = useState(autoContinueParts);
    useEffect(() => {
      listeners.add(setOn);
      return () => {
        listeners.delete(setOn);
      };
    }, []);
    return on;
  }

// 1.0.0: whether the archive (every part of a set) is deleted once its game has been extracted. On by default.
  var deleteArchive = null;
  var deleteListeners = /* @__PURE__ */ new Set();
  function deleteArchiveAfterExtract() {
    if (deleteArchive === null) deleteArchive = loadList(SETTINGS, "settings").deleteArchiveAfterExtract !== false;
    return deleteArchive;
  }
  function setDeleteArchiveAfterExtract(on) {
    deleteArchive = Boolean(on);
    saveList(SETTINGS, "settings", { ...loadList(SETTINGS, "settings"), deleteArchiveAfterExtract: deleteArchive });
    for (const listener of deleteListeners) listener(deleteArchive);
  }
  function useDeleteArchiveAfterExtract() {
    const [on, setOn] = useState(deleteArchiveAfterExtract);
    useEffect(() => {
      deleteListeners.add(setOn);
      return () => {
        deleteListeners.delete(setOn);
      };
    }, []);
    return on;
  }

// 1.2.2: extract a set once every part has downloaded, not while the later parts still download. Off by default.
  var extractLater = null;
  var extractLaterListeners = /* @__PURE__ */ new Set();
  function extractAfterDownload() {
    if (extractLater === null) extractLater = loadList(SETTINGS, "settings").extractAfterDownload === true;
    return extractLater;
  }
  function setExtractAfterDownload(on) {
    extractLater = Boolean(on);
    saveList(SETTINGS, "settings", { ...loadList(SETTINGS, "settings"), extractAfterDownload: extractLater });
    for (const listener of extractLaterListeners) listener(extractLater);
  }
  function useExtractAfterDownload() {
    const [on, setOn] = useState(extractAfterDownload);
    useEffect(() => {
      extractLaterListeners.add(setOn);
      return () => {
        extractLaterListeners.delete(setOn);
      };
    }, []);
    return on;
  }

export { extractAfterDownload, setExtractAfterDownload, useExtractAfterDownload, autoContinueParts, deleteArchiveAfterExtract, setAutoContinueParts, setDeleteArchiveAfterExtract, useAutoContinueParts, useDeleteArchiveAfterExtract };
