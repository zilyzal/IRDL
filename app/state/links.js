// IRDL 1.0.0: no link health. Every link is added by hand, so every link counts as available and nothing is
// checked in the background or on request. The exports stay (they are what the game page and the phone call),
// but each one only hands its input back.

  var plain = { overlay: (releases) => releases, version: 0, subscribe: () => () => {
  }, progressOf: () => null, report: () => {
  }, want: () => {
  }, drop: () => {
  }, checkNow: async () => null };
  var linkHealth = () => plain;
  var watchLinks = () => () => {
  };
  var useLinkWatch = () => {
  };
  var useHealthyReleases = (releases) => releases;
  var useLinkCheck = () => null;
  var checkLinksNow = async () => null;

export { checkLinksNow, linkHealth, useHealthyReleases, useLinkCheck, useLinkWatch, watchLinks };
