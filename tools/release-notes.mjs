// Prints the release notes for a version: its section of CHANGELOG.md.
// Used by the build workflow (the draft's notes) and the "release notes" workflow (every release).
//   node tools/release-notes.mjs 1.2.0
import { readFileSync } from 'node:fs';

const version = String(process.argv[2] || '').replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('usage: release-notes.mjs <version>');
  process.exit(2);
}
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const section = new RegExp(`^## ${version.replace(/\./g, '\\.')}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(changelog);
if (!section) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
process.stdout.write(`## IRDL ${version}\n\n${section[1].trim()}\n`);
