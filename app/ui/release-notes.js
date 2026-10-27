// A release's notes as the update dialog shows them: the changelog section's headings and bullets, without
// the markdown around them (bold marks, code ticks, links), the release title and the checksum table.
// Returns rows: { head: "New" } for a heading, { item: "text" } for a bullet. `max` rows at most; `more` is
// how many were left out.

  var strip = (text) => text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[`*_]{1,2}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  function readableNotes(body, max = 9) {
    const rows = [];
    let item = null;
    const flush = () => {
      if (item) rows.push({ item: strip(item) });
      item = null;
    };
    for (const raw of String(body ?? "").split("\n")) {
      const line = raw.trimEnd();
      if (/^#{1,3}\s*checksums\b/i.test(line.trim())) break;
      if (/^#{1,2}\s/.test(line.trim())) continue;
      const head = /^###\s+(.+)$/.exec(line.trim());
      if (head) {
        flush();
        rows.push({ head: strip(head[1]) });
        continue;
      }
      if (/^\s*\|/.test(line)) continue;
      const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
      if (bullet) {
        flush();
        item = bullet[1];
      } else if (line.trim() && item !== null) item += " " + line.trim();
      else if (line.trim() && !rows.length) item = line.trim();
      else if (!line.trim()) flush();
    }
    flush();
    const clean = rows.filter((row) => (row.head ?? row.item));
    // A heading with nothing under it is dropped.
    const kept = clean.filter((row, index) => !row.head || (clean[index + 1] && clean[index + 1].item !== undefined));
    const shown = kept.slice(0, max);
    return { rows: shown, more: Math.max(0, kept.filter((row) => row.item !== undefined).length - shown.filter((row) => row.item !== undefined).length) };
  }

export { readableNotes };
