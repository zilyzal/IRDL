// IRDL's mark: the supplied logo (assets/logo.png, drawn by packaging/brand/make_new_art.py). The component
// and export names keep the "JL" they had in the code this app grew from, so every screen finds it.

import { jsx } from 'react/jsx-runtime';
import { Image } from '@ps5-react/core';
import logo from '../assets/logo.png';

  var J_RED = "#4CC9F0", L_RED = "#3A86FF";
  var RATIO = 781 / 805;
  // The whole mark, `height` tall.
  function JLMark({ height }) {
    return /* @__PURE__ */ (0, jsx)(Image, { source: logo, resizeMode: "contain", style: { width: Math.round(height * RATIO), height } });
  }
  function JLHalf(props) {
    return JLMark(props);
  }

export { JLHalf, JLMark, J_RED, L_RED, RATIO };
