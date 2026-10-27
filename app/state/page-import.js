// Reading a post page for the phone's Import tab: the game's title, its Title ID, the cover image and the
// download links, with the links sorted into BATCHES (a page often carries two or three versions of the
// same game, each as a set of .rar volumes on several hosts) so the player can keep the batch he wants and
// drop the rest. Pure text work: no DOM, no network, so it runs (and is tested) off the console.
//
//   parsePage(html, pageUrl)  -> { title, titleId, titleIds, cover, images, batches, other }
//   buildGame(draft)          -> one catalog-feed game (state/feed-format.js shape) from what the player kept
//
// Only links that look like .rar volumes are offered as batches. Other links to file hosts are listed
// apart ("other"), off by default, so nothing else is ever pulled in unless the player asks.

import { webURL } from './download-sources.js';

  // File hosts, by domain, with the name the catalog shows for them.
  var FILE_HOSTS = {
    "1fichier.com": "1fichier", "alterupload.com": "1fichier", "mediafire.com": "mediafire", "gofile.io": "gofile",
    "buzzheavier.com": "buzzheavier", "datanodes.to": "datanodes", "filekeeper.net": "filekeeper",
    "vikingfile.com": "vikingfile", "vik1ngfile.site": "vikingfile", "mega.nz": "mega", "mega.io": "mega",
    "pixeldrain.com": "pixeldrain", "rapidgator.net": "rapidgator", "rg.to": "rapidgator", "ranoz.gg": "ranoz",
    "send.cm": "send", "krakenfiles.com": "krakenfiles", "workupload.com": "workupload", "qiwi.gg": "qiwi",
    "uploadhaven.com": "uploadhaven", "turbobit.net": "turbobit", "katfile.com": "katfile",
    "nitroflare.com": "nitroflare", "fileditchfiles.me": "fileditch", "fileditch.com": "fileditch",
    "transfer.it": "transfer", "filecrypt.cc": "filecrypt", "filecrypt.co": "filecrypt",
    "drive.google.com": "google drive", "terabox.com": "terabox", "ddownload.com": "ddownload",
    "dropbox.com": "dropbox", "1cloudfile.com": "1cloudfile", "akirabox.com": "akirabox", "hexload.com": "hexload",
    "files.fm": "files.fm", "upload.ee": "upload.ee", "usersdrive.com": "usersdrive", "megaup.net": "megaup",
    "sendspace.com": "sendspace", "4shared.com": "4shared", "archive.org": "archive.org", "limewire.com": "limewire",
    "pcloud.com": "pcloud", "oxy.cloud": "oxycloud", "swisstransfer.com": "swisstransfer", "files.catbox.moe": "catbox"
  };
  // Hosts the app takes a download from on its own (state/download-sources.js); any other page needs the
  // console's browser, so a release on one is marked requiresBrowser.
  var APP_HOSTS = ["mediafire.com", "buzzheavier.com", "vikingfile.com", "vik1ngfile.site", "datanodes.to", "filekeeper.net"];
  // Addresses that are never downloads, whatever their text says.
  var NOT_DOWNLOADS = /(?:facebook|twitter|x|instagram|youtube|youtu|reddit|discord|telegram|t|tiktok|pinterest|whatsapp|patreon|ko-fi|paypal|buymeacoffee|wikipedia|store\.playstation|playstation|steampowered|gravatar|wp|disqus)\.(?:com|gg|me|org|net|be|co)(?:\/|$)/i;
  var IMAGE_FILE = /\.(?:png|jpe?g|webp)(?:[?#]|$)/i;
  var NOT_ART = /(?:logo|icon|avatar|emoji|smil(?:e|ey)|sprite|banner-ad|(?:^|[/_.-])ads?[-_/]|pixel|spacer|button|badge|gravatar|favicon|thumb-?(?:50|60|80|100)\b|\/flags?\/)/i;
  var MAX_LINKS = 400;

  var ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "-", hellip: "...", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', copy: "(c)", reg: "(R)", trade: "TM", bull: "-", middot: "-" };
  function decode(value) {
    return String(value ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
      if (body[0] === "#") {
        const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        return Number.isFinite(code) && code > 8 && code < 0x10ffff ? String.fromCodePoint(code) : " ";
      }
      return ENTITIES[body.toLowerCase()] ?? whole;
    });
  }
  var INVISIBLE = new RegExp("[\\u00a0\\u200b-\\u200f\\u2028\\u2029\\ufeff]", "g");
  var squash = (value) => decode(value).replace(INVISIBLE, " ").replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim();
  var stripTags = (value) => squash(String(value ?? "").replace(/<[^>]*>/g, " "));
  function attr(tag, key) {
    const match = new RegExp(`(?:^|[\\s"'/])${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
    return match ? decode(match[1] ?? match[2] ?? match[3] ?? "").trim() : "";
  }

  // ---- addresses ----------------------------------------------------------------------------------------
  function resolve(value, base) {
    let text = decode(value).trim();
    if (!text || /^(?:javascript|mailto|tel|data|#)/i.test(text)) return "";
    try {
      if (text.startsWith("//")) text = `${base ? webURL(base).origin.split(":")[0] : "https"}:${text}`;
      else if (text.startsWith("/")) text = webURL(base).origin + text;
      else if (!/^https?:\/\//i.test(text)) {
        if (!base) return "";
        text = base.split(/[?#]/)[0].replace(/[^/]*$/, "") + text;
      }
      return webURL(text).url;
    } catch {
      return "";
    }
  }
  // A link wrapped by a redirector (?url=https%3A%2F%2F… or ?u=aHR0cHM6Ly9…) gives what it points to.
  function unwrap(url) {
    try {
      const query = url.split("#")[0].split("?")[1];
      if (!query) return url;
      for (const pair of query.split("&")) {
        const at = pair.indexOf("=");
        if (at < 0 || !/^(?:url|u|link|r|redirect|to|go|target|href|out|dest)$/i.test(pair.slice(0, at))) continue;
        let value = pair.slice(at + 1);
        try {
          value = decodeURIComponent(value.replace(/\+/g, " "));
        } catch {
          continue;
        }
        if (/^https?:\/\//i.test(value)) return webURL(value).url;
        if (/^[A-Za-z0-9+/_=-]{16,}$/.test(value)) {
          try {
            const text = typeof atob === "function" ? atob(value.replace(/-/g, "+").replace(/_/g, "/")) : "";
            if (/^https?:\/\//i.test(text)) return webURL(text).url;
          } catch {
          }
        }
      }
    } catch {
    }
    return url;
  }
  var hostOf = (url) => {
    try {
      return webURL(url).host.replace(/^www\./, "");
    } catch {
      return "";
    }
  };
  var domainMatch = (host, domain) => host === domain || host.endsWith(`.${domain}`);
  function hostName(url) {
    const host = hostOf(url);
    for (const domain of Object.keys(FILE_HOSTS)) if (domainMatch(host, domain)) return FILE_HOSTS[domain];
    const parts = host.split(".");
    return (parts.length > 2 && parts.at(-1).length === 2 && parts.at(-2).length <= 3 ? parts.at(-3) : parts.at(-2) || host).slice(0, 40);
  }
  var isFileHost = (url) => Object.keys(FILE_HOSTS).some((domain) => domainMatch(hostOf(url), domain));
  var needsBrowser = (url) => {
    const host = hostOf(url);
    if (APP_HOSTS.some((domain) => domainMatch(host, domain))) return false;
    try {
      return !/\.(?:rar|7z|zip)(?:[?#]|$)/i.test(webURL(url).path.split("#")[0]);
    } catch {
      return true;
    }
  };
  var LOOPBACK = /^(?:localhost|0\.0\.0\.0|127\.\d+\.\d+\.\d+|\[?::1\]?|.*\.local|.*\.internal)$/i;
  // The console only reads pages out on the web: never itself or a service on its own network card.
  function checkPageURL(value) {
    let parsed;
    try {
      parsed = webURL((value || "").trim());
    } catch {
      throw new Error("Enter a full http:// or https:// page address.");
    }
    if (LOOPBACK.test(parsed.host)) throw new Error("That address is the console itself.");
    return parsed.url;
  }

  // ---- title, Title ID, art -----------------------------------------------------------------------------
  var TITLE_ID = /\b(PPSA|CUSA)[\s_-]?(\d{5})\b/gi;
  function findTitleIds(text) {
    const seen = new Map();
    let order = 0;
    for (const match of String(text).matchAll(TITLE_ID)) {
      const id = `${match[1].toUpperCase()}${match[2]}`;
      const known = seen.get(id);
      if (known) known.count++;
      else seen.set(id, { id, count: 1, order: order++ });
    }
    return [...seen.values()].sort((a, b) => b.count - a.count || a.order - b.order).map((item) => item.id);
  }
  // The Title ID out of links and file names (".../Game-PPSA01234-v1.05.part1.rar"), where the usual word
  // boundaries do not hold ("_" counts as a letter there).
  function titleIdFromLinks(preview, raw = "") {
    const parts = [String(raw)];
    for (const batch of preview?.batches ?? []) for (const host of batch.hosts ?? []) for (const link of host.links ?? []) parts.push(link.url || "", link.filename || "");
    for (const link of preview?.other ?? []) parts.push(link.url || "", link.filename || "");
    const found = new Map();
    for (const match of parts.join("\n").matchAll(/(PPSA|CUSA)[\s_-]?(\d{5})(?!\d)/gi)) {
      const id = `${match[1].toUpperCase()}${match[2]}`;
      found.set(id, (found.get(id) ?? 0) + 1);
    }
    return [...found].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  }
  // "Game | Site" and "Game » Site" always end in a site name; "Game - Site" only when the tail reads like one,
  // since a hyphen also sets off a subtitle ("Spider-Man 2 - Marvel").
  var SITE_SUFFIX = /\s+[|–—»]\s+[^|–—»]{2,40}$/;
  var SITE_SUFFIX_HYPHEN = /\s+-\s+[^|–—»]{0,30}(?:\b(?:games?|download|pkg|ps[45]|hub|blog|store|torrents?|repacks?)\b|\.(?:com|net|org|to|io|cc|me|xyz))[^|–—»-]{0,15}$/i;
  function cleanTitle(raw) {
    let title = squash(raw);
    if (!title) return "";
    // "Game Name | Site" or "Game Name - Site": a short tail after a separator is the site's name, unless
    // the head would be left too short to be a game.
    for (let pass = 0; pass < 2; pass++) {
      const next = title.replace(SITE_SUFFIX, "").replace(SITE_SUFFIX_HYPHEN, "");
      if (next !== title && next.length >= 4) title = next;
    }
    title = title
      .replace(/[\[(]\s*(?:PPSA|CUSA)[\s_-]?\d{5}\s*[\])]/gi, " ")
      .replace(/\b(?:PPSA|CUSA)[\s_-]?\d{5}\b/gi, " ")
      .replace(/\b(?:free\s+)?(?:pkg\s+)?download(?:s)?\b.*$/i, " ")
      .replace(/\b(?:for\s+)?ps[45]\b(?:\s+(?:pkg|fpkg|game|backport|dump))*/gi, " ")
      .replace(/\b(?:fpkg|backport(?:ed)?|dump|dlpsgame|ps5\s*games?)\b/gi, " ")
      .replace(/[\[(]\s*[\])]/g, " ")
      .replace(/\s*[-:|–—]\s*(?:fw\s*)?\d{1,2}\.(?:xx|\d{1,2})(?:\s*[/,&]\s*\d{1,2}\.(?:xx|\d{1,2}))*\s*$/i, " ")
      .replace(/\s+[-:|–—]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return title.slice(0, 120);
  }
  function metaContent(html, key) {
    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = match[0];
      if (new RegExp(`^${key}$`, "i").test(attr(tag, "property") || attr(tag, "name"))) {
        const content = attr(tag, "content");
        if (content) return content;
      }
    }
    return "";
  }
  function pageTitle(html) {
    const candidates = [
      metaContent(html, "og:title"),
      metaContent(html, "twitter:title"),
      stripTags(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? ""),
      stripTags(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "")
    ];
    for (const candidate of candidates) {
      const title = cleanTitle(candidate);
      if (title.length >= 2) return title;
    }
    return "";
  }
  // Image candidates, best first: the page's own share image, then pictures in the post that look like art.
  function pageImages(html, base) {
    const out = [];
    const add = (value, score) => {
      const url = resolve(value, base);
      if (!url || NOT_ART.test(url) || /\.(?:svg|gif|ico)(?:[?#]|$)/i.test(url)) return;
      if (!/^https:/i.test(url) && base.startsWith("https:")) return;
      if (!out.some((item) => item.url === url)) out.push({ url, score: score - out.length * 0.001 });
    };
    for (const key of ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]) add(metaContent(html, key), 100);
    for (const match of html.matchAll(/<link\b[^>]*>/gi)) if (/image_src/i.test(attr(match[0], "rel"))) add(attr(match[0], "href"), 95);
    const body = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(?:script|style|noscript|template)\b[\s\S]*?<\/(?:script|style|noscript|template)>/gi, " ");
    let at = 0;
    for (const match of body.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const src = attr(tag, "data-src") || attr(tag, "data-lazy-src") || attr(tag, "data-original") || attr(tag, "src") || (attr(tag, "srcset").split(",").pop() || "").trim().split(/\s+/)[0];
      if (!src || NOT_ART.test(`${src} ${attr(tag, "class")} ${attr(tag, "alt")}`) && !/cover|poster|boxart/i.test(attr(tag, "alt"))) continue;
      const width = Number.parseInt(attr(tag, "width"), 10), height = Number.parseInt(attr(tag, "height"), 10);
      if (width && width < 120 || height && height < 120) continue;
      let score = 40 - Math.min(at++, 30);
      if (/cover|poster|boxart|header|capsule|library_600|hero/i.test(`${src} ${attr(tag, "alt")} ${attr(tag, "class")}`)) score += 20;
      if (/wp-content\/uploads|\/uploads\//i.test(src)) score += 6;
      if (IMAGE_FILE.test(src)) score += 4;
      if (width >= 300 || height >= 300) score += 6;
      add(src, score);
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 10).map((item) => item.url);
  }

  // ---- links and batches --------------------------------------------------------------------------------
  var SIZE = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(GB|GiB|MB|MiB|TB)\b/i;
  var sizeGbOf = (text) => {
    const match = SIZE.exec(text || "");
    if (!match) return null;
    const value = Number(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    const gb = unit.startsWith("t") ? value * 1000 : unit.startsWith("m") ? value / 1000 : value;
    return gb > 0 && gb < 4096 ? Math.round(gb * 10) / 10 : null;
  };
  // What a version looks like in a title or a file name: "v1.05", "Version 1.002", "update 1.05",
  // "backport 7.xx / 9.xx", "fw 7.61", or a bare "1.002". Sizes ("12.50 GB") are not versions.
  function versionOf(text) {
    const value = squash(text).replace(SIZE, " ");
    const out = [];
    const backport = /\bbackport(?:s|ed)?\s*(?:for\s+)?(?:fw|firmware|ps5)?\s*[:\-]?\s*(\d{1,2}(?:\.(?:\d{1,2}|xx))?(?:\s*(?:[/,&+]|and|to|-)\s*\d{1,2}(?:\.(?:\d{1,2}|xx))?)*)/i.exec(value);
    if (backport) out.push(`backport ${backport[1].replace(/\s+/g, "").toLowerCase()}`);
    const firmware = /\b(?:fw|firmware)\s*[:\-]?\s*(\d{1,2}\.(?:\d{1,2}|xx))\b/i.exec(value);
    if (firmware && !backport) out.push(`fw ${firmware[1].toLowerCase()}`);
    const named = /\b(?:v|ver\.?|version)\s*[:\-]?\s*(\d{1,3}(?:\.\d{1,3}){1,3})\b/i.exec(value);
    if (named) out.push(`v${named[1]}`);
    else {
      const bare = /(?:^|[\s._\-(\[])(\d{1,2}\.\d{2,3}(?:\.\d{2,3})?)(?=$|[\s._\-)\]+])/.exec(value);
      if (bare && !firmware && !backport) out.push(`v${bare[1]}`);
    }
    return out.join(" ");
  }
  var norm = (value) => squash(value).toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim();
  var slug = (value) => squash(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "set";
  var RAR_HINT = /\.rar\b|\.r\d{2}\b|\bpart\s*0*\d+|\.part0*\d+\b|\brar\b|\.(?:pkg|exfat|ffpfsc)\b/i;
  var FILE_NAME = /([^\s/\\"'<>|?*:]+?\.(?:part0*\d+\.)?(?:rar|r\d{2}|pkg|exfat|ffpfsc))(?![a-z0-9])/i;
  // The label a link's own surroundings give a batch: its heading text without host names, sizes and ids.
  function labelOf(text) {
    let label = squash(text)
      .replace(/\b(?:PPSA|CUSA)[\s_-]?\d{5}\b/gi, " ")
      .replace(SIZE, " ")
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/\b(?:direct\s+)?(?:download|links?|mirrors?|part\s*\d+(?:\s*[-,&]\s*\d+)*|click\s+here|here)\b\s*[:\-]?/gi, " ");
    for (const name of new Set(Object.values(FILE_HOSTS))) label = label.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), " ");
    return label.replace(/[\[\]()|]+/g, " ").replace(/\s*[-:–—]+\s*$/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  }
  // The page as lines: block tags end a line, a link is a marker in its line, other tags vanish. A heading
  // line is flagged. Returns the lines and the links they point at.
  function linesOf(html, base) {
    let text = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(?:script|style|svg|noscript|template|head)\b[\s\S]*?<\/(?:script|style|svg|noscript|template|head)>/gi, " ");
    const anchors = [];
    text = text.replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, (whole, open, inner) => {
      const href = resolve(attr(open, "href"), base);
      const label = stripTags(inner) || attr(open, "title") || attr(open, "aria-label");
      if (!href) return ` ${label} `;
      anchors.push({ href: unwrap(href), text: label, title: attr(open, "title") });
      return ` \u0001${anchors.length - 1}\u0002 `;
    });
    text = text
      .replace(/<(\/?)(h[1-6])\b[^>]*>/gi, (whole, close, tag) => close ? "\n" : `\n\u0003`)
      .replace(/<\/?(?:p|div|li|ul|ol|br|tr|table|section|article|hr|blockquote|pre|details|summary|header|footer|aside|figure|figcaption|dd|dt|dl|td|th|form|fieldset|legend)\b[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, " ");
    // Bare addresses typed into the page (a pasted list of links) count as links too.
    text = text.replace(/(^|[\s>(])(https?:\/\/[^\s<>"')\u0001\u0002]+)/gi, (whole, lead, url) => {
      const href = resolve(url, base);
      if (!href) return whole;
      anchors.push({ href: unwrap(href), text: "", bare: true });
      return `${lead} \u0001${anchors.length - 1}\u0002 `;
    });
    const lines = decode(text).split("\n").map((line) => {
      const heading = line.startsWith("\u0003");
      return { heading, raw: line.replace(/\u0003/g, "") };
    }).filter((line) => squash(line.raw.replace(/[\u0001\u0002\d]/g, "")) || /\u0001/.test(line.raw));
    return { lines, anchors };
  }
  var plain = (raw) => squash(raw.replace(/\u0001\d+\u0002/g, " "));

  function gatherLinks(html, base) {
    const { lines, anchors } = linesOf(html, base);
    const found = [];
    const recent = []; // the last few label lines (text without links), newest last
    let heading = "";
    for (const line of lines) {
      const markers = [...line.raw.matchAll(/\u0001(\d+)\u0002/g)];
      const text = plain(line.raw);
      if (!markers.length) {
        if (line.heading) {
          heading = text;
          recent.length = 0;
        }
        if (text) recent.push(text);
        if (recent.length > 4) recent.shift();
        continue;
      }
      if (line.heading) heading = text;
      markers.forEach((marker, at) => {
        const anchor = anchors[Number(marker[1])];
        const before = squash(line.raw.slice(0, marker.index).replace(/\u0001\d+\u0002/g, " "));
        // A bare address has no link text: what follows it on the line (up to the next link) stands in.
        const after = anchor.bare ? squash(line.raw.slice(marker.index + marker[0].length, markers[at + 1]?.index ?? line.raw.length)) : "";
        const lead = (anchor.bare ? `${before} ${after}` : `${before} ${anchor.text}`).trim();
        found.push({
          url: anchor.href,
          text: anchor.text || after.slice(0, 80),
          title: anchor.title || "",
          before,
          lead,
          lineText: text,
          lineLinks: markers.length,
          recent: [...recent],
          heading
        });
      });
      // A line of links lends the text in front of its first link ("Version 1.05 links:") to the lines below,
      // never the link texts themselves (file names are not labels).
      const lead = squash(line.raw.slice(0, markers[0].index).replace(/\u0001\d+\u0002/g, " "));
      if (lead && !FILE_NAME.test(lead)) recent.push(lead);
      if (recent.length > 4) recent.shift();
      if (found.length >= MAX_LINKS * 3) break;
    }
    return found;
  }

  function fileNameOf(link) {
    for (const source of [link.text, link.title]) {
      const match = FILE_NAME.exec(source || "");
      if (match) return match[1];
    }
    // "url  Game.part1.rar": a file name typed next to the link counts when the line holds that one link.
    if (link.lineLinks === 1) {
      const match = FILE_NAME.exec(link.lineText || "");
      if (match) return match[1];
    }
    try {
      const path = webURL(link.url).path.split(/[?#]/)[0];
      for (const piece of path.split("/").reverse()) {
        let name = piece;
        try {
          name = decodeURIComponent(piece);
        } catch {
        }
        const match = FILE_NAME.exec(name);
        if (match) return match[1];
      }
    } catch {
    }
    return "";
  }
  function partOf(link, name) {
    for (const source of [name, link.text, link.title, link.before.split(" ").slice(-3).join(" ")]) {
      const match = /\.?part\s*0*(\d{1,3})\b/i.exec(source || "");
      if (match) return Number(match[1]);
    }
    const old = /\.r(\d{2})$/i.exec(name || "");
    if (old) return Number(old[1]) + 2;
    if (/\.rar$/i.test(name || "") && !/part/i.test(name)) return null;
    const bare = /^\s*(?:part\s*)?0*(\d{1,3})\s*$/i.exec(link.text || "");
    return bare ? Number(bare[1]) : null;
  }
  // The batch a link belongs to, from the nearest place that names a version: the file name, the link's own
  // text and line, the lines just above it, then the heading above those.
  // A file name as words: "Game.v1.05.part2.rar" -> "Game v1.05".
  function stemOf(text) {
    return String(text || "").replace(/\.(?:part\s*0*\d+\.)?(?:rar|r\d{2}|pkg|exfat|ffpfsc)\b.*$/i, "").replace(/(?<!\d)[._]+|[._]+(?!\d)/g, " ").replace(/\s+/g, " ").trim();
  }
  // A file name with its part number taken out, as one comparable word: "Game.v1.05.part2.rar" and "...part1.rar" agree.
  function setStem(name) {
    if (!name) return "";
    return norm(String(name).toLowerCase().replace(/[._\s-]*part[._\s-]*0*\d+/g, "").replace(/\.r\d{2}$/, ".rar").replace(/\.(?:rar|pkg|exfat|ffpfsc)$/, "")).slice(0, 80);
  }
  function batchOf(link, name) {
    const sources = [name, link.text, link.title, link.before, ...[...link.recent].reverse(), link.heading];
    for (const source of sources) {
      const version = versionOf(source);
      if (version) return { version, key: `v:${norm(version)}`, label: labelOf(link.heading || link.recent.at(-1) || stemOf(source)) };
    }
    const label = labelOf(link.heading || [...link.recent].reverse().find((line) => labelOf(line)) || "");
    return { version: "", key: label ? `h:${norm(label)}` : "", label };
  }
  var HAS_RAR = (link, name) => Boolean(name) || RAR_HINT.test(`${link.text} ${link.title} ${link.url} ${link.before.split(" ").slice(-4).join(" ")}`);

  // `options.assumeRar`: the text is a list the player pasted, so every link to a file host counts as one of
  // the files he wants, rar hint or not.
  function parsePage(html, pageUrl = "", options = {}) {
    const source = String(html ?? "");
    const base = pageUrl && /^https?:\/\//i.test(pageUrl) ? pageUrl : "";
    const found = gatherLinks(source, base);
    const pageHost = base ? hostOf(base) : "";
    const pageRoot = pageHost.split(".").slice(-2).join(".");
    const sequence = new Map(); // per host and heading: { index, last }, for batches that carry no version
    const batches = new Map();
    const other = [];
    const seen = new Set();
    for (const link of found) {
      if (seen.has(link.url)) continue;
      const host = hostOf(link.url);
      if (!host || NOT_DOWNLOADS.test(link.url) && !isFileHost(link.url)) continue;
      const sameSite = pageRoot && domainMatch(host, pageRoot);
      const name = fileNameOf(link);
      const hinted = HAS_RAR(link, name) || options.assumeRar === true;
      const rar = hinted && (isFileHost(link.url) || /\.(?:rar|r\d{2}|pkg|exfat|ffpfsc)(?:[?#]|$)/i.test(link.url) || !sameSite && /\bpart\s*\d+|\.rar/i.test(`${link.text} ${link.title}`));
      if (!rar) {
        if (isFileHost(link.url) && !IMAGE_FILE.test(link.url)) {
          seen.add(link.url);
          other.push({ url: link.url, host: hostName(link.url), text: (link.text || link.before || "").slice(0, 80) });
        }
        continue;
      }
      seen.add(link.url);
      const part = partOf(link, name);
      let batch = batchOf(link, name);
      if (!batch.key.startsWith("v:")) {
        // No version anywhere near it: a part number that does not go up starts the next batch on that host.
        const at = `${host}|${batch.key}`;
        const state = sequence.get(at) ?? { index: 1, seen: new Set() };
        // Links may come in any order (a pasted list): a batch only ends when a part number turns up twice on
        // the host, which means a second set starts. Sorting happens below.
        if (part != null && state.seen.has(part)) {
          state.index++;
          state.seen = new Set();
          state.label = labelOf(link.recent.at(-1) || "");
        }
        if (part != null) state.seen.add(part);
        sequence.set(at, state);
        batch = { version: "", key: `${batch.key || "n"}#${state.index}`, label: state.index > 1 && state.label ? state.label : batch.label };
      }
      // Parts of one set differ only by their number: two files whose names differ in anything else (another version,
      // base game against update) are two batches, however the page lays them out. A file with no readable name
      // keeps the batch the page gave it.
      const stem = setStem(name);
      if (stem) batch = { ...batch, key: `${batch.key || "n"}~${stem}`, label: batch.label || labelOf(stemOf(name)) };
      let entry = batches.get(batch.key);
      if (!entry) {
        entry = { key: batch.key, label: batch.label, version: batch.version, sizeGb: null, hosts: new Map(), order: batches.size };
        batches.set(batch.key, entry);
      }
      if (!entry.label && batch.label) entry.label = batch.label;
      if (entry.sizeGb == null) entry.sizeGb = sizeGbOf(`${link.lead} ${link.lineText} ${link.recent.join(" ")} ${link.heading}`);
      const hostKey = hostName(link.url);
      const group = entry.hosts.get(hostKey) ?? { host: hostKey, links: [] };
      entry.hosts.set(hostKey, group);
      if (group.links.length < 200) group.links.push({ url: link.url, part, filename: name, text: (link.text || "").slice(0, 80) });
    }
    const title = pageTitle(source);
    const bare = (value) => {
      let text = squash(value);
      if (title) text = text.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "gi"), " ");
      return text.replace(/^\s*(?:direct\s+)?(?:download|downloads|get)\b\s*[:\-]?\s*/i, "").replace(/\s+/g, " ").replace(/^[\s\-:+&·]+|[\s\-:&·]+$/g, "").trim();
    };
    const used = new Map();
    const list = [...batches.values()].sort((a, b) => a.order - b.order).map((batch, index) => {
      const hosts = [...batch.hosts.values()].map((group) => {
        // Parts in order; a host whose links carry no numbers is numbered as it lists them.
        const numbered = group.links.every((item) => item.part != null);
        const links = [...group.links];
        if (!numbered && links.length > 1) links.forEach((item, at) => { if (item.part == null) item.part = at + 1; });
        links.sort((a, b) => (a.part ?? 0) - (b.part ?? 0));
        const parts = links.map((item) => item.part).filter((item) => item != null);
        const missing = [];
        for (let n = 1, top = parts.length ? Math.max(...parts) : 0; n <= top; n++) if (!parts.includes(n)) missing.push(n);
        return { host: group.host, links, parts: links.length, missing };
      }).sort((a, b) => b.parts - a.parts || a.host.localeCompare(b.host));
      const words = bare(batch.label && norm(batch.label) !== norm(batch.version) ? batch.label : "");
      let label = [batch.version && !norm(words).includes(norm(batch.version)) ? batch.version : "", words].filter(Boolean).join(" · ") || `Batch ${index + 1}`;
      label = label.slice(0, 70);
      const times = (used.get(label.toLowerCase()) ?? 0) + 1;
      used.set(label.toLowerCase(), times);
      if (times > 1) label = `${label} (${times})`;
      const warnings = hosts.filter((host) => host.missing.length).map((host) => `${host.host} is missing part${host.missing.length > 1 ? "s" : ""} ${host.missing.join(", ")}`);
      return { key: batch.key, label, version: batch.version, sizeGb: batch.sizeGb, hosts, links: hosts.reduce((sum, host) => sum + host.parts, 0), warnings };
    }).filter((batch) => batch.links);
    const text = `${base} ${stripTags(source.replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, " "))}`;
    const ids = findTitleIds(`${title} ${metaContent(source, "og:title")} ${base} ${text}`);
    const images = pageImages(source, base);
    return {
      sourceUrl: base,
      title,
      titleId: ids[0] ?? "",
      titleIds: ids.slice(0, 6),
      platform: (ids[0] ?? "").startsWith("CUSA") ? "ps4" : "ps5",
      cover: images[0] ?? "",
      images,
      batches: list.slice(0, 12),
      other: other.slice(0, 60)
    };
  }


  // ---- one box for everything --------------------------------------------------------------------------
  // The player pastes whatever he has: a post's address, download links, both, or a page's source. This splits
  // it: `pages` are addresses to read, `linkText` is the pasted lines that carry download links (kept whole,
  // so file names beside a link still count), `html` means the text is a page's source.
  var URL_IN_TEXT = /https?:\/\/[^\s<>"'\u0001\u0002]+/gi;
  var isDownloadURL = (url) => isFileHost(url) || /\.(?:rar|r\d{2}|zip|7z|pkg|exfat|ffpfsc)(?:[?#]|$)/i.test(url) || /\.part0*\d+\.rar/i.test(url);
  function planInput(raw) {
    const text = String(raw ?? "").trim();
    if (!text) return { pages: [], linkText: "", html: false, links: 0 };
    if (/<\s*(?:html|body|a\s|div|p\s|head)\b/i.test(text)) return { pages: [], linkText: "", html: true, links: 0, text };
    const pages = [];
    const lines = [];
    let links = 0;
    for (const line of text.split(/\r?\n/)) {
      const urls = line.match(URL_IN_TEXT) || [];
      const downloads = urls.filter(isDownloadURL);
      for (const url of urls) if (!isDownloadURL(url) && !pages.includes(url)) pages.push(url.replace(/[.,;)\]]+$/, ""));
      if (downloads.length) {
        lines.push(line);
        links += downloads.length;
      }
    }
    return { pages, linkText: lines.join("\n"), html: false, links };
  }
  // A game name from the file names when no page gave one: "Some.Game.v1.05.part1.rar" -> "Some Game".
  function titleFromFiles(preview) {
    const first = preview?.batches?.[0]?.hosts?.[0]?.links?.find((link) => link.filename);
    if (!first) return "";
    const stem = stemOf(first.filename).replace(/\b(?:v|ver\.?|version)\s*\d[\d.]*\b/gi, " ").replace(/\b\d{1,2}\.\d{2,3}\b/g, " ").replace(/\b(?:PPSA|CUSA)\d{5}\b/gi, " ");
    return cleanTitle(stem.replace(/\b(?:rar|part\s*\d+|pkg|ps5|ps4)\b/gi, " ").replace(/\s+/g, " "));
  }
  // The pasted links' batches go in front of the page's own, so what the player pasted is what he sees first.
  function mergePasted(page, pasted) {
    const mark = (batch) => ({ ...batch, key: `p:${batch.key}`, label: /^Batch \d+$/.test(batch.label) ? batch.label.replace("Batch", "Pasted links") : `Pasted · ${batch.label}` });
    page.batches = [...pasted.batches.map(mark), ...page.batches].slice(0, 12);
    page.other = [...pasted.other, ...page.other].slice(0, 60);
    return page;
  }

  // ---- what the player kept, as a feed game -------------------------------------------------------------
  var TITLE_ID_FULL = /^(?:CUSA|PPSA)\d{5}$/;
  // `draft`: { id, title, cover?, sourceUrl?, batches: [{ key, label, hosts: [{ host, links: [{ url, part?,
  // filename? }] }] }] }, the batches and hosts the player left ticked. Throws a plain sentence when it
  // cannot make a game of it.
  function randomTint() {
    const hue = Math.floor(Math.random() * 360), sat = 0.55 + Math.random() * 0.25, light = 0.38 + Math.random() * 0.12;
    const a = sat * Math.min(light, 1 - light);
    const channel = (n) => {
      const k = (n + hue / 30) % 12;
      return Math.round(255 * (light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, "0");
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`;
  }
  // The releases a list of batches ({ key, label, hosts: [{ host, links }] }) makes, one per link.
  function releasesFromBatches(batches, title, sourceUrl) {
    const releases = [];
    const names = new Set();
    let site = "";
    try {
      site = /^https?:\/\/([^\/:?#\s]+)/i.exec(String(sourceUrl ?? "").trim())?.[1].toLowerCase().replace(/^www\./, "") ?? "";
    } catch {
    }
    for (const batch of Array.isArray(batches) ? batches.slice(0, 24) : []) {
      const label = squash(batch?.label).slice(0, 60) || "Download";
      const firstUrl = (Array.isArray(batch?.hosts) ? batch.hosts : []).flatMap((group) => Array.isArray(group?.links) ? group.links : []).find((item) => typeof item?.url === "string")?.url ?? "";
      let sum = 0;
      for (const char of firstUrl) sum = (sum * 31 + char.charCodeAt(0)) % 46656;
      // The same links imported again make the same record (so they replace themselves); other links add a new one.
      const record = `import-${slug(batch?.key || label)}-${sum.toString(36)}`;
      // Optional: the password the batch's archives are locked with (the extractor tries it first).
      const password = typeof batch?.password === "string" ? batch.password.trim().slice(0, 256) : "";
      for (const group of Array.isArray(batch?.hosts) ? batch.hosts.slice(0, 24) : []) {
        const links = (Array.isArray(group?.links) ? group.links : []).filter((item) => typeof item?.url === "string").slice(0, 200);
        links.forEach((item, at) => {
          let url;
          try {
            url = webURL(item.url.trim()).url;
          } catch {
            return;
          }
          const part = Number.isSafeInteger(item.part) && item.part > 0 ? item.part : links.length > 1 ? at + 1 : null;
          let filename = squash(item.filename).replace(/[\/\\]/g, "_").slice(0, 150);
          if (!/\.(?:rar|7z|zip|r\d{2}|pkg|exfat|ffpfsc)$/i.test(filename)) filename = `${slug(title)}-${slug(label)}${part != null ? `.part${String(part).padStart(2, "0")}` : ""}.rar`;
          if (names.has(`${record}/${hostName(url)}/${filename}`)) filename = filename.replace(/(\.[^.]+)$/, `-${releases.length}$1`);
          names.add(`${record}/${hostName(url)}/${filename}`);
          const extension = /\.([a-z0-9]+)$/i.exec(filename)?.[1].toLowerCase();
          // A game file (.pkg, .exfat, .ffpfsc) is one file, not a volume of an archive: several in a batch are listed
          // one by one, never joined into an archive set (which a "part N" in the label would do).
          const single = extension === "pkg" || extension === "exfat" || extension === "ffpfsc";
          releases.push({
            url,
            label: single ? part != null ? `${label} (${part})` : label : part != null ? `${label} part ${part}` : label,
            record,
            provider: String(group.host || hostName(url)).slice(0, 40),
            format: single || extension === "7z" || extension === "zip" ? extension : "rar",
            filename,
            requiresBrowser: needsBrowser(url),
            ...site ? { site } : {},
            ...password ? { archivePassword: password } : {}
          });
        });
      }
    }
    return releases;
  }
  function buildGame(draft) {
    const id = String(draft?.id ?? "").trim().toUpperCase().replace(/[\s_-]/g, "");
    if (!TITLE_ID_FULL.test(id)) throw new Error("The Title ID must look like PPSA12345 or CUSA12345.");
    const title = squash(draft?.title).slice(0, 200);
    if (!title) throw new Error("Give the game a title.");
    const releases = releasesFromBatches(draft?.batches, title, draft?.sourceUrl);
    if (!releases.length) throw new Error("Tick at least one batch with links to save.");
    const art = {};
    const cover = typeof draft?.cover === "string" ? draft.cover.trim() : "";
    if (/^https?:\/\//i.test(cover)) {
      try {
        art.cover = webURL(cover).url;
        art.hero = art.cover;
      } catch {
      }
    }
    // No picture: a colour for the tile, the one the phone picked (a photo's main colour or a random one), else a random one here.
    if (!art.cover) {
      const picked = typeof draft?.tint === "string" && /^#[0-9a-f]{6}$/i.test(draft.tint) ? draft.tint : "";
      art.tint = picked || randomTint();
    }
    const game = { id, title, platform: id.startsWith("CUSA") ? "ps4" : "ps5", releases };
    if (Object.keys(art).length) game.art = art;
    const sourceUrl = typeof draft?.sourceUrl === "string" ? draft.sourceUrl.trim() : "";
    if (/^https?:\/\//i.test(sourceUrl) && sourceUrl.length < 600) game.importedFrom = sourceUrl;
    return game;
  }

export { randomTint, releasesFromBatches, squash, titleIdFromLinks, buildGame, checkPageURL, cleanTitle, findTitleIds, hostName, mergePasted, needsBrowser, pageImages, pageTitle, parsePage, planInput, titleFromFiles, versionOf };
