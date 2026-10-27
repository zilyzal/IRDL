// The phone page in Persian. The page is written in English; this layer swaps every piece of text it shows for
// its Persian one as it appears (a MutationObserver watches the page), mirrors the layout, and remembers the
// choice in this phone's browser. Texts with numbers in them go through the PATTERNS; a text not found stays
// English. Everything here is plain text: nothing from the console is ever read as markup.

  var PERSIAN_CSS = String.raw`
html[lang=fa] body,html[lang=fa] input,html[lang=fa] textarea,html[lang=fa] button{font-family:Vazirmatn,Tahoma,"Segoe UI",system-ui,sans-serif}
html[lang=fa] input[type=url],html[lang=fa] #impId,html[lang=fa] #feedUrl,html[lang=fa] #impInput,html[lang=fa] #catText,html[lang=fa] #edNewLinks,html[lang=fa] .linklist,html[lang=fa] .ed-link,html[lang=fa] .pin{direction:ltr;text-align:left}
html[lang=fa] .label,html[lang=fa] .subtle,html[lang=fa] .stat span{letter-spacing:0;text-transform:none}
#langBtn{margin-inline-start:auto;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font:inherit;font-weight:700;font-size:13px;padding:5px 12px;border-radius:99px;cursor:pointer}
`;

  var PERSIAN_JS = String.raw`
  // ---- Persian ----------------------------------------------------------------------------------------------
  var FA = {
    "IRDL": "IRDL", "Enter your PIN": "رمز را وارد کنید",
    "The 6-digit PIN is shown in Settings → Phone companion on your PS5.": "رمز ۶ رقمی در تنظیمات → اپ همراه موبایل روی PS5 نمایش داده می‌شود.",
    "Sign in": "ورود", "IDLE": "بیکار", "Now downloading": "در حال دانلود", "Nothing downloading": "چیزی در حال دانلود نیست",
    "IN THE QUEUE": "در صف", "FINISHED": "تمام‌شده", 
    "Storage": "فضای ذخیره",
    "free space on the console": "فضای خالی کنسول", "Shortcuts": "میان‌برها", "Pause all": "توقف همه", "Resume all": "ادامه همه", "Move to top": "انتقال به اول صف", "Extract again": "استخراج دوباره", "Export library": "خروجی گرفتن از کتابخانه", "Save your games as a file": "بازی‌ها را به‌صورت فایل ذخیره کنید", "Import library": "وارد کردن کتابخانه", "Add games from a file": "افزودن بازی از فایل", "No games to export yet.": "هنوز بازی‌ای برای خروجی نیست.", "That file is too big.": "این فایل خیلی بزرگ است.", "That file could not be read.": "خواندن فایل ممکن نبود.", 
    "Open the section": "باز کردن بخش", "Downloads": "دانلودها", "Open the page": "باز کردن صفحه", "Store": "فروشگاه",
    "Discover page": "صفحه اکتشاف", "Sync every feed": "همگام‌سازی همه فیدها",
    "Catalog feeds": "فیدهای کاتالوگ", "Add and manage": "افزودن و مدیریت", "Report a problem": "گزارش مشکل",
    "Something went wrong? Send the console's log with your report. Keys, tokens and e-mail addresses are already blanked out of it.": "مشکلی پیش آمده؟ گزارش کنسول را همراه گزارش خود بفرستید. کلیدها، توکن‌ها و ایمیل‌ها از آن پاک شده‌اند.",
    "Share log": "اشتراک‌گذاری گزارش", "Send it from your phone": "از موبایل بفرستید", "Save log": "ذخیره گزارش", "A .txt file": "یک فایل txt",
    "Copy log": "کپی گزارش", "To paste it": "برای چسباندن", "Home": "خانه", "Add": "افزودن",
    "JSON catalog feeds add games and sources. The console shows what they bring in the next time it opens the app.": "فیدهای کاتالوگ JSON بازی و منبع اضافه می‌کنند. کنسول دفعه بعد که برنامه را باز کند آن‌ها را نشان می‌دهد.",
    "Your feeds": "فیدهای شما", "Sync all": "همگام‌سازی همه", "Popular now": "پرطرفدار", "swipe": "بکشید", "All games": "همه بازی‌ها",
    "Show more": "نمایش بیشتر", "Every app installs from its author's own GitHub release. IRDL hosts none of them.": "هر برنامه از ریلیز گیت‌هاب خود سازنده نصب می‌شود. IRDL هیچ‌کدام را میزبانی نمی‌کند.",
    "Back": "بازگشت", "Options": "گزینه‌ها",
    "Search": "جستجو", "Settings": "تنظیمات", "Import": "درون‌ریزی", "Games": "بازی‌ها", "Queue": "صف",
    "Import a game": "درون‌ریزی بازی", "from a post page": "از صفحه پست", "Fetch": "دریافت", "Clear": "پاک کردن",
    "The console reads the page for the title, Title ID, cover and download links (.rar, .pkg, .exfat, .ffpfsc), and sorts any links you paste into their parts. You pick which batch to keep.": "کنسول صفحه را برای عنوان، Title ID و لینک‌های دانلود (rar، pkg، exfat، ffpfsc) می‌خواند و لینک‌های چسبانده‌شده را به پارت‌ها مرتب می‌کند. شما انتخاب می‌کنید کدام دسته بماند.",
    "The cover is found from the Title ID": "کاور از روی Title ID پیدا می‌شود", "Title": "عنوان", "Title ID": "Title ID", "Batches": "دسته‌ها",
    "Cancel": "لغو", "Save": "ذخیره", "Saved.": "ذخیره شد.",
    "Close and reopen IRDL on the console to see the changes in the store.": "برای دیدن تغییرات، IRDL را روی کنسول ببندید و دوباره باز کنید.",
    "It is in the store on the console now: no restart needed.": "هم‌اکنون در فروشگاه کنسول است؛ نیازی به راه‌اندازی مجدد نیست.",
    "Saved games": "بازی‌های ذخیره‌شده", "Nothing saved yet. Fetch a post above.": "هنوز چیزی ذخیره نشده. از بالا یک پست دریافت کنید.",
    "Edit game": "ویرایش بازی", "Add links as a new batch": "افزودن لینک‌ها به‌عنوان دسته جدید", "Save changes": "ذخیره تغییرات",
    "Upload a catalog": "آپلود کاتالوگ", "JSON": "JSON",
    "Send a catalog file (the JSON feed format) from this phone. Every game in it joins the console's store right away.": "یک فایل کاتالوگ (قالب فید JSON) را از این موبایل بفرستید. همه بازی‌های آن بلافاصله به فروشگاه کنسول اضافه می‌شوند.",
    "Choose a file": "انتخاب فایل", "Upload": "آپلود", "Connection to the console": "اتصال به کنسول", "PIN": "رمز",
    "Search games": "جستجوی بازی", 
    "Paste a post's address, download links (any order, one per line), or both": "آدرس پست، لینک‌های دانلود (به هر ترتیب، هر خط یکی) یا هر دو را بچسبانید",
    "Batch name": "نام دسته", "Archive password (optional)": "رمز آرشیو (اختیاری)", "Archive password": "رمز آرشیو", "One download link per line": "هر خط یک لینک دانلود", "Or paste the catalog JSON here": "یا JSON کاتالوگ را اینجا بچسبانید",
    "Reading on the console…": "در حال خواندن روی کنسول…", "The page took too long. Try again, or paste its download links into the box.": "صفحه خیلی طول کشید. دوباره تلاش کنید یا لینک‌های دانلود را در کادر بچسبانید.",
    "Other files (not .rar)": "فایل‌های دیگر (غیر rar)", "tick the ones to keep": "مواردی که می‌خواهید بماند را تیک بزنید", "Not .rar": "غیر rar",
    "Keep this batch": "نگه داشتن این دسته", "Keep only this batch": "فقط این دسته بماند", "Hide links": "پنهان کردن لینک‌ها", "Show links": "نمایش لینک‌ها",
    "Enter the Title ID (PPSA12345 or CUSA12345).": "Title ID را وارد کنید (PPSA12345 یا CUSA12345).", "Give the game a title.": "برای بازی عنوان بنویسید.",
    "Tick at least one batch.": "حداقل یک دسته را تیک بزنید.", "Ready to save": "آماده ذخیره", "Found on the page": "در صفحه پیدا شد",
    "Not found on the page: type it in": "در صفحه پیدا نشد: خودتان بنویسید", "Looks like PPSA12345 or CUSA12345": "باید مانند PPSA12345 یا CUSA12345 باشد",
    "Fetch again": "دریافت دوباره", "Remove": "حذف", "Tap again to remove": "برای حذف دوباره بزنید", "Edit": "ویرایش", "Undo": "بازگردانی", "Delete": "حذف",
    "Default download": "دانلود پیش‌فرض", "Added": "اضافه‌شده", "Save changes": "ذخیره تغییرات", "Catalog uploaded": "کاتالوگ آپلود شد",
    "That is not a catalog: it needs a games list.": "این کاتالوگ نیست: باید فهرست بازی‌ها داشته باشد.",
    "Choose a file or paste the catalog first.": "ابتدا فایل را انتخاب کنید یا کاتالوگ را بچسبانید.", "That is not valid JSON.": "JSON معتبر نیست.",
    "The catalog has no games.": "کاتالوگ بازی‌ای ندارد.", "That file is too big.": "فایل خیلی بزرگ است.", "That file could not be read.": "فایل خوانده نشد.",
    "Queue": "صف", "All quiet": "همه‌چیز آرام", "Nothing downloading right now": "هم‌اکنون چیزی دانلود نمی‌شود", "Nothing in the queue": "صف خالی است",
    "Pick a game to send to the console.": "یک بازی برای ارسال به کنسول انتخاب کنید.",
    "Opens in the browser by itself in a moment": "چند لحظه دیگر خودش در مرورگر باز می‌شود", "Waiting for the browser": "در انتظار مرورگر",
    "Updating": "در حال به‌روزرسانی", "Nothing to update": "چیزی برای به‌روزرسانی نیست", "Select all": "انتخاب همه", "Save file": "ذخیره فایل", "Close": "بستن",
    "Log copied": "گزارش کپی شد", "Couldn't get the log from the console.": "گزارش از کنسول دریافت نشد.", "IRDL log": "گزارش IRDL",
    "Download to console": "دانلود روی کنسول", "Start this one on the console": "این یکی را روی کنسول شروع کنید", "No source": "بدون منبع",
    "App": "برنامه", "Payload": "پی‌لود", "Package": "پکیج", "Update": "به‌روزرسانی", "Installed": "نصب‌شده", "Failed": "ناموفق", "Waiting": "در انتظار",
    "All": "همه", "Updates": "به‌روزرسانی‌ها", "Results": "نتایج", "Nothing here.": "اینجا چیزی نیست.", "Pre-release": "پیش‌انتشار",
    "Try again": "تلاش دوباره", "Install on console": "نصب روی کنسول", "Install": "نصب", "Pause": "توقف", "Resume": "ادامه", "Open on console": "باز کردن روی کنسول",
    "Nothing in the queue. Pick a game under Games.": "صف خالی است. از بخش بازی‌ها یکی انتخاب کنید.", "No drive to download to.": "درایوی برای دانلود نیست.",
    "Space unknown": "فضا نامشخص", "No feeds yet. Paste a feed's .json address above.": "هنوز فیدی نیست. آدرس json فید را بالا بچسبانید.",
    "Syncing…": "در حال همگام‌سازی…", "Mirror removed": "میرور حذف شد", "Mirror added": "میرور اضافه شد", "Add mirror": "افزودن میرور", "Feed updated": "فید به‌روز شد",
    "Feed removed": "فید حذف شد", "Syncing every feed": "همگام‌سازی همه فیدها", "Opened on the console": "روی کنسول باز شد",
    "Reopen the app on the console to see what it brought in.": "برنامه را روی کنسول دوباره باز کنید تا موارد جدید را ببینید.",
    "Signed out. Enter the PIN again.": "خارج شدید. رمز را دوباره وارد کنید.", "Not signed in.": "وارد نشده‌اید.", "Wrong PIN.": "رمز اشتباه است.",
    "Couldn't reach the console.": "به کنسول وصل نشد.", "IRDL is closed.": "IRDL بسته است.", "Sign in again to get the log.": "برای دریافت گزارش دوباره وارد شوید.",
    "Paste a post's address, or the download links.": "آدرس پست یا لینک‌های دانلود را بچسبانید.", "That is too much text. Paste just the links.": "متن خیلی زیاد است. فقط لینک‌ها را بچسبانید.",
    "That page is no longer being read. Start again.": "خواندن آن صفحه تمام شده. دوباره شروع کنید.", "No such game.": "چنین بازی‌ای نیست.", "Unknown request.": "درخواست نامعتبر.",
    "That game is not in the store.": "آن بازی در فروشگاه نیست.", "A game needs at least one link. Remove the game instead.": "بازی باید حداقل یک لینک داشته باشد. به‌جای آن بازی را حذف کنید.",
    "None of those links could be used.": "هیچ‌کدام از آن لینک‌ها قابل استفاده نبود.", "This game has no download source.": "این بازی منبع دانلود ندارد.",
    "That page was not found (HTTP 404). Check the address.": "صفحه پیدا نشد (HTTP 404). آدرس را بررسی کنید.", "Send a list of games.": "فهرست بازی‌ها را بفرستید.",
    "None of those games could be used. Each needs an id like PPSA12345, a title and at least one https link.": "هیچ‌کدام از آن بازی‌ها قابل استفاده نبود. هر بازی شناسه‌ای مانند PPSA12345، عنوان و حداقل یک لینک https لازم دارد.",
    "Imported games hold up to": "حداکثر ظرفیت بازی‌های درون‌ریزی‌شده", "Wrong PIN. Wait": "رمز اشتباه است. صبر کنید"
  };
  // Texts with numbers or names in them. $1, $2 stand for what the pattern caught.
  var FA_PATTERNS = [
    [/^(\d+) links?$/, "$1 لینک"], [/^(\d+) hosts?$/, "$1 میزبان"], [/^(\d+) batch(?:es)?$/, "$1 دسته"], [/^(\d+) games?$/, "$1 بازی"], [/^(\d+) apps?$/, "$1 برنامه"],
    [/^(\d+) of (\d+) batch(?:es)? · (\d+) links?$/, "$1 از $2 دسته · $3 لینک"], [/^part (\d+)$/, "پارت $1"], [/^Part (\d+)$/, "پارت $1"],
    [/^about ([\d.]+) GB$/, "حدود $1 گیگابایت"], [/^about ([\d.]+) GB in all$/, "در مجموع حدود $1 گیگابایت"], [/^([\d.]+) GB$/, "$1 گیگابایت"],
    [/^Found (\d+) batch(?:es)?\. Untick what you don't want\.$/, "$1 دسته پیدا شد. آنچه نمی‌خواهید را از تیک درآورید."],
    [/^No download links found\. Paste the download links into the box\.$/, "لینک rar پیدا نشد. لینک‌های دانلود را در کادر بچسبانید."],
    [/^Updated (.+)$/, "به‌روز شد: $1"], [/^Saved (.+)$/, "ذخیره شد: $1"], [/^Removed (.+)$/, "حذف شد: $1"],
    [/^Sending (\d+) of (\d+)…$/, "ارسال $1 از $2…"], [/^Stopped after (\d+) of (\d+): (.*)$/, "پس از $1 از $2 متوقف شد: $3"],
    [/^Added (\d+), updated (\d+)(?:, skipped (\d+))?\. They are in the store now\.$/, "$1 اضافه، $2 به‌روز$3. همین حالا در فروشگاه هستند."],
    [/^Added (\d+), updated (\d+)(?:, skipped (\d+))?\. Restart IRDL on the console to see them\.$/, "$1 اضافه، $2 به‌روز$3. برای دیدن آن‌ها IRDL را روی کنسول دوباره راه‌اندازی کنید."],
    [/^(.+) is ready\. Tap Upload\.$/, "$1 آماده است. آپلود را بزنید."], [/^(.+) is missing parts? (.+)$/, "$1 پارت‌های $2 را ندارد"],
    [/^Log saved as (.+)$/, "گزارش ذخیره شد: $1"], [/^Queued on the console from (.+)$/, "روی کنسول در صف قرار گرفت از $1"],
    [/^(.+) needs the console's browser: start this one on the console\.$/, "$1 به مرورگر کنسول نیاز دارد: این یکی را روی کنسول شروع کنید."],
    [/^Too many tries\. Try again in (.+)$/, "تلاش‌های زیاد. بعداً دوباره امتحان کنید ($1)"], [/^Wrong PIN\. Wait (\d+) s before the next try\.$/, "رمز اشتباه است. $1 ثانیه صبر کنید."],
    [/^Update to (.+)$/, "به‌روزرسانی به $1"], [/^Installing (.+)$/, "در حال نصب $1"], [/^Installed (.+)$/, "نصب شد $1"], [/^Mirror · (.+)$/, "میرور · $1"],
    [/^(\d+) active$/, "$1 فعال"], [/^(\d+) failed$/, "$1 ناموفق"], [/^(\d+) done$/, "$1 تمام"], [/^(\d+) finished$/, "$1 تمام‌شده"], [/^(\d+) in all$/, "$1 در مجموع"],
    [/^([\d.]+ [KMGT]?B) free of ([\d.]+ [KMGT]?B)$/, "$1 آزاد از $2"], [/^HTTP (\d+)$/, "خطای HTTP $1"],
    [/^Imported games hold up to (\d+) games\. Remove (?:one|some) first\.$/, "حداکثر $1 بازی قابل نگهداری است. ابتدا چند بازی را حذف کنید."]
  ];
  var FA_WORDS = { "downloading": "در حال دانلود", "queued": "در صف", "paused": "متوقف", "failed": "ناموفق", "installed": "نصب‌شده", "installing": "در حال نصب", "extracting": "در حال استخراج", "downloaded": "دانلود شد", "waiting": "در انتظار", "pausing": "در حال توقف", "attention": "نیاز به توجه", "update": "به‌روزرسانی" };
  function faText(text) {
    var lead = /^\s*/.exec(text)[0], tail = /\s*$/.exec(text)[0], core = text.trim();
    if (!core) return text;
    var out = faCore(core);
    return out === core ? text : lead + out + tail;
  }
  function faCore(core) {
    if (Object.prototype.hasOwnProperty.call(FA, core)) return FA[core];
    for (var i = 0; i < FA_PATTERNS.length; i++) {
      var m = FA_PATTERNS[i][0].exec(core);
      if (m) return FA_PATTERNS[i][1].replace(/\$(\d)/g, function (x, n) { var v = m[+n]; if (v == null) return ""; if (FA_PATTERNS[i][1].indexOf("$" + n) > 0 && /^\d+$/.test(v) && /skipped/.test(String(FA_PATTERNS[i][0])) && +n === 3) return "، " + v + " ردشده"; return v; });
    }
    // "a · b · c" and "a, b": each part by itself
    var seps = [" · ", ", ", " ·"];
    for (var s = 0; s < seps.length; s++) {
      if (core.indexOf(seps[s]) > 0) {
        var parts = core.split(seps[s]), changed = false;
        var mapped = parts.map(function (p) { var q = faCore(p.trim()); if (q !== p.trim()) changed = true; return q; });
        if (changed) return mapped.join(seps[s] === ", " ? "، " : seps[s]);
      }
    }
    var lower = core.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(FA_WORDS, lower)) return FA_WORDS[lower];
    return core;
  }
  var lang = "en", faOrig = new WeakMap(), faShown = new WeakMap(), faAttrs = new WeakMap(), faObserver = null;
  var FA_ATTRS = ["placeholder", "aria-label", "title"];
  function faNode(node) {
    var parent = node.parentNode;
    if (!parent || /^(?:SCRIPT|STYLE|TEXTAREA)$/.test(parent.nodeName)) return;
    var now = node.data;
    if (faShown.get(node) === now) return;
    faOrig.set(node, now);
    var out = faText(now);
    faShown.set(node, out);
    if (out !== now) node.data = out;
  }
  function faElement(node) {
    if (node.nodeType === 3) return faNode(node);
    if (node.nodeType !== 1 || /^(?:SCRIPT|STYLE)$/.test(node.nodeName)) return;
    FA_ATTRS.forEach(function (a) {
      var v = node.getAttribute && node.getAttribute(a);
      if (!v) return;
      var memo = faAttrs.get(node) || {};
      if (memo[a] && memo[a].shown === v) return;
      var out = faText(v);
      memo[a] = { orig: v, shown: out }; faAttrs.set(node, memo);
      if (out !== v) node.setAttribute(a, out);
    });
    for (var c = node.firstChild; c; c = c.nextSibling) faElement(c);
  }
  function faRestore(node) {
    if (node.nodeType === 3) { if (faOrig.has(node) && node.data === faShown.get(node)) node.data = faOrig.get(node); faShown.delete(node); return; }
    if (node.nodeType !== 1) return;
    var memo = faAttrs.get(node);
    if (memo) Object.keys(memo).forEach(function (a) { if (node.getAttribute(a) === memo[a].shown) node.setAttribute(a, memo[a].orig); });
    faAttrs.delete(node);
    for (var c = node.firstChild; c; c = c.nextSibling) faRestore(c);
  }
  function setLang(next) {
    lang = next;
    try { localStorage.setItem("irdl-lang", next); } catch (e) {}
    var root = document.documentElement;
    root.lang = next === "fa" ? "fa" : "en"; root.dir = next === "fa" ? "rtl" : "ltr";
    $("langBtn").textContent = next === "fa" ? "EN" : "فا";
    if (next === "fa") {
      faElement(document.body);
      if (!faObserver) {
        faObserver = new MutationObserver(function (list) {
          if (lang !== "fa") return;
          list.forEach(function (m) {
            if (m.type === "characterData") faNode(m.target);
            else if (m.type === "attributes") faElement(m.target);
            else m.addedNodes.forEach(faElement);
          });
        });
        faObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: FA_ATTRS });
      }
    } else faRestore(document.body);
  }
  $("langBtn").onclick = function () { setLang(lang === "fa" ? "en" : "fa"); };
  (function () {
    var saved = ""; try { saved = localStorage.getItem("irdl-lang") || ""; } catch (e) {}
    if (saved === "fa" || (!saved && /^fa/i.test(navigator.language || ""))) setLang("fa");
  })();
`;

export { PERSIAN_CSS, PERSIAN_JS };
