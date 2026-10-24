// IRDL: the top of the home page. IRDL starts with no catalog, so instead of a spotlight of featured games this
// is a panel that says how to add games: open the phone companion's address (or the console's own browser at
// localhost), sign in with the PIN and use the Import tab. It shows the address, the PIN and a QR code once the
// companion runs, and sends the player to Settings to turn it on while it does not.

import '../assets/Exo2.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { memo } from 'react';
import { Text, View } from '@ps5-react/core';
import { useCompanion } from '../companion/service.js';
import { useLocale, useT } from '../i18n/index.js';
import { gameCount } from '../state/catalog.js';
import { useCatalogVersion } from '../state/catalog-live.js';
import { useNavActions } from '../state/nav.jsx';
import { Button2 } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';
import { QRCode } from '../ui/QRCode.jsx';
import { colors, radius } from '../ui/colors.js';

  var mono = { fontFamily: "JetBrainsMono-Regular", color: colors.fg };
  function Address({ companion }) {
    const t2 = useT();
    const local = companion.url ? companion.url.replace(/^http:\/\/[^:/]+/, "http://localhost") : "";
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 36 }, children: [
      companion.url ? /* @__PURE__ */ (0, jsx)(QRCode, { text: companion.url, size: 216 }) : null,
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 14 }, children: [
        companion.url ? /* @__PURE__ */ (0, jsx)(View, { style: { borderRadius: radius.md, backgroundColor: colors.canvas2, paddingHorizontal: 22, paddingVertical: 12 }, children: /* @__PURE__ */ (0, jsx)(Text, { style: [mono, { fontSize: 28, lineHeight: 38 }], children: companion.url }) }) : null,
        companion.pin ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 18 }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Exo2", fontSize: 18, fontWeight: 600, letterSpacing: 2, color: colors.subtle }, children: t2("settings.companion.pin") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: [mono, { fontSize: 38, lineHeight: 48, letterSpacing: 6, color: colors.glow }], children: companion.pin })
        ] }) : null,
        local ? /* @__PURE__ */ (0, jsx)(Text, { style: { width: 560, fontFamily: "Exo2", fontSize: 19, lineHeight: 28, color: colors.subtle }, children: t2("settings.companion.here", { url: local }) }) : null
      ] })
    ] });
  }
  var HomeHero = (0, memo)(function HomeHero2() {
    const t2 = useT();
    const { rtl } = useLocale();
    const { push } = useNavActions();
    const companion = useCompanion();
    useCatalogVersion();
    const empty = gameCount() === 0;
    const live = companion.enabled && companion.state === "listening" && companion.url;
    return /* @__PURE__ */ (0, jsx)(View, { style: { width: 1824, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, padding: 56 }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 48 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { width: 760, gap: 22 }, children: [
        /* @__PURE__ */ (0, jsx)(Icon, { name: "globe", size: 40, color: colors.accent }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Exo2", fontSize: 44, fontWeight: 600, lineHeight: 56, color: colors.fg }, children: empty ? t2("home.title.empty") : t2("home.title.add") }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Exo2", fontSize: 24, lineHeight: 38, color: colors.muted }, children: live ? t2("home.body") : t2("home.companionOff") }),
        /* @__PURE__ */ (0, jsx)(View, { style: { marginTop: 8, flexDirection: "row" }, children: /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("home.openSettings"), focusKey: "spotlight:cta", nextFocusUp: "nav:current", onPress: () => push({ name: "settings" }, "spotlight:cta") }) })
      ] }),
      live ? /* @__PURE__ */ (0, jsx)(Address, { companion }) : null
    ] }) });
  });

export { HomeHero };
