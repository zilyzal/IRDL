// ../pub-game-store/native/i18n/locales.js
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: Italian.


  var NBSP = "\xA0";
  var NNBSP = "\u202F";
  var SOURCE_LOCALE = "en";
  var LOCALES = [
    {
      code: "en",
      name: "English",
      group: ",",
      decimal: ".",
      percent: "{n}%",
      date: "{MMM} {d}, {y}",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      list: [", ", ", and ", " and "]
    },
    {
      code: "fa",
      name: "فارسی",
      rtl: true,
      group: ",",
      decimal: ".",
      percent: "{n}%",
      date: "{d} {MMM} {y}",
      months: ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"],
      list: ["\u060C ", " \u0648 ", " \u0648 "]
    }
  ];
  var byCode = new Map(LOCALES.map((locale2) => [locale2.code, locale2]));
  var localeData = (code) => byCode.get(code) ?? byCode.get(SOURCE_LOCALE);
  var isRTL = (code) => Boolean(byCode.get(code)?.rtl);
  function matchLocale(tag) {
    if (!tag) return null;
    const [language, ...rest2] = tag.replace(/_/g, "-").split("-");
    const exact = LOCALES.find((locale2) => locale2.code.toLowerCase() === tag.toLowerCase().replace(/_/g, "-"));
    if (exact) return exact.code;
    if (language.toLowerCase() === "zh") return rest2.some((part) => /^(hant|tw|hk|mo)$/i.test(part)) ? null : "zh-Hans";
    return LOCALES.find((locale2) => locale2.code.split("-")[0] === language.toLowerCase())?.code ?? null;
  }

export { LOCALES, SOURCE_LOCALE, isRTL, localeData, matchLocale };
