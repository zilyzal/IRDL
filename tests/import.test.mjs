// The Import tab: reading a post page into batches (state/page-import.js), keeping what the player ticked
// (state/imported.js) and the console-side job that does it for the phone (companion/importer.js + api.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const repo = fileURLToPath(new URL('..', import.meta.url));
const load = (rel) => import(pathToFileURL(path.join(repo, rel)).href);
const page = (name) => readFileSync(path.join(repo, 'tests/fixtures/pages', name), 'utf8');
const { parsePage, buildGame, titleIdFromLinks, cleanTitle, findTitleIds, versionOf, checkPageURL, needsBrowser } = await load('app/state/page-import.js');
const { createImportedStore } = await load('app/state/imported.js');
const { createImporter } = await load('app/companion/importer.js');
const { createCompanionApi } = await load('app/companion/api.js');
const { parseFeed } = await load('app/state/feed-format.js');
const { releaseSets } = await load('app/state/release-sets.js');

const SITE = 'https://examplesite.test/games/example-quest/';

test('import: a post with two versions gives its title, Title ID, cover and one batch per version', () => {
  const found = parsePage(page('two-batches.html'), SITE);
  assert.equal(found.title, 'Example Quest Remastered');
  assert.equal(found.titleId, 'PPSA01234');
  assert.equal(found.platform, 'ps5');
  assert.equal(found.cover, 'https://cdn.example.org/uploads/2026/10/example-quest-cover.jpg');
  assert.ok(!found.images.some((url) => /logo/.test(url)), 'a logo is not art');
  assert.deepEqual(found.batches.map((batch) => batch.label), ['v1.00 Base', 'v1.05 + Update']);
  assert.deepEqual(found.batches.map((batch) => batch.sizeGb), [41.2, 48.3]);
  assert.deepEqual(found.batches[0].hosts.map((host) => `${host.host}:${host.links.map((link) => link.part)}`), ['1fichier:1,2,3', 'mediafire:1,2,3']);
  assert.deepEqual(found.batches[1].hosts.map((host) => `${host.host}:${host.links.map((link) => link.part)}`), ['1fichier:1,2,3,4', 'gofile:1,2,3,4']);
  assert.ok(found.batches.every((batch) => !batch.warnings.length));
});

test('import: only rar volumes are batches; other host links are offered apart and nothing else is taken', () => {
  const found = parsePage(page('two-batches.html'), SITE);
  const urls = found.batches.flatMap((batch) => batch.hosts.flatMap((host) => host.links.map((link) => link.url)));
  assert.equal(urls.length, 14);
  assert.ok(urls.every((url) => /1fichier|mediafire|gofile/.test(url)));
  assert.ok(!urls.some((url) => /scriptonly|facebook|twitter|discord/.test(url)), 'script text, social links and the site\'s own links are never links');
  assert.deepEqual(found.other.map((link) => link.host), ['mega']);
});

test('import: a page with no version still splits where the part numbers start over, and names the batch from the text above it', () => {
  const found = parsePage(page('unlabeled.html'), 'https://examplesite.test/m');
  assert.equal(found.titleId, 'CUSA12345');
  assert.equal(found.platform, 'ps4');
  assert.equal(found.batches.length, 2);
  assert.deepEqual(found.batches.map((batch) => batch.links), [3, 2]);
  assert.equal(found.batches[1].label, 'Second batch');
});

test('import: a pasted list of addresses is read as the files wanted, with no page around it', () => {
  const found = parsePage(page('bare-links.txt'), '', { assumeRar: true });
  assert.equal(found.batches.length, 1);
  assert.deepEqual(found.batches[0].hosts[0].links.map((link) => link.part), [1, 2]);
  const without = parsePage(page('bare-links.txt'), '');
  assert.equal(without.batches.length, 1, 'file names in the list still say they are rar parts');
});

test('import: a part that is missing is reported', () => {
  const html = '<h3>v1.00</h3><a href="https://1fichier.com/?a">Game.v1.00.part1.rar</a><a href="https://1fichier.com/?c">Game.v1.00.part3.rar</a>';
  const found = parsePage(html, 'https://site.test/p');
  assert.deepEqual(found.batches[0].hosts[0].missing, [2]);
  assert.match(found.batches[0].warnings[0], /missing part 2/);
});

test('import: links behind a redirector give the file host they point to', () => {
  const target = encodeURIComponent('https://1fichier.com/?real1');
  const html = `<h3>v2.00</h3><a href="https://redir.test/go?url=${target}">Game.part1.rar</a>`;
  const found = parsePage(html, 'https://site.test/p');
  assert.equal(found.batches[0].hosts[0].links[0].url, 'https://1fichier.com/?real1');
});

