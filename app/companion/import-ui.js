// The phone page's Import tab, in three pieces that companion/page.js splices into the page: its styles, its
// markup and its script. Paste a post's address (or its links); the console reads the page and the tab shows
// the game's cover, title and Title ID with the download links sorted into batches (one per version). Tick the
// batches and hosts to keep, drop the rest, and save: the game joins the store the next time IRDL opens.
// Everything the console sends goes into the page as text, never markup, and an image only gets an https address.

  var IMPORT_CSS = String.raw`
.imp-head{display:flex;gap:14px;align-items:flex-start}
.imp-cover{flex:0 0 96px;width:96px;aspect-ratio:3/4;object-fit:cover;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,var(--panel2),var(--deep))}
.imp-fields{flex:1;min-width:0;display:grid;gap:8px}
.imp-fields label{display:block;color:var(--subtle);font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px}
.imp-fields input.field{padding:10px 12px}
input.field.bad{border-color:rgba(248,113,113,.7)}
.imp-note{font-size:12.5px;color:var(--subtle);margin-top:4px}.imp-note.bad{color:#fecaca}.imp-note.good{color:#bbf7d0}
.imp-images{display:flex;gap:8px;overflow-x:auto;margin:10px -16px 0;padding:2px 16px 8px;scrollbar-width:none}
.imp-images::-webkit-scrollbar{display:none}
.imp-images button{flex:0 0 auto;width:58px;aspect-ratio:3/4;padding:0;border:2px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel2);cursor:pointer}
.imp-images button[aria-pressed=true]{border-color:var(--ice);box-shadow:0 0 12px rgba(76,201,240,.4)}
.imp-images img{width:100%;height:100%;object-fit:cover;display:block}
.batch{padding:12px 14px}
.batch.off{opacity:.55}
.batch .top{display:flex;align-items:center;gap:12px}
.tick{flex:0 0 auto;width:30px;height:30px;border-radius:9px;border:2px solid var(--line);background:var(--deep);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:background .15s,border-color .15s}
.tick svg{width:18px;height:18px;opacity:0;transition:opacity .15s}
.tick[aria-pressed=true]{background:var(--accent);border-color:#5a9bff}
.tick[aria-pressed=true] svg{opacity:1}
.batch input.name{width:100%;border:0;border-bottom:1px dashed var(--line);background:none;color:var(--fg);font:700 16px/1.3 inherit;padding:4px 0;outline:none;border-radius:0}
.batch input.name:focus{border-bottom-color:var(--ice)}
.batch .facts{margin:8px 0 2px;color:var(--subtle);font-size:13px}
.hostchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.hostchip{border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;font-weight:600;font-size:13px;padding:6px 12px;border-radius:99px;cursor:pointer}
.hostchip small{color:var(--subtle);margin-left:6px;font-weight:500}
.hostchip[aria-pressed=true]{background:rgba(58,134,255,.22);border-color:var(--accent)}
.hostchip[aria-pressed=false]{opacity:.5;text-decoration:line-through}
.warn{margin-top:8px;color:var(--warn);font-size:13px}
.linklist{margin-top:8px;border-top:1px solid var(--line);padding-top:6px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--muted);word-break:break-all;max-height:220px;overflow:auto}
.linklist div{padding:2px 0}
.impbar{position:sticky;bottom:calc(76px + env(safe-area-inset-bottom));z-index:4;margin:14px 0 0;padding:12px;display:flex;align-items:center;gap:12px;background:rgba(15,21,32,.96);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--line);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.impbar .grow b{display:block;font-size:14px;line-height:1.3}
.impbar .grow .subtle{font-size:12px;line-height:1.3;display:block}
.impbar .btn{padding:10px 16px}
.imp-saved{display:flex;gap:12px;align-items:center;padding:10px}
.imp-saved img{flex:0 0 52px;width:52px;aspect-ratio:3/4;object-fit:cover;border-radius:10px;background:var(--panel2)}
.imp-saved .t{font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.imp-saved .actions{margin-top:8px}
.spin{display:inline-block;width:14px;height:14px;border:2px solid var(--line);border-top-color:var(--ice);border-radius:50%;animation:spin .8s linear infinite;vertical-align:-2px;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
textarea.field{width:100%;padding:12px 14px;border:1px solid var(--line);background:var(--deep);color:var(--fg);font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;outline:none;resize:vertical;border-radius:12px;min-height:110px}
textarea.field:focus{border-color:var(--ice);box-shadow:0 0 0 3px rgba(76,201,240,.16)}
`;

  var IMPORT_HTML = String.raw`
<section id="import" hidden>
<div class="panel block" style="margin-top:0">
<div class="label" style="margin-top:0">Import a game <span>from a post page</span></div>
<textarea class="field" id="impInput" rows="3" placeholder="Paste a post's address, download links (any order, one per line), or both" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
<div class="row" style="margin-top:8px"><button class="btn primary grow" id="impGo">Fetch</button><button class="btn" id="impClear" type="button">Clear</button></div>
<p class="subtle" style="margin:10px 0 0">The console reads the page for the title, Title ID, cover and .rar links, and sorts any links you paste into their parts. You pick which batch to keep.</p>
<div class="subtle" id="impStatus" style="margin-top:10px" role="status"></div>
</div>
<div id="impEditor" hidden>
<div class="panel block imp-head">
<img class="imp-cover" id="impCover" alt="">
<div class="imp-fields">
<div><label for="impTitle">Title</label><input class="field" id="impTitle" maxlength="120" autocomplete="off"></div>
<div><label for="impId">Title ID</label><input class="field" id="impId" maxlength="9" placeholder="PPSA12345" autocomplete="off" autocapitalize="characters" spellcheck="false"><div class="imp-note" id="impIdNote"></div></div>
</div>
</div>
<div class="imp-images" id="impImages"></div>
<div class="label">Batches <span id="impBatchNote"></span></div>
<div class="chips" id="impHostChips" style="margin-top:0"></div>
<div id="impBatches"></div>
<div id="impOtherBox" hidden></div>
<div class="impbar"><div class="grow"><b id="impSummary"></b><span class="subtle" id="impSummary2"></span></div><button class="btn" id="impCancel" type="button">Cancel</button><button class="btn primary" id="impSave" type="button">Save</button></div>
</div>
<div class="panel block" id="impBanner" hidden style="border-color:var(--ice)"><b>Saved.</b> <span class="muted">Close and reopen IRDL on the console to see the changes in the store.</span></div>
<div class="label">Saved games <span id="impCount"></span></div>
<div id="impSaved"></div>
<p class="subtle" id="impEmpty" hidden>Nothing saved yet. Fetch a post above.</p>
</section>
`;

  var IMPORT_JS = String.raw`
  // ---- Import: read a post page, keep the batches wanted ----------------------------------------------------
  var imp = { preview: null, cover: "", batches: [], hostOff: {}, other: null, timer: null, busy: false };
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var ID_PATTERN = /^(?:CUSA|PPSA)[0-9]{5}$/;
  function impStatus(text, busy) { var s = $("impStatus"); s.textContent = ""; if (busy) s.appendChild(el("span", "spin")); s.appendChild(document.createTextNode(text || "")); }
  function impReset() { clearInterval(imp.timer); imp.preview = null; $("impEditor").hidden = true; imp.busy = false; $("impGo").disabled = false; }
  function impStart(body) {
    if (imp.busy) return;
    impReset(); imp.busy = true; $("impGo").disabled = true;
    impStatus("Reading on the console…", true);
    api("POST", "/api/import/fetch", body).then(function (r) {
      var tries = 0;
      imp.timer = setInterval(function () {
        tries++;
        api("GET", "/api/import/job?id=" + encodeURIComponent(r.job)).then(function (job) {
          if (job.state === "fetching") { if (tries > 70) impFail("The page took too long. Try again, or paste its download links into the box."); return; }
          clearInterval(imp.timer); imp.busy = false; $("impGo").disabled = false;
          if (job.state === "failed") return impFail(job.error);
          impShow(job.preview);
        }).catch(function (e) { impFail(e.message); });
      }, 700);
    }).catch(function (e) { impFail(e.message); });
  }
  function impFail(message) {
    clearInterval(imp.timer); imp.busy = false; $("impGo").disabled = false;
    impStatus(message);
  }
  function hostList(batch) { return batch.hosts.filter(function (h) { return h.on; }); }
  function impShow(preview) {
    imp.preview = preview; imp.hostOff = {}; imp.cover = preview.cover || "";
    imp.batches = preview.batches.map(function (b) {
      return { key: b.key, label: b.label, on: true, open: false, sizeGb: b.sizeGb, warnings: b.warnings, hosts: b.hosts.map(function (h) { return { host: h.host, links: h.links, missing: h.missing, on: true }; }) };
    });
    imp.other = preview.other && preview.other.length ? { key: "other", label: "Other files (not .rar)", on: false, open: false, sizeGb: null, warnings: [], hosts: groupOther(preview.other) } : null;
    $("impTitle").value = preview.title || ""; $("impId").value = preview.titleId || "";
    var found = preview.batches.length;
    impStatus((preview.notice ? preview.notice + " " : "") + (found ? "Found " + found + " batch" + (found === 1 ? "" : "es") + ". Untick what you don't want." : "No .rar links found. Paste the download links into the box."));
    $("impEditor").hidden = false; $("impBanner").hidden = true;
    impRender(); window.scrollTo(0, $("impEditor").offsetTop - 70);
  }
  function groupOther(list) {
    var by = {}, order = [];
    list.forEach(function (l) { if (!by[l.host]) { by[l.host] = { host: l.host, links: [], missing: [], on: true }; order.push(l.host); } by[l.host].links.push({ url: l.url, part: null, filename: "", text: l.text }); });
    return order.map(function (h) { return by[h]; });
  }
  function allBatches() { return imp.batches.concat(imp.other ? [imp.other] : []); }
  function counts() {
    var batches = 0, links = 0, gbs = 0;
    allBatches().forEach(function (b) {
      if (!b.on) return;
      var n = 0; hostList(b).forEach(function (h) { if (!imp.hostOff[h.host]) n += h.links.length; });
      if (n) { batches++; links += n; if (b.sizeGb) gbs += b.sizeGb; }
    });
    return { batches: batches, links: links, gb: gbs };
  }
  function impRender() {
    var p = imp.preview;
    var cover = $("impCover"); cover.removeAttribute("src"); if (/^https:\/\//.test(imp.cover)) cover.src = imp.cover;
    var strip = $("impImages"); strip.textContent = "";
    var imgs = (p.images || []).filter(function (u) { return /^https:\/\//.test(u); });
    strip.hidden = imgs.length < 2;
    imgs.forEach(function (u) {
      var b = el("button"); b.type = "button"; b.setAttribute("aria-pressed", String(u === imp.cover)); b.appendChild(img(null, u));
      b.onclick = function () { buzz(); imp.cover = u; impRender(); };
      strip.appendChild(b);
    });
    // Hosts: one chip each, across every batch, to drop a host everywhere in a tap.
    var hosts = {}, order = [];
    allBatches().forEach(function (b) { b.hosts.forEach(function (h) { if (!hosts[h.host]) { hosts[h.host] = 0; order.push(h.host); } hosts[h.host] += h.links.length; }); });
    var chips = $("impHostChips"); chips.textContent = ""; chips.hidden = order.length < 2;
    order.forEach(function (name) {
      var c = el("button", "chip"); c.type = "button"; c.setAttribute("aria-pressed", String(!imp.hostOff[name]));
      c.appendChild(document.createTextNode(name)); c.appendChild(el("small", null, String(hosts[name])));
      c.onclick = function () { buzz(); imp.hostOff[name] = !imp.hostOff[name]; impRender(); };
      chips.appendChild(c);
    });
    $("impBatchNote").textContent = imp.batches.length > 1 ? "tick the ones to keep" : "";
    var list = $("impBatches"); list.textContent = "";
    imp.batches.forEach(function (b) { list.appendChild(batchCard(b)); });
    var box = $("impOtherBox"); box.textContent = ""; box.hidden = !imp.other;
    if (imp.other) { box.appendChild(el("div", "label", "Not .rar")); box.appendChild(batchCard(imp.other)); }
    impSummary();
  }
  function batchCard(b) {
    var card = el("div", "panel block batch" + (b.on ? "" : " off"));
    var top = el("div", "top");
    var tick = el("button", "tick"); tick.type = "button"; tick.setAttribute("aria-pressed", String(b.on)); tick.setAttribute("aria-label", "Keep this batch"); tick.innerHTML = TICK;
    tick.onclick = function () { buzz(); b.on = !b.on; impRender(); };
    var name = el("input", "name"); name.value = b.label; name.maxLength = 60; name.setAttribute("aria-label", "Batch name");
    name.oninput = function () { b.label = name.value; };
    top.appendChild(tick); top.appendChild(name); card.appendChild(top);
    var n = 0; b.hosts.forEach(function (h) { n += h.links.length; });
    card.appendChild(el("div", "facts", [b.hosts.length + " host" + (b.hosts.length === 1 ? "" : "s"), n + " link" + (n === 1 ? "" : "s"), b.sizeGb ? "about " + b.sizeGb + " GB" : ""].filter(Boolean).join(" · ")));
    var chips = el("div", "hostchips");
    b.hosts.forEach(function (h) {
      var c = el("button", "hostchip"); c.type = "button"; c.setAttribute("aria-pressed", String(h.on));
      c.appendChild(document.createTextNode(h.host)); c.appendChild(el("small", null, String(h.links.length)));
      c.onclick = function () { buzz(); h.on = !h.on; if (h.on) b.on = true; impRender(); };
      chips.appendChild(c);
    });
    card.appendChild(chips);
    (b.warnings || []).forEach(function (w) { card.appendChild(el("div", "warn", "⚠ " + w)); });
    var actions = el("div", "actions");
    if (imp.batches.length > 1 && b !== imp.other) {
      var only = el("button", "btn mini", "Keep only this batch"); only.type = "button";
      only.onclick = function () { buzz(); imp.batches.forEach(function (x) { x.on = x === b; }); if (imp.other) imp.other.on = false; impRender(); };
      actions.appendChild(only);
    }
    var links = el("button", "btn mini", b.open ? "Hide links" : "Show links"); links.type = "button";
    links.onclick = function () { b.open = !b.open; impRender(); };
    actions.appendChild(links); card.appendChild(actions);
    if (b.open) {
      var box = el("div", "linklist");
      b.hosts.forEach(function (h) { h.links.forEach(function (l) { box.appendChild(el("div", null, (h.on ? "" : "(off) ") + h.host + (l.part != null ? " · part " + l.part : "") + " · " + l.url)); }); });
      card.appendChild(box);
    }
    return card;
  }
  function problem() {
    var id = $("impId").value.trim().toUpperCase().replace(/[\s_-]/g, "");
    if (!ID_PATTERN.test(id)) return "Enter the Title ID (PPSA12345 or CUSA12345).";
    if (!$("impTitle").value.trim()) return "Give the game a title.";
    if (!counts().links) return "Tick at least one batch.";
    return "";
  }
  function impSummary() {
    var c = counts(), why = problem();
    var total = imp.batches.length + (imp.other && imp.other.on ? 1 : 0);
    $("impSummary").textContent = c.batches + " of " + total + " batch" + (total === 1 ? "" : "es") + " · " + c.links + " link" + (c.links === 1 ? "" : "s");
    $("impSummary2").textContent = why || (c.gb ? "about " + (Math.round(c.gb * 10) / 10) + " GB in all" : "Ready to save");
    $("impSave").disabled = Boolean(why);
    var id = $("impId").value.trim(), note = $("impIdNote");
    var ok = ID_PATTERN.test(id.toUpperCase().replace(/[\s_-]/g, ""));
    $("impId").classList.toggle("bad", Boolean(id) && !ok);
    note.className = "imp-note" + (ok ? " good" : id ? " bad" : "");
    note.textContent = ok ? (imp.preview && imp.preview.titleId === id.toUpperCase() ? "Found on the page" : "") : id ? "Looks like PPSA12345 or CUSA12345" : "Not found on the page: type it in";
  }
  function draft() {
    return {
      id: $("impId").value, title: $("impTitle").value, cover: imp.cover, sourceUrl: imp.preview.sourceUrl || "",
      batches: allBatches().filter(function (b) { return b.on; }).map(function (b) {
        return { key: b.key, label: b.label, hosts: hostList(b).filter(function (h) { return !imp.hostOff[h.host]; }).map(function (h) { return { host: h.host, links: h.links.map(function (l) { return { url: l.url, part: l.part, filename: l.filename }; }) }; }) };
      }).filter(function (b) { return b.hosts.length; })
    };
  }
  function impSave() {
    if (problem()) return;
    $("impSave").disabled = true;
    api("POST", "/api/import/save", draft()).then(function (r) {
      toast((r.replaced ? "Updated " : "Saved ") + r.entry.title); buzz();
      impReset(); $("impInput").value = ""; impStatus("");
      $("impBanner").hidden = false; impSaved();
    }).catch(function (e) { toast(e.message, true); impSummary(); });
  }
  function impSaved() {
    return api("GET", "/api/import/library").then(function (d) {
      var box = $("impSaved"); box.textContent = "";
      $("impCount").textContent = d.games.length ? String(d.games.length) : "";
      $("impEmpty").hidden = d.games.length > 0;
      if (d.restart) $("impBanner").hidden = false;
      d.games.forEach(function (g) {
        var row = el("div", "panel imp-saved block");
        row.appendChild(img(null, g.cover));
        var info = el("div", "grow");
        info.appendChild(el("div", "t", g.title));
        info.appendChild(el("div", "subtle", g.id + " · " + g.links + " link" + (g.links === 1 ? "" : "s") + " · " + (g.batches.length ? g.batches.join(", ") : "")));
        info.appendChild(el("div", "subtle", g.hosts.join(", ")));
        var actions = el("div", "actions");
        if (g.from) { var again = el("button", "btn mini", "Fetch again"); again.type = "button"; again.onclick = function () { $("impInput").value = g.from; impStart({ input: g.from }); window.scrollTo(0, 0); }; actions.appendChild(again); }
        var drop = el("button", "btn mini danger", "Remove"); drop.type = "button";
        drop.onclick = function () {
          if (!drop.dataset.sure) { drop.dataset.sure = "1"; drop.textContent = "Tap again to remove"; setTimeout(function () { drop.dataset.sure = ""; drop.textContent = "Remove"; }, 3000); return; }
          drop.disabled = true;
          api("DELETE", "/api/import/library?id=" + encodeURIComponent(g.id)).then(function () { toast("Removed " + g.title); impSaved(); $("impBanner").hidden = false; }).catch(function (e) { toast(e.message, true); drop.disabled = false; });
        };
        actions.appendChild(drop); info.appendChild(actions); row.appendChild(info); box.appendChild(row);
      });
    }).catch(function (e) { toast(e.message, true); });
  }
  $("impGo").onclick = function () { var text = $("impInput").value.trim(); if (!text) { $("impInput").focus(); return; } impStart({ input: text }); };
  $("impClear").onclick = function () { $("impInput").value = ""; impStatus(""); $("impInput").focus(); };
  $("impTitle").oninput = impSummary; $("impId").oninput = function () { this.value = this.value.toUpperCase(); impSummary(); };
  $("impSave").onclick = impSave;
  $("impCancel").onclick = function () { impReset(); impStatus(""); };
  function impOpen() { impSaved(); }
`;

export { IMPORT_CSS, IMPORT_HTML, IMPORT_JS };
