// A game has just come into the catalog from the phone (Import tab or catalog upload): its cover, a Download
// button that starts the default source the way the game page's button would, and a smaller Back button.

import '../assets/Exo2.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { useT } from '../i18n/index.js';
import { getGame } from '../state/catalog.js';
import { startRemoteDownload } from '../companion/remote-download.js';
import { dismissAdded, useAnnounced } from '../state/recent.js';
import { useNavActions } from '../state/nav.jsx';
import { Button2 } from './Button.jsx';
import { Cover } from './Cover.jsx';
import { colors, radius } from './colors.js';
import { FocusScope, Text, View, motion } from '@ps5-react/core';

  var ENTER = { type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] };
  var sans = (size, color, extra) => ({ fontFamily: "Exo2", fontSize: size, lineHeight: Math.round(size * 1.35), color, ...extra });
  function AddedDialog() {
    const t2 = useT();
    const announced = useAnnounced();
    const { openGame } = useNavActions();
    const [note, setNote] = (0, useState)("");
    const game = announced ? getGame(announced.id) : null;
    if (!announced || !game) return null;
    const close = () => {
      setNote("");
      dismissAdded();
      return true;
    };
    const download = () => {
      try {
        startRemoteDownload(game);
        close();
      } catch (error) {
        // A source that needs the console's browser (or no drive) cannot start here: the game page can.
        setNote(error.message);
        setTimeout(() => {
          dismissAdded();
          openGame(game.id);
        }, 2200);
      }
    };
    return (
      // A modal: the page's actions stop here.
      /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: close, onAction: () => true, children: /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 75, alignItems: "center", justifyContent: "center", backgroundColor: `${colors.canvas}f2` }, children: /* @__PURE__ */ (0, jsxs)(motion.View, {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: ENTER,
        style: { width: 640, gap: 24, alignItems: "center", borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 44 },
        children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: sans(20, colors.accent, { fontWeight: 600 }), children: t2("added.title") }),
          /* @__PURE__ */ (0, jsx)(Cover, { game, style: { width: 320, height: 320, borderRadius: radius.md, overflow: "hidden" } }),
          /* @__PURE__ */ (0, jsx)(Text, { style: sans(30, colors.fg, { fontWeight: 600, textAlign: "center", numberOfLines: 2, ellipsizeMode: "tail" }), children: game.title }),
          announced.count > 1 ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(20, colors.muted), children: t2("added.more", { count: announced.count - 1 }) }) : null,
          note ? /* @__PURE__ */ (0, jsx)(Text, { style: sans(19, "#fbbf24", { textAlign: "center" }), children: note }) : null,
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 16 }, children: [
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", icon: "download", label: t2("added.download"), autoFocus: true, onPress: download }, "download"),
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "secondary", size: "lg", label: t2("added.back"), onPress: close }, "back")
          ] })
        ]
      }) }) })
    );
  }

export { AddedDialog };
