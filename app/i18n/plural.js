// ../pub-game-store/native/i18n/plural.js
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: Italian plural rule.


  function operands(n) {
    const abs = Math.abs(n);
    const text = String(abs);
    const dot = text.indexOf(".");
    return { n: abs, i: Math.floor(abs), v: dot < 0 ? 0 : text.length - dot - 1 };
  }
  var RULES = {
    en: ({ i, v }) => i === 1 && v === 0 ? "one" : "other",
    fa: ({ n, i }) => i === 0 || n === 1 ? "one" : "other"
  };
  var pluralCategory = (locale2, n) => (RULES[locale2] ?? RULES.en)(operands(n));

export { pluralCategory };
