// ../pub-game-store/native/game/index.jsx
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: no Vikingfile capture dialog.

import '../assets/Exo2.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { URLDialog } from '../downloads/URLDialog.jsx';
import { BrowserCaptureDialog } from '../downloads/BrowserCaptureDialog.jsx';
import { Backdrop, Meta } from './GameHero.jsx';
import { BackLink } from './BackLink.jsx';
import { DownloadButton } from './DownloadButton.jsx';
import { canDownload } from './releases.js';
import { LOGO } from './art.js';
import { Button2 } from '../ui/Button.jsx';
import { Cover } from '../ui/Cover.jsx';
import { GameLogo } from '../ui/GameLogo.jsx';
import { WishHeart } from '../ui/WishHeart.jsx';
import { useStoreActions, useWishlist } from '../state/store.jsx';
import { listedId } from '../state/catalog.js';
import { InstallToast, TOAST_MS } from './InstallToast.jsx';
import { OptionsSheet } from './OptionsSheet.jsx';
import { DiagnosisSheet } from './DiagnosisSheet.jsx';
import { MakeRoomSheet } from '../library/MakeRoomSheet.jsx';
import { SourcePicker } from './SourcePicker.jsx';
import { VersionSheet } from './VersionSheet.jsx';
import { useT } from '../i18n/index.js';
import { downloadQueue } from '../state/downloads.js';
import { useLinkWatch } from '../state/links.js';
import { useNavActions } from '../state/nav.jsx';
import { useFavoriteAction } from '../ui/GameCard.jsx';
import { lightGame, unlight } from '../ui/lightBar.js';
import { playNotify } from '../ui/sounds.js';
import { AnimatePresence, FocusScope, Text, View } from '@ps5-react/core';
import { colors, radius } from '../ui/colors.js';

  function GameScreen({ game, download, onBack, onOpenGame }) {
    const [dialog, setDialog] = (0, useState)(null);
    const [toast, setToast] = (0, useState)(null);
    const { focusLater } = useNavActions();
    const Dialog = { source: SourcePicker, options: OptionsSheet, version: VersionSheet, diagnosis: DiagnosisSheet, makeRoom: MakeRoomSheet }[dialog?.kind] ?? URLDialog;
    const t2 = useT();
    const { toggleWish } = useStoreActions();
    const wished = useWishlist().includes(listedId(game.id));
    const about = game.about.filter((text) => text.trim());
    // Its download links checked in the background while the page is open (state/links.js).
    useLinkWatch(game.id, game);
    (0, useEffect)(() => {
      const key = `page:${game.id}`;
      lightGame(key, game);
      return () => unlight(key);
    }, [game.id]);
    (0, useEffect)(() => {
      if (!toast) return void 0;
      playNotify();
      const timer = setTimeout(() => setToast(null), TOAST_MS);
      return () => clearTimeout(timer);
    }, [toast]);
    // A download of this game whose file link is being captured from the browser (BrowserCaptureDialog).
    const [captureJob, setCaptureJob] = (0, useState)(null);
    (0, useEffect)(() => {
      let known;
      const queued = (jobs) => jobs.filter((job2) => job2.gameId === game.id).length;
      try {
        return downloadQueue().subscribe((jobs) => {
          const count = queued(jobs);
          if (known !== void 0 && count > known) setToast("started");
          known = count;
          setCaptureJob(jobs.find((job2) => job2.gameId === game.id && job2.captureState) || null);
        });
      } catch {
        return void 0;
      }
    }, [game.id]);
    const onAction = useFavoriteAction(game);
    const back2 = () => {
      onBack();
      return true;
    };
    // A popup: the game's art dimmed behind a centred card with the cover, the name, the download and favourite
    // buttons and a short about text. (Imported games have no screenshots, features or related games.)
    return /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: back2, onAction, children: /* @__PURE__ */ (0, jsxs)(View, { style: { position: "relative", flex: 1, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, jsx)(Backdrop, { game }, game.id),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: `${colors.canvas}e0` } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1180, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 48, paddingTop: 30, paddingBottom: 48 }, children: [
        /* @__PURE__ */ (0, jsx)(BackLink, { onPress: onBack }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { marginTop: 30, flexDirection: "row", alignItems: "flex-end", gap: 54 }, children: [
          /* @__PURE__ */ (0, jsx)(View, { style: { width: 252, height: 336, overflow: "hidden", roundedClip: true, borderRadius: radius.sm, backgroundColor: game.art.tint || colors.surface2 }, children: /* @__PURE__ */ (0, jsx)(Cover, { game, style: { width: 252, height: 336 } }) }),
          /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
            /* @__PURE__ */ (0, jsx)(View, { style: { marginBottom: 20 }, children: /* @__PURE__ */ (0, jsx)(GameLogo, { game, width: LOGO.width, height: LOGO.height }) }),
            /* @__PURE__ */ (0, jsx)(Meta, { game }),
            /* @__PURE__ */ (0, jsxs)(View, { style: { marginTop: 36, flexDirection: "row", alignItems: "flex-start", gap: 15 }, children: [
              /* @__PURE__ */ (0, jsx)(DownloadButton, { onRequestDialog: setDialog, game, start: download, onDownloaded: () => setToast("complete") }, game.id),
              /* @__PURE__ */ (0, jsx)(Button2, { variant: "outline", size: "lg", label: t2(wished ? "game.favorite" : "game.addToFavorites"), onPress: () => toggleWish(game.id), autoFocus: !canDownload(game), focusKey: `favorite:${game.id}`, children: /* @__PURE__ */ (0, jsx)(WishHeart, { active: wished }) })
            ] })
          ] })
        ] }),
        about.length > 0 ? /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 36, width: 1084, fontFamily: "Exo2", fontSize: 21, lineHeight: 30, color: colors.muted, numberOfLines: 4, ellipsizeMode: "tail" }, children: about[0] }) : null
      ] }) }),
      dialog ? /* @__PURE__ */ (0, jsx)(Dialog, { ...dialog, onClose: () => {
        setDialog(null);
        focusLater(dialog.from ?? `download:${game.id}`);
      } }) : null,
      captureJob ? /* @__PURE__ */ (0, jsx)(BrowserCaptureDialog, { job: captureJob }, captureJob.id) : null,
      /* @__PURE__ */ (0, jsx)(AnimatePresence, { children: toast ? /* @__PURE__ */ (0, jsx)(InstallToast, { game, started: toast === "started" }, toast) : null })
    ] }) });
  }

export { GameScreen };
