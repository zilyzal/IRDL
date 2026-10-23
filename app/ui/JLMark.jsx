// IRDL's mark: a download arrow over a tray, two flat polygons in a 96x64 box (aspect 3:2): the arrow in
// ice blue and the tray in the accent blue. The component and export names keep the "JL" they had in the
// code this app grew from, so every screen that draws the mark still finds it. The phone page draws the same
// glyph (companion/page.js) and packaging/brand/make_brand_art.py draws it for the home-screen art.
// Two shapes, well under the vector node's 16-shape limit.

import { jsx, jsxs } from 'react/jsx-runtime';
import { Path, Svg } from '@ps5-react/core';

  var J_RED = "#4CC9F0", L_RED = "#3A86FF";
  // The arrow: a shaft and a head pointing down.
  var J_PATH = "M40 4L56 4L56 28L70 28L48 52L26 28L40 28Z";
  // The tray under it.
  var L_PATH = "M12 55L84 55L84 62L12 62Z";
  var RATIO = 96 / 64;
  // The whole mark, `height` tall.
  function JLMark({ height }) {
    return /* @__PURE__ */ (0, jsxs)(Svg, { width: Math.round(height * RATIO), height, viewBox: "0 0 96 64", children: [
      /* @__PURE__ */ (0, jsx)(Path, { d: J_PATH, fill: J_RED }, "j"),
      /* @__PURE__ */ (0, jsx)(Path, { d: L_PATH, fill: L_RED }, "l")
    ] });
  }
  // One half alone, in the same box, for an entry that brings the two in apart.
  function JLHalf({ height, which }) {
    return /* @__PURE__ */ (0, jsx)(Svg, { width: Math.round(height * RATIO), height, viewBox: "0 0 96 64", children: /* @__PURE__ */ (0, jsx)(Path, { d: which === "j" ? J_PATH : L_PATH, fill: which === "j" ? J_RED : L_RED }) });
  }

export { JLHalf, JLMark, J_PATH, J_RED, L_PATH, L_RED, RATIO };
