// Prints the release notes for a version: its section of CHANGELOG.md and a Downloads list of the release's files.
// Used by the build workflow (the draft's notes) and the "release notes" workflow (every release).
//   node tools/release-notes.mjs 1.2.0          notes for v1.2.0, with the console app's download link
//   node tools/release-notes.mjs 1.2.0 --apk    ... and the Android companion's link under it
import { readFileSync } from 'node:fs';

const version = String(process.argv[2] || '').replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('usage: release-notes.mjs <version> [--apk]');
  process.exit(2);
}
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const section = new RegExp(`^## ${version.replace(/\./g, '\\.')}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(changelog);
if (!section) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
const repo = process.env.GITHUB_REPOSITORY || 'zilyzal/IRDL';
const link = (file) => `https://github.com/${repo}/releases/download/v${version}/${file}`;
let out = `## IRDL ${version}\n\n${section[1].trim()}\n\n### Downloads\n\n- [IRDL.exfat](${link('IRDL.exfat')}): the console app\n`;
if (process.argv.includes('--apk')) out += `- [IRDL-Companion.apk](${link('IRDL-Companion.apk')}): the Android companion app\n`;
process.stdout.write(out);
