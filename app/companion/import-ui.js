// The phone page's Import tab, in three pieces that companion/page.js splices into the page: its styles, its
// markup and its script. Paste a post's address (or its links); the console reads the page and the tab shows
// the game's cover, title and Title ID with the download links sorted into batches (one per version). Tick the
// batches and hosts to keep, drop the rest, and save: the game joins the store the next time IRDL opens.
// Everything the console sends goes into the page as text, never markup, and an image only gets an https address.

  var IMPORT_CSS = String.raw`
.imp-head{display:flex;gap:14px;align-items:flex-start}
.imp-tile{flex:0 0 96px;width:96px;aspect-ratio:1;border:1px solid var(--line);border-radius:14px;display:flex;align-items:center;justify-content:center;text-align:center;padding:6px;font-size:11px;color:var(--subtle);background:linear-gradient(135deg,var(--panel2),var(--deep))}
.imp-sw{display:inline-block;flex:0 0 52px;width:52px;aspect-ratio:1;border-radius:10px}
.imp-fields{flex:1;min-width:0;display:grid;gap:8px}
.imp-fields label{display:block;color:var(--subtle);font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px}
.imp-fields input.field{padding:10px 12px}
input.field.bad{border-color:rgba(248,113,113,.7)}
.imp-note{font-size:12.5px;color:var(--subtle);margin-top:4px}.imp-note.bad{color:#fecaca}.imp-note.good{color:#bbf7d0}
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
.imp-saved img{flex:0 0 52px;width:52px;aspect-ratio:1;object-fit:cover;border-radius:10px;background:var(--panel2)}
.imp-saved .t{font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.imp-saved .actions{margin-top:8px}
.spin{display:inline-block;width:14px;height:14px;border:2px solid var(--line);border-top-color:var(--ice);border-radius:50%;animation:spin .8s linear infinite;vertical-align:-2px;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
.ed-batch{padding:12px 14px;margin-top:10px}
.ed-batch .top{display:flex;gap:8px;align-items:center}
.ed-batch input.name{flex:1;min-width:0}
.ed-link{display:flex;gap:8px;align-items:center;padding:4px 0;border-top:1px solid var(--line);font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;color:var(--muted)}
.ed-link span{flex:1;min-width:0;word-break:break-all}
.ed-link.gone span{text-decoration:line-through;opacity:.5}
.btn.mini.sq{padding:6px 10px}
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
<div class="imp-tile" id="impTile">The cover is found from the Title ID</div>
<div class="imp-fields">
<div><label for="impTitle">Title</label><input class="field" id="impTitle" maxlength="120" autocomplete="off"></div>
<div><label for="impId">Title ID</label><input class="field" id="impId" maxlength="9" placeholder="PPSA12345" autocomplete="off" autocapitalize="characters" spellcheck="false"><div class="imp-note" id="impIdNote"></div></div>
</div>
</div>
<div class="label">Batches <span id="impBatchNote"></span></div>
<div class="chips" id="impHostChips" style="margin-top:0"></div>
<div id="impBatches"></div>
<div id="impOtherBox" hidden></div>
<div class="impbar"><div class="grow"><b id="impSummary"></b><span class="subtle" id="impSummary2"></span></div><button class="btn" id="impCancel" type="button">Cancel</button><button class="btn primary" id="impSave" type="button">Save</button></div>
</div>
<div class="panel block" id="impBanner" hidden style="border-color:var(--ice)"><b>Saved.</b> <span class="muted" id="impBannerText">Close and reopen IRDL on the console to see the changes in the store.</span></div>
<div class="label">Saved games <span id="impCount"></span></div>
<div id="impSaved"></div>
<p class="subtle" id="impEmpty" hidden>Nothing saved yet. Fetch a post above.</p>
<div id="impEdit" hidden class="panel block">
<div class="label" style="margin-top:0">Edit game <span id="edId"></span></div>
<label for="edTitle" class="subtle">Title</label><input class="field" id="edTitle" maxlength="120" autocomplete="off">
<div id="edBatches"></div>
<div class="ed-batch panel"><div class="subtle" style="margin-bottom:6px">Add links as a new batch</div>
<input class="field" id="edNewName" maxlength="60" placeholder="Batch name" autocomplete="off" style="margin-bottom:8px">
<textarea class="field" id="edNewLinks" rows="3" placeholder="One download link per line" spellcheck="false" autocapitalize="off"></textarea></div>
<div class="row" style="margin-top:12px"><button class="btn primary grow" id="edSave" type="button">Save changes</button><button class="btn" id="edCancel" type="button">Cancel</button></div>
</div>
<div class="label">Upload a catalog <span>JSON</span></div>
<div class="panel block">
<p class="subtle" style="margin:0 0 10px">Send a catalog file (the JSON feed format) from this phone. Every game in it joins the console's store right away.</p>
<input type="file" id="catFile" accept=".json,application/json,text/plain" hidden>
<textarea class="field" id="catText" rows="3" placeholder="Or paste the catalog JSON here" spellcheck="false" autocapitalize="off"></textarea>
<div class="row" style="margin-top:8px"><button class="btn grow" id="catPick" type="button">Choose a file</button><button class="btn primary grow" id="catSend" type="button">Upload</button></div>
<div class="subtle" id="catStatus" style="margin-top:10px" role="status"></div>
</div>
</section>
`;

  var IMPORT_JS = String.raw`
  // ---- Import: read a post page, keep the batches wanted ----------------------------------------------------
  var imp = { preview: null, batches: [], hostOff: {}, other: null, timer: null, busy: false };
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
    imp.preview = preview; imp.hostOff = {}; 
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
    $("impTile").textContent = p.title || "";
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
      id: $("impId").value, title: $("impTitle").value, sourceUrl: imp.preview.sourceUrl || "",
      batches: allBatches().filter(function (b) { return b.on; }).map(function (b) {
        return { key: b.key, label: b.label, hosts: hostList(b).filter(function (h) { return !imp.hostOff[h.host]; }).map(function (h) { return { host: h.host, links: h.links.map(function (l) { return { url: l.url, part: l.part, filename: l.filename }; }) }; }) };
      }).filter(function (b) { return b.hosts.length; })
    };
  }
  function bannerText(live) { $("impBannerText").textContent = live ? "It is in the store on the console now: no restart needed." : "Close and reopen IRDL on the console to see the changes in the store."; }
  function impSave() {
    if (problem()) return;
    $("impSave").disabled = true;
    api("POST", "/api/import/save", draft()).then(function (r) {
      toast((r.replaced ? "Updated " : "Saved ") + r.entry.title); buzz();
      impReset(); $("impInput").value = ""; impStatus("");
      bannerText(r.live); $("impBanner").hidden = false; impSaved();
    }).catch(function (e) { toast(e.message, true); impSummary(); });
  }
  function impSaved() {
    return api("GET", "/api/import/library").then(function (d) {
      var box = $("impSaved"); box.textContent = "";
      $("impCount").textContent = d.games.length ? String(d.games.length) : "";
      $("impEmpty").hidden = d.games.length > 0;
      if (d.restart) { bannerText(false); $("impBanner").hidden = false; }
      d.games.forEach(function (g) {
        var row = el("div", "panel imp-saved block");
        if (g.cover) row.appendChild(img(null, g.cover)); else { var sw = el("span", "imp-sw"); sw.style.background = g.tint || "#333"; row.appendChild(sw); }
        var info = el("div", "grow");
        info.appendChild(el("div", "t", g.title));
        info.appendChild(el("div", "subtle", g.id + " · " + g.links + " link" + (g.links === 1 ? "" : "s") + " · " + (g.batches.length ? g.batches.join(", ") : "")));
        info.appendChild(el("div", "subtle", g.hosts.join(", ")));
        var actions = el("div", "actions");
        if (g.from) { var again = el("button", "btn mini", "Fetch again"); again.type = "button"; again.onclick = function () { $("impInput").value = g.from; impStart({ input: g.from }); window.scrollTo(0, 0); }; actions.appendChild(again); }
        var edit = el("button", "btn mini", "Edit"); edit.type = "button"; edit.onclick = function () { edOpen(g.id); }; actions.appendChild(edit);
        var drop = el("button", "btn mini danger", "Remove"); drop.type = "button";
        drop.onclick = function () {
          if (!drop.dataset.sure) { drop.dataset.sure = "1"; drop.textContent = "Tap again to remove"; setTimeout(function () { drop.dataset.sure = ""; drop.textContent = "Remove"; }, 3000); return; }
          drop.disabled = true;
          api("DELETE", "/api/import/library?id=" + encodeURIComponent(g.id)).then(function () { toast("Removed " + g.title); impSaved(); bannerText(false); $("impBanner").hidden = false; }).catch(function (e) { toast(e.message, true); drop.disabled = false; });
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
  // ---- Edit one saved game: title, batch names and order, single links, and new links as a batch ----------
  var ed = null;
  function edOpen(id) {
    api("GET", "/api/import/game?id=" + encodeURIComponent(id)).then(function (g) {
      ed = { id: g.id, title: g.title, batches: g.batches.map(function (b) { return { record: b.record, label: b.label, links: b.links.map(function (l) { return { url: l.url, part: l.part, provider: l.provider, off: false }; }), off: false }; }) };
      $("edId").textContent = g.id; $("edTitle").value = g.title; $("edNewName").value = ""; $("edNewLinks").value = "";
      $("impEdit").hidden = false; edRender(); $("impEdit").scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function (e) { toast(e.message, true); });
  }
  function edMove(at, by) { var to = at + by; if (to < 0 || to >= ed.batches.length) return; var x = ed.batches.splice(at, 1)[0]; ed.batches.splice(to, 0, x); edRender(); }
  function edRender() {
    var box = $("edBatches"); box.textContent = "";
    ed.batches.forEach(function (b, at) {
      var card = el("div", "ed-batch panel" + (b.off ? " off" : ""));
      var top = el("div", "top");
      var name = el("input", "field name"); name.value = b.label; name.maxLength = 60; name.setAttribute("aria-label", "Batch name"); name.oninput = function () { b.label = name.value; };
      var up = el("button", "btn mini sq", "↑"); up.type = "button"; up.onclick = function () { edMove(at, -1); }; up.disabled = at === 0;
      var down = el("button", "btn mini sq", "↓"); down.type = "button"; down.onclick = function () { edMove(at, 1); }; down.disabled = at === ed.batches.length - 1;
      var del = el("button", "btn mini sq danger", b.off ? "Undo" : "Delete"); del.type = "button"; del.onclick = function () { b.off = !b.off; edRender(); };
      top.appendChild(name); top.appendChild(up); top.appendChild(down); top.appendChild(del); card.appendChild(top);
      if (at === 0 && !b.off) card.appendChild(el("div", "imp-note good", "Default download"));
      if (!b.off) b.links.forEach(function (l) {
        var row = el("div", "ed-link" + (l.off ? " gone" : ""));
        row.appendChild(el("span", null, (l.part != null ? "part " + l.part + " · " : "") + l.url));
        var x = el("button", "btn mini sq", l.off ? "Undo" : "✕"); x.type = "button"; x.onclick = function () { l.off = !l.off; edRender(); };
        row.appendChild(x); card.appendChild(row);
      });
      box.appendChild(card);
    });
  }
  function edSave() {
    if (!ed) return;
    var batches = ed.batches.filter(function (b) { return !b.off; }).map(function (b) {
      return { record: b.record, label: b.label, links: b.links.filter(function (l) { return !l.off; }).map(function (l) { return { url: l.url }; }) };
    }).filter(function (b) { return b.links.length; });
    var extra = $("edNewLinks").value.split(/\s+/).filter(function (u) { return /^https:\/\//i.test(u); });
    if (extra.length) batches.push({ label: $("edNewName").value.trim() || "Added", links: extra.map(function (u) { return { url: u }; }) });
    $("edSave").disabled = true;
    api("POST", "/api/import/edit", { id: ed.id, title: $("edTitle").value, batches: batches }).then(function (r) {
      toast("Saved " + r.entry.title); buzz(); $("impEdit").hidden = true; ed = null; bannerText(r.live); $("impBanner").hidden = false; impSaved();
    }).catch(function (e) { toast(e.message, true); }).then(function () { $("edSave").disabled = false; });
  }
  $("edSave").onclick = edSave;
  $("edCancel").onclick = function () { $("impEdit").hidden = true; ed = null; };
  // ---- Upload a catalog: the file (or pasted text) is read here and sent in small pieces ----------------------
  var CHUNK = 36000;
  function catGames(text) {
    var data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.games)) return data.games;
    if (data && data.id && data.releases) return [data];
    throw new Error("That is not a catalog: it needs a games list.");
  }
  function catStatus(text, busy) { var s = $("catStatus"); s.textContent = ""; if (busy) s.appendChild(el("span", "spin")); s.appendChild(document.createTextNode(text || "")); }
  function catSend() {
    var text = $("catText").value.trim(), games;
    if (!text) { catStatus("Choose a file or paste the catalog first."); return; }
    try { games = catGames(text); } catch (e) { catStatus(e instanceof SyntaxError ? "That is not valid JSON." : e.message); return; }
    if (!games.length) { catStatus("The catalog has no games."); return; }
    var pieces = [], cur = [], size = 0, skipped = 0;
    games.forEach(function (g) {
      var n = JSON.stringify(g).length;
      if (n > 60000) { skipped++; return; }
      if (cur.length && size + n > CHUNK) { pieces.push(cur); cur = []; size = 0; }
      cur.push(g); size += n;
    });
    if (cur.length) pieces.push(cur);
    var sum = { added: 0, updated: 0, skipped: skipped, live: true }, done = 0;
    $("catSend").disabled = true;
    (function next() {
      if (done >= pieces.length) {
        $("catSend").disabled = false; $("catText").value = "";
        catStatus("Added " + sum.added + ", updated " + sum.updated + (sum.skipped ? ", skipped " + sum.skipped : "") + (sum.live ? ". They are in the store now." : ". Restart IRDL on the console to see them."));
        toast("Catalog uploaded"); buzz(); impSaved(); return;
      }
      catStatus("Sending " + (done + 1) + " of " + pieces.length + "…", true);
      api("POST", "/api/import/catalog", { games: pieces[done] }).then(function (r) {
        sum.added += r.added; sum.updated += r.updated; sum.skipped += r.skipped; if (!r.live) sum.live = false; done++; next();
      }).catch(function (e) { $("catSend").disabled = false; catStatus((done ? "Stopped after " + done + " of " + pieces.length + ": " : "") + e.message); });
    })();
  }
  $("catPick").onclick = function () { $("catFile").click(); };
  $("catFile").onchange = function () {
    var file = this.files && this.files[0]; this.value = "";
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { catStatus("That file is too big."); return; }
    var r = new FileReader();
    r.onload = function () { $("catText").value = String(r.result || ""); catStatus(file.name + " is ready. Tap Upload."); };
    r.onerror = function () { catStatus("That file could not be read."); };
    r.readAsText(file);
  };
  $("catSend").onclick = catSend;
  function impOpen() { impSaved(); }
`;

export { IMPORT_CSS, IMPORT_HTML, IMPORT_JS };
