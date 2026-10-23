// The phone's Import tab, console side: the phone sends a post page's address (or pastes the page's links), the
// console reads the page (the phone's browser cannot: sites do not allow it), sorts out its title, Title ID,
// cover and rar batches (state/page-import.js), and the phone shows them to keep or drop. Fetching takes
// seconds, so a request starts a job the phone asks about every moment; nothing waits inside a request.

import { buildGame, checkPageURL, parsePage } from '../state/page-import.js';

  // The JS heap is 32 MiB for everything: a post page is read whole, so a page is capped. 1.5 MiB covers long
  // posts with comments; a bigger one is cut off (the links come first in nearly every post).
  var MAX_BYTES = 1536 * 1024;
  var MAX_PASTE = 600 * 1024;
  var MAX_JOBS = 6;

  // `http`: { request(url, { maxBytes }) -> { ok, status, text() } } (the console's Http); `store`: the saved
  // games (state/imported.js: entries, save, remove, needsRestart).
  function createImporter({ http, store, clock = () => Date.now() }) {
    const jobs = new Map();
    let counter = 0;
    const trim = () => {
      while (jobs.size > MAX_JOBS) jobs.delete(jobs.keys().next().value);
    };
    function failure(error) {
      const message = String(error?.message || error || "Something went wrong.");
      if (/HTTP (?:403|429|503)\b/.test(message)) return `The site refused the console (${message}). Open the page on your phone, copy its download links and use "Paste the links instead".`;
      if (/HTTP 404/.test(message)) return "That page was not found (HTTP 404). Check the address.";
      return message;
    }
    // Starts reading `url` (or the pasted `text`); returns the job's id at once.
    function start({ url, text }) {
      const id = `job${++counter}`;
      const job = { id, state: "fetching", startedAt: clock() };
      jobs.set(id, job);
      trim();
      try {
        if (typeof text === "string" && text.trim()) {
          if (text.length > MAX_PASTE) throw new Error("That is too much text. Paste just the links.");
          const page = typeof url === "string" && /^https?:\/\//i.test(url.trim()) ? url.trim() : "";
          job.preview = parsePage(text, page, { assumeRar: !/<\s*(?:html|body|a\s|div|p\s)/i.test(text) });
          job.state = "ready";
          return id;
        }
        const address = checkPageURL(url);
        Promise.resolve()
          .then(() => http.request(address, { maxBytes: MAX_BYTES }))
          .then(async (response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const body = await response.text();
            job.preview = parsePage(body, address);
            job.state = "ready";
          })
          .catch((error) => {
            job.state = "failed";
            job.error = failure(error);
          });
      } catch (error) {
        job.state = "failed";
        job.error = failure(error);
      }
      return id;
    }
    function job(id) {
      const found = jobs.get(id);
      if (!found) return null;
      return { id: found.id, state: found.state, error: found.error || "", preview: found.state === "ready" ? found.preview : null };
    }
    return {
      start,
      job,
      // What the player kept; the store throws a plain sentence when it cannot be made into a game.
      save: (draft) => ({ ...store.save(draft), saved: true }),
      list: () => ({ games: store.entries(), restart: store.needsRestart() }),
      remove: (id) => store.remove(id),
      // Exposed for tests: the same checks a save applies, without writing anything.
      check: (draft) => buildGame(draft)
    };
  }

export { createImporter };
