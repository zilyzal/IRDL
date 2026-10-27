// Renders the screens once each (every function component and style function called) against a catalog that
// starts EMPTY, as IRDL's does until a game is imported. Fails on any exception.
// Run: npm run test:render
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

globalThis.screen = { width: 1920, height: 1080 };
const repo = process.env.JL_REPO || fileURLToPath(new URL('../..', import.meta.url));
const load = (rel) => import(pathToFileURL(path.join(repo, rel)).href);
const en = (await load('app/i18n/locales/en.json')).default;
(await load('app/i18n/core.js')).configure(() => en, en);
// SMOKE_GAMES=2 puts two imported games (cover art only, as a post page gives) in the store.
const imported = Number(process.env.SMOKE_GAMES || 0);
const { parsePage, buildGame } = await load('app/state/page-import.js');
const savedGames = Array.from({ length: imported }, (_, index) => {
  const preview = parsePage(`<html><head><title>Sample Game ${index + 1} PPSA0${1230 + index}</title><meta property="og:image" content="https://cdn.example.org/c${index}.jpg"></head><body><h2>v1.0${index}</h2><a href="https://1fichier.com/?a${index}">Sample.v1.0${index}.part1.rar</a> <a href="https://1fichier.com/?b${index}">Sample.v1.0${index}.part2.rar</a></body></html>`, 'https://examplesite.test/post/');
  return buildGame({ id: preview.titleId, title: preview.title, cover: preview.cover, sourceUrl: preview.sourceUrl, batches: preview.batches.map((batch) => ({ key: batch.key, label: batch.label, hosts: batch.hosts })) });
});
const importedFile = JSON.stringify({ version: 1, name: 'Imported games', games: savedGames });
globalThis.__fake = { jobs: [], fs: { exists: (p) => imported > 0 && /imported\.json$/.test(p), stat: () => null, readDir: () => [], readFile: (p) => { if (/imported\.json$/.test(p)) return importedFile; throw new Error('ENOENT'); }, diskUsage: () => ({ total: 1, free: 1 }) }, queue: new Proxy({ snapshot: () => [], subscribe: () => () => {} }, { get: (t, k) => k in t ? t[k] : () => Promise.resolve({}) }), focused: true, drives: { roots: ['/data'], ready: true, usage: {} } };

let rendered = 0;
function walk(node) {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(walk);
  const { type, props = {} } = node;
  if (typeof props.style === 'function') props.style({ focused: true, pressed: false });
  if (typeof type === 'function') {
    rendered++;
    return walk(type(props));
  }
  walk(props.children);
}
const failures = [];
async function screen(name, file, exportName, props = {}) {
  try {
    const mod = await load(file);
    walk({ type: mod[exportName], props });
    console.log(`ok  ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.stack?.split('\n').slice(0, 4).join(' | ')}`);
    console.log(`FAIL ${name}: ${error.message}`);
  }
}
const noop = () => {};
const { NO_FILTERS } = await load('app/state/catalog.js');
globalThis.__fake.storeState = { filters: NO_FILTERS, sort: 'relevance', query: '', wishlist: [] };
await screen('Browse (home)', 'app/browse/BrowsePage.jsx', 'BrowsePage', { onOpenGame: noop, onOpenGenre: noop });
if (imported) {
  const { getGame } = await load('app/state/catalog.js');
  await screen('Game page (imported)', 'app/game/index.jsx', 'GameScreen', { game: getGame(savedGames[0].id), onBack: noop, onOpenGame: noop });
}
await screen('Header', 'app/ui/Header.jsx', 'Header', { children: null });
await screen('Downloads', 'app/downloads/DownloadsScreen.jsx', 'DownloadsScreen', { onBack: noop, onOpenGame: noop });
await screen('Library', 'app/library/LibraryScreen.jsx', 'LibraryScreen', { onBack: noop, onOpenGame: noop });
await screen('Files', 'app/files/FilesScreen.jsx', 'FilesScreen', { onBack: noop });
await screen('Settings', 'app/ui/Settings.jsx', 'SettingsScreen', { onBack: noop });
await screen('Search', 'app/search/index.jsx', 'SearchScreen', { onBack: noop, onOpenGame: noop });
await screen('What\'s new', 'app/ui/WhatsNew.jsx', 'WhatsNew');
if (failures.length) {
  console.error(`\n${failures.length} screen(s) threw:\n${failures.join('\n')}`);
  process.exit(1);
}
const { gameCount } = await load('app/state/catalog.js');
assert.equal(gameCount(), imported, 'the store holds the imported games');
console.log(`\nOK (${imported} games): ${rendered} components rendered without an exception`);