test('import: titles lose the site, the platform and the word download; Title IDs are found in any spelling', () => {
  assert.equal(cleanTitle('Hades II PS5 PKG Free Download [PPSA12345] | Some Site'), 'Hades II');
  assert.equal(cleanTitle('Spider-Man 2 - Marvel (PS5) - Backport 7.xx'), 'Spider-Man 2 - Marvel');
  assert.equal(cleanTitle('A'), 'A');
  assert.deepEqual(findTitleIds('ppsa 01234 and CUSA-55555, PPSA01234 again'), ['PPSA01234', 'CUSA55555']);
  assert.equal(versionOf('Game v1.05 (12.50 GB)'), 'v1.05');
  assert.equal(versionOf('Game 1.002 update'), 'v1.002');
  assert.equal(versionOf('Backport 7.xx / 9.xx'), 'backport 7.xx/9.xx');
  assert.equal(versionOf('Size 12.50 GB'), '');
});

test('import: the console only reads pages out on the web', () => {
  assert.equal(checkPageURL(' https://a.test/x '), 'https://a.test/x');
  for (const bad of ['', 'ftp://a.test/x', 'http://localhost:9021/', 'http://127.0.0.1/', 'http://printer.local/', 'not a url']) assert.throws(() => checkPageURL(bad), bad);
});

const draftOf = (found, keep = (batch) => true) => ({
  id: found.titleId,
  title: found.title,
  cover: found.cover,
  sourceUrl: found.sourceUrl,
  batches: found.batches.filter(keep).map((batch) => ({ key: batch.key, label: batch.label, hosts: batch.hosts }))
});

test('import: what is kept becomes a feed game whose volumes the app joins into sets, one per batch and host', () => {
  const found = parsePage(page('two-batches.html'), SITE);
  const game = buildGame(draftOf(found));
  assert.equal(game.id, 'PPSA01234');
  assert.equal(game.art.cover, found.cover);
  assert.equal(game.releases.length, 14);
  const feed = parseFeed({ version: 1, name: 'x', games: [game] }, 'irdl:imported');
  assert.equal(feed.games.length, 1);
  const { releases } = feed.games[0];
  const sets = releaseSets(releases).filter((release) => release.parts);
  assert.deepEqual(sets.map((set) => `${set.label.replace(/ · \d+ parts?$/, '')}/${set.provider}/${set.parts.length}`).sort(), [
    'v1.00 Base/1fichier/3', 'v1.00 Base/mediafire/3', 'v1.05 + Update/1fichier/4', 'v1.05 + Update/gofile/4'
  ]);
  assert.ok(sets.every((set) => !set.unavailableReason), 'complete sets');
  const byHost = Object.fromEntries(releases.map((release) => [release.provider, release.requiresBrowser]));
  assert.deepEqual(byHost, { '1fichier': true, mediafire: false, gofile: true });
});

test('import: leaving a batch out leaves it out of the game', () => {
  const found = parsePage(page('two-batches.html'), SITE);
  const game = buildGame(draftOf(found, (batch) => batch.version === 'v1.05'));
  assert.equal(game.releases.length, 8);
  assert.ok(game.releases.every((release) => release.label.startsWith('v1.05')));
});

