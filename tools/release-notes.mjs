// Prints the release notes for a version: its section of CHANGELOG.md and the SHA-256 of the release's files.
// Used by the build workflow (the draft's notes) and the "release notes" workflow (every release).
//   node tools/release-notes.mjs 1.2.0          notes for v1.2.0 (needs GH_TOKEN and GITHUB_REPOSITORY for the checksums)
//   node tools/release-notes.mjs 1.2.0 --no-sums   the changelog section only
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const version = String(process.argv[2] || '').replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('usage: release-notes.mjs <version> [--no-sums]');
  process.exit(2);
}
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const section = new RegExp(`^## ${version.replace(/\./g, '\\.')}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(changelog);
if (!section) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
let out = `## IRDL ${version}\n\n${section[1].trim()}\n`;
if (!process.argv.includes('--no-sums')) {
  try {
    const releases = JSON.parse(execFileSync('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/releases`, '--paginate'], { encoding: 'utf8' }).replace(/\]\s*\[/g, ','));
    const release = releases.find((item) => item.tag_name === `v${version}`);
    const rows = (release?.assets ?? []).filter((asset) => /^sha256:[0-9a-f]{64}$/.test(asset.digest || '')).map((asset) => `| \`${asset.name}\` | \`${asset.digest.slice(7)}\` |`);
    if (rows.length) out += `\n### Checksums (SHA-256)\n\n| File | SHA-256 |\n| --- | --- |\n${rows.join('\n')}\n`;
  } catch (error) {
    console.error(`no checksums: ${error.message}`);
  }
}
process.stdout.write(out);
