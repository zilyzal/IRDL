// A newer IRDL build exists (state/update.js found a release newer than this one). Opened from the
// header's update badge or Settings → About. It says what changed and, on the PS5, installs it
// (state/auto-update.js): Download and install, its progress, then "Update ready – Restart app to apply",
// which closes the app while updater.elf puts the new image in place and opens it again. Elsewhere, or for a
// release without checkable files, it points at the release page and the copy-over steps.

import '../assets/Exo2.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { useT } from '../i18n/index.js';
import { formatBytes } from '../state/size.js';
import { canInstall, cancelUpdate, closeUpdateDialog, downloadUpdate, restartToApply, useInstall, useUpdate, useUpdateDialog } from '../state/update.js';
import { VERSION_LABEL } from '../version.js';
import { Button2 } from './Button.jsx';
import { readableNotes } from './release-notes.js';
import { colors, radius } from './colors.js';
import { FocusScope, Linking, Text, View, motion } from '@ps5-react/core';

  var ENTER = { type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] };
  // The card's inner width: the progress track is exactly this wide, however far along it is.
  var BAR = 884;
  var NOTES_ROWS = 9;
  var sans = (size, color, extra) => ({ fontFamily: "Exo2", fontSize: size, lineHeight: Math.round(size * 1.42), color, ...extra });
  // A fixed-size track; the fill and the rest share it by proportion, so the fill can never pass its end.
  function Track({ fraction, active }) {
    const filled = Math.round(Math.max(0, Math.min(1, Number(fraction) || 0)) * 1000);
    return /* @__PURE__ */ (0, jsxs)(View, { style: { width: BAR, height: 10, flexDirection: "row", overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.surface2 }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: filled, backgroundColor: active ? colors.accent : colors.subtle } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1000 - filled } })
    ] });
  }
  // The notes: headings and bullets in a panel of fixed height, so the card keeps its shape.
  function Notes({ body }) {
    const t2 = useT();
    const { rows, more } = readableNotes(body, NOTES_ROWS);
    if (!rows.length) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { width: BAR, gap: 8, borderRadius: radius.lg, backgroundColor: colors.surface2, paddingHorizontal: 28, paddingVertical: 22 }, children: [
      /* @__PURE__ */ (0, jsx)(Text, { style: sans(19, colors.subtle, { fontWeight: 600, letterSpacing: 2 }), children: t2("update.whatsNew").toUpperCase() }),
      ...rows.map((row, index) => row.head !== undefined
        ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(21, colors.accentHi, { fontWeight: 600, marginTop: index ? 8 : 0 }), children: row.head }, index)
        : /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 14 }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: sans(22, colors.muted), children: "\u2022" }),
          /* @__PURE__ */ (0, jsx)(Text, { style: sans(22, colors.fg, { flex: 1, numberOfLines: 2, ellipsizeMode: "tail", lineHeight: 31 }), children: row.item })
        ] }, index)),
      more ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(20, colors.subtle), children: t2("update.moreNotes", { count: more }) }) : null
    ] });
  }
  var fractionOf = (install) => install.total ? Math.min(1, install.written / install.total) : 0;
  // What the install says under the notes, and in which color, for each phase.
  function status(t2, install, update) {
    if (install.version !== update.version) return null;
    switch (install.phase) {
      case "waiting":
        return [t2("update.install.waiting"), colors.muted];
      case "downloading":
        return [t2("update.install.downloading", { done: formatBytes(install.written), total: formatBytes(install.total) }), colors.muted];
      case "checking":
        return [t2("update.install.checking"), colors.muted];
      case "paused":
        return [t2("update.install.paused"), "#fbbf24"];
      case "ready":
        return [install.error ? t2("update.install.failed", { error: install.error }) : t2("update.install.readyDetail"), install.error ? "#fbbf24" : colors.muted];
      case "armed":
        return [t2("update.install.armed"), colors.muted];
      case "failed":
        return [install.outcome?.outcome === "rolledback" ? t2("update.install.rolledBack", { version: update.version, reason: install.outcome.reason }) : t2("update.install.failed", { error: install.error }), "#f87171"];
      default:
        return null;
    }
  }
  function UpdateDialog() {
    const t2 = useT();
    const open = useUpdateDialog();
    const { update } = useUpdate();
    const install = useInstall();
    const [note, setNote] = (0, useState)("");
    if (!open || !update) return null;
    const view = () => {
      try {
        setNote(Linking.openURL(update.url) ? "" : t2("update.noBrowser", { url: update.url }));
      } catch {
        setNote(t2("update.noBrowser", { url: update.url }));
      }
    };
    const close = () => {
      setNote("");
      closeUpdateDialog();
      return true;
    };
    const mine = install.version === update.version;
    const phase = mine ? install.phase : "idle";
    const installable = canInstall && Boolean(update.assets);
    const busy = ["waiting", "downloading", "checking"].includes(phase);
    const ready = phase === "ready" || phase === "armed";
    const said = status(t2, install, update);
    const restart = () => {
      const reason = restartToApply();
      setNote(reason ? t2("update.install.failed", { error: reason }) : "");
    };
    const start = () => {
      setNote(downloadUpdate() ? "" : t2("update.install.noAssets"));
    };
    // The first button is the step that comes next; the release page and Close follow.
    const actions = [
      ready ? /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", icon: "restart", label: t2("update.install.restart"), autoFocus: true, onPress: restart }, "restart") : null,
      busy ? /* @__PURE__ */ (0, jsx)(Button2, { variant: "secondary", size: "lg", icon: "x", label: t2("update.install.cancel"), autoFocus: true, onPress: () => cancelUpdate() }, "cancel") : null,
      installable && !ready && !busy ? /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", icon: "download", label: t2(phase === "failed" ? "update.install.retry" : "update.install.download"), autoFocus: true, onPress: start }, "download") : null,
      /* @__PURE__ */ (0, jsx)(Button2, { variant: installable ? "secondary" : "primary", size: "lg", icon: "external", label: t2("update.view"), autoFocus: !installable, onPress: view }, "view"),
      /* @__PURE__ */ (0, jsx)(Button2, { variant: "secondary", size: "lg", label: t2("update.close"), onPress: close }, "close")
    ].filter(Boolean);
    return (
      // A modal: the page's actions stop here.
      /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: close, onAction: () => true, children: /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 70, alignItems: "center", justifyContent: "center", backgroundColor: `${colors.canvas}f2` }, children: /* @__PURE__ */ (0, jsxs)(motion.View, {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: ENTER,
        style: { width: 980, gap: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 48 },
        children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 10 }, children: [
            /* @__PURE__ */ (0, jsx)(View, { style: { alignSelf: "flex-start", borderRadius: radius.pill, backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 4 }, children: /* @__PURE__ */ (0, jsx)(Text, { style: sans(19, colors.accentFg, { fontWeight: 600 }), children: t2(ready ? "update.install.ready" : "update.available") }) }),
            /* @__PURE__ */ (0, jsx)(Text, { style: sans(60, colors.fg, { fontWeight: 600 }), children: `v${update.version}` }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 21, lineHeight: 30, color: colors.muted }, children: `v${VERSION_LABEL}  →  v${update.version}` })
          ] }),
          update.notes ? /* @__PURE__ */ (0, jsx)(Notes, { body: update.notes }) : null,
          busy || ready ? /* @__PURE__ */ (0, jsxs)(View, { style: { width: BAR, gap: 10 }, children: [
            /* @__PURE__ */ (0, jsx)(Track, { fraction: ready ? 1 : fractionOf(install), active: busy ? phase === "downloading" : true }),
            said ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(21, said[1], { numberOfLines: 2, ellipsizeMode: "tail" }), children: said[0] }) : null
          ] }) : said ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(21, said[1], { width: BAR }), children: said[0] }) : null,
          /* @__PURE__ */ (0, jsx)(Text, { style: sans(20, colors.subtle, { width: BAR }), children: t2(installable ? "update.howTo" : "update.howToManual") }),
          note ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(20, "#fbbf24"), children: note }) : null,
          /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 16 }, children: actions })
        ]
      }) }) })
    );
  }

export { UpdateDialog };