test('import: a draft that cannot make a game says why in a sentence', () => {
  const found = parsePage(page('two-batches.html'), SITE);
  assert.throws(() => buildGame({ ...draftOf(found), id: 'ABC' }), /Title ID/);
  assert.throws(() => buildGame({ ...draftOf(found), title: '  ' }), /title/i);
  assert.throws(() => buildGame({ ...draftOf(found), batches: [] }), /at least one/);
  assert.throws(() => buildGame({ ...draftOf(found), batches: [{ label: 'x', hosts: [{ host: 'a', links: [{ url: 'javascript:alert(1)' }] }] }] }), /at least one/);
  const odd = buildGame({ ...draftOf(found), id: ' ppsa 01234 ', cover: 'javascript:alert(1)' });
  assert.equal(odd.id, 'PPSA01234');
  assert.equal(odd.art.cover, undefined, 'only an http(s) cover is kept');
  assert.match(odd.art.tint, /^#[0-9a-f]{6}$/, 'no picture: a colour tile');
});

test('import: a single file with no part number stays one release', () => {
  const game = buildGame({ id: 'CUSA00001', title: 'One', batches: [{ label: 'Full', hosts: [{ host: 'mediafire', links: [{ url: 'https://www.mediafire.com/file/q/One.rar/file' }] }] }] });
  assert.equal(game.releases.length, 1);
  assert.equal(game.releases[0].label, 'Full');
  assert.equal(needsBrowser('https://www.mediafire.com/file/q/One.rar/file'), false);
  assert.equal(needsBrowser('https://1fichier.com/?x'), true);
  assert.equal(needsBrowser('https://files.example.org/One.part1.rar'), false);
});

function memoryStore() {
  const files = new Map();
  return createImportedStore({ load: (name) => files.has(name) ? JSON.parse(files.get(name)) : {}, persist: (name, what, value) => files.set(name, JSON.stringify(value)) });
}

test('imported games: saved, replaced by the same Title ID, listed newest first, removed, and read back as catalog games', () => {
  const store = memoryStore();
  const found = parsePage(page('two-batches.html'), SITE);
  const first = store.save(draftOf(found));
  assert.equal(first.replaced, false);
  assert.equal(first.restart, true);
  assert.equal(store.needsRestart(), true);
  assert.equal(first.entry.title, 'Example Quest Remastered');
  assert.deepEqual(first.entry.batches, ['v1.00 Base', 'v1.05 + Update']);
  assert.deepEqual(first.entry.hosts.sort(), ['1fichier', 'gofile', 'mediafire']);
  store.save({ id: 'CUSA00002', title: 'Other', batches: [{ label: 'Full', hosts: [{ host: 'mediafire', links: [{ url: 'https://www.mediafire.com/file/q/O.rar/file' }] }] }] });
  assert.deepEqual(store.entries().map((entry) => entry.id), ['CUSA00002', 'PPSA01234']);
  const again = store.save(draftOf(found, (batch) => batch.version === 'v1.05'));
  assert.equal(again.replaced, true);
  assert.equal(store.entries().find((entry) => entry.id === 'PPSA01234').links, 14, 'the same batch replaced itself; the other stays as a source');
  const merged = store.loadImportedGames().find(({ game }) => game.id === 'PPSA01234');
  assert.ok(merged.releases[0].label.startsWith('v1.05'), 'the newest import comes first');
  assert.ok(merged.releases.every((release) => release.site), 'every source names the site it came from');
  const games = store.loadImportedGames();
  assert.deepEqual(games.map(({ game }) => game.id).sort(), ['CUSA00002', 'PPSA01234']);
  assert.deepEqual(store.importedIndex().map(([id]) => id).sort(), ['CUSA00002', 'PPSA01234']);
  assert.equal(store.remove('CUSA00002'), true);
  assert.equal(store.remove('CUSA00002'), false);
  assert.deepEqual(store.entries().map((entry) => entry.id), ['PPSA01234']);
});

const fakeHttp = (answers) => ({
  calls: [],
  async request(url, options) {
    this.calls.push([url, options]);
    const answer = answers[url];
    if (!answer) throw new Error('connection refused');
    return { ok: answer.status === 200, status: answer.status, text: async () => answer.body };
  }
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

test('importer: a page address starts a job that ends ready with the parsed page, read once with a size cap', async () => {
  const http = fakeHttp({ [SITE]: { status: 200, body: page('two-batches.html') } });
  const importer = createImporter({ http, store: memoryStore() });
  const id = importer.start({ url: SITE });
  assert.equal(importer.job(id).state, 'fetching');
  await settle();
  const job = importer.job(id);
  assert.equal(job.state, 'ready');
  assert.equal(job.preview.titleId, 'PPSA01234');
  assert.equal(http.calls.length, 1);
  assert.ok(http.calls[0][1].maxBytes > 100 * 1024 && http.calls[0][1].maxBytes <= 2 * 1024 * 1024);
});

test('importer: a refused page, a missing page, an unreachable site and a bad address each say what happened', async () => {
  const http = fakeHttp({ 'https://a.test/403': { status: 403, body: '' }, 'https://a.test/404': { status: 404, body: '' } });
  const importer = createImporter({ http, store: memoryStore() });
  const ids = ['https://a.test/403', 'https://a.test/404', 'https://down.test/x'].map((url) => importer.start({ url }));
  await settle();
  const [refused, missing, down] = ids.map((id) => importer.job(id));
  assert.equal(refused.state, 'failed');
  assert.match(refused.error, /refused the console.*paste them into the same box/s);
  assert.match(missing.error, /not found/);
  assert.match(down.error, /connection refused/);
  const bad = importer.job(importer.start({ url: 'http://localhost:9021/' }));
  assert.equal(bad.state, 'failed');
  assert.match(bad.error, /console itself/);
  assert.equal(importer.job('nope'), null);
});

test('importer: pasted links work without any fetch, and pasted page source is read as a page', async () => {
  const http = fakeHttp({});
  const importer = createImporter({ http, store: memoryStore() });
  const list = importer.job(importer.start({ text: page('bare-links.txt').split('\n').filter((line) => !/some-article/.test(line)).join('\n') }));
  assert.equal(list.state, 'ready');
  assert.equal(list.preview.batches[0].links, 2);
  const source = importer.job(importer.start({ text: page('two-batches.html'), url: SITE }));
  assert.equal(source.preview.batches.length, 2);
  assert.equal(http.calls.length, 0);
});

function request(method, route, body) {
  const [pathname, query = ''] = route.split('?');
  return { method, path: pathname, query, body: body ? JSON.stringify(body) : '' };
}

test('api: fetch, poll, save, list and remove over the companion routes', async () => {
  const http = fakeHttp({ [SITE]: { status: 200, body: page('two-batches.html') } });
  const importer = createImporter({ http, store: memoryStore() });
  const handle = createCompanionApi({ catalog: {}, describe: () => ({}), download: () => ({}), queue: () => [], control: {}, storage: () => [], feeds: { list: () => [] }, remote: () => {}, quick: () => {}, info: () => ({}), importer });
  const answer = (res) => ({ status: res.status, body: JSON.parse(res.body) });
  assert.equal(answer(handle(request('POST', '/api/import/fetch', {}))).status, 400);
  const started = answer(handle(request('POST', '/api/import/fetch', { url: SITE })));
  assert.equal(started.status, 200);
  await settle();
  const polled = answer(handle(request('GET', `/api/import/job?id=${started.body.job}`)));
  assert.equal(polled.body.state, 'ready');
  assert.equal(answer(handle(request('GET', '/api/import/job?id=zzz'))).status, 404);
  const found = polled.body.preview;
  const refused = answer(handle(request('POST', '/api/import/save', { ...draftOf(found), id: '' })));
  assert.equal(refused.status, 409);
  assert.match(refused.body.error, /Title ID/);
  const saved = answer(handle(request('POST', '/api/import/save', draftOf(found, (batch) => batch.version === 'v1.00'))));
  assert.equal(saved.status, 200);
  assert.equal(saved.body.saved, true);
  assert.equal(saved.body.restart, true);
  const listed = answer(handle(request('GET', '/api/import/library')));
  assert.deepEqual(listed.body.games.map((game) => [game.id, game.links]), [['PPSA01234', 6]]);
  assert.equal(listed.body.restart, true);
  assert.equal(answer(handle(request('DELETE', '/api/import/library?id=NOPE'))).status, 404);
  assert.deepEqual(answer(handle(request('DELETE', '/api/import/library?id=PPSA01234'))).body.games, []);
});

test('api: without an importer the import routes do not exist', () => {
  const handle = createCompanionApi({ catalog: {}, describe: () => ({}), download: () => ({}), queue: () => [], control: {}, storage: () => [], feeds: { list: () => [] }, remote: () => {}, quick: () => {}, info: () => ({}) });
  assert.equal(handle(request('POST', '/api/import/fetch', { url: SITE })).status, 404);
});

// ---- one box: addresses, links, or both ---------------------------------------------------------------
const { planInput, titleFromFiles } = await load('app/state/page-import.js');
const wait = async (importer, id) => {
  for (let i = 0; i < 50; i++) {
    const job = importer.job(id);
    if (job.state !== 'fetching') return job;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('job never finished');
};

test('input: pasted links in any order are sorted into parts, and one set stays one batch', () => {
  const found = parsePage([
    'https://1fichier.com/?c Some.Game.part3.rar',
    'https://1fichier.com/?a Some.Game.part1.rar',
    'https://1fichier.com/?b Some.Game.part2.rar'
  ].join('\n'), '', { assumeRar: true });
  assert.equal(found.batches.length, 1);
  assert.deepEqual(found.batches[0].hosts[0].links.map((link) => link.part), [1, 2, 3]);
  assert.deepEqual(found.batches[0].hosts[0].links.map((link) => link.url.slice(-1)), ['a', 'b', 'c']);
  assert.deepEqual(found.batches[0].warnings, []);
});

test('input: a part number that repeats starts a second set; versions in names split batches', () => {
  const found = parsePage([
    'https://pixeldrain.com/u/1 Game.v1.00.part1.rar', 'https://pixeldrain.com/u/2 Game.v1.00.part2.rar',
    'https://pixeldrain.com/u/4 Game.v1.05.part2.rar', 'https://pixeldrain.com/u/3 Game.v1.05.part1.rar'
  ].join('\n'), '', { assumeRar: true });
  assert.deepEqual(found.batches.map((batch) => batch.links), [2, 2]);
  assert.deepEqual(found.batches[1].hosts[0].links.map((link) => link.part), [1, 2]);
});

test('input: planInput tells a post address from download links and keeps the link lines', () => {
  assert.deepEqual(planInput('https://examplesite.test/post').pages, ['https://examplesite.test/post']);
  const mixed = planInput('see https://examplesite.test/post\nhttps://1fichier.com/?a Game.part1.rar\nhttps://1fichier.com/?b Game.part2.rar');
  assert.deepEqual(mixed.pages, ['https://examplesite.test/post']);
  assert.equal(mixed.links, 2);
  assert.equal(mixed.linkText.split('\n').length, 2);
  assert.equal(planInput('https://1fichier.com/?a\nhttps://mediafire.com/file/x/a.rar').pages.length, 0);
  assert.equal(planInput('<html><a href="https://x.test/a.rar">a</a></html>').html, true);
  assert.equal(planInput('   ').links, 0);
});

test('input: titleFromFiles names a game from its file names', () => {
  const found = parsePage('https://1fichier.com/?a Some.Great.Game.v1.05.part1.rar\nhttps://1fichier.com/?b Some.Great.Game.v1.05.part2.rar', '', { assumeRar: true });
  assert.equal(titleFromFiles(found), 'Some Great Game');
});

test('input: only links, no page, makes a ready preview with a title taken from the files', async () => {
  const importer = createImporter({ http: { request: () => { throw new Error('no network expected'); } }, store: memoryStore() });
  const job = await wait(importer, importer.start({ input: 'https://1fichier.com/?b Some.Game.part2.rar\nhttps://1fichier.com/?a Some.Game.part1.rar' }));
  assert.equal(job.state, 'ready');
  assert.equal(job.preview.title, 'Some Game');
  assert.deepEqual(job.preview.batches[0].hosts[0].links.map((link) => link.part), [1, 2]);
});

test('input: an address plus links reads the page and puts the pasted links first', async () => {
  const html = page('two-batches.html');
  const importer = createImporter({ http: { request: async () => ({ ok: true, status: 200, text: async () => html }) }, store: memoryStore() });
  const job = await wait(importer, importer.start({ input: `${SITE}\nhttps://1fichier.com/?z My.Own.Batch.part1.rar\nhttps://1fichier.com/?y My.Own.Batch.part2.rar` }));
  assert.equal(job.state, 'ready');
  assert.equal(job.preview.titleId, 'PPSA01234');
  assert.match(job.preview.batches[0].label, /^Pasted/);
  assert.equal(job.preview.batches[0].links, 2);
  assert.ok(job.preview.batches.length >= 3);
});

test('input: a site that refuses the console still gives the pasted links, with a notice', async () => {
  const importer = createImporter({ http: { request: async () => ({ ok: false, status: 403, text: async () => '' }) }, store: memoryStore() });
  const job = await wait(importer, importer.start({ input: `${SITE}\nhttps://1fichier.com/?a Some.Game.part1.rar\nhttps://1fichier.com/?b Some.Game.part2.rar` }));
  assert.equal(job.state, 'ready');
  assert.match(job.preview.notice, /pasted links/);
  assert.equal(job.preview.batches[0].links, 2);
});

test('input: a refused address alone fails with a plain sentence, and empty input is refused', async () => {
  const importer = createImporter({ http: { request: async () => ({ ok: false, status: 403, text: async () => '' }) }, store: memoryStore() });
  const refused = await wait(importer, importer.start({ input: SITE }));
  assert.equal(refused.state, 'failed');
  assert.match(refused.error, /refused/);
  const none = await wait(importer, importer.start({ input: 'hello there' }));
  assert.equal(none.state, 'failed');
});

test('import: a Title ID missing from the page is read from the links', () => {
  assert.equal(titleIdFromLinks({ batches: [{ hosts: [{ links: [{ url: 'https://host.example/f/Some_Game_PPSA04321_v1.02.part1.rar', filename: '' }] }] }], other: [] }), 'PPSA04321');
  assert.equal(titleIdFromLinks({ batches: [], other: [] }, 'https://site.example/post/cusa00099-some-game/'), 'CUSA00099');
  assert.equal(titleIdFromLinks({ batches: [], other: [] }), '');
});
