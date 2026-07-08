/**
 * sync-android-assets.mjs
 *
 * Copies artifacts/saldo-tracker/dist/public/ → android/app/src/main/assets/www/
 *
 * Cross-platform (Windows, macOS, Linux) — no shell commands, pure Node.js fs.
 *
 * Usage:
 *   node scripts/sync-android-assets.mjs
 *
 * Or via npm scripts in root package.json:
 *   pnpm run sync:android          # copy only (dist must already exist)
 *   pnpm run build:android         # build web bundle then copy
 */

import { cpSync, rmSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

const SRC  = resolve(root, 'artifacts', 'saldo-tracker', 'dist', 'public');
const DEST = resolve(root, 'android', 'app', 'src', 'main', 'assets', 'www');

// ── Validate source ──────────────────────────────────────────────────────────
if (!existsSync(SRC)) {
  console.error('\n❌  dist/public not found.');
  console.error('    Run first:  pnpm --filter @workspace/saldo-tracker run build:apk');
  console.error('    Or:         pnpm run build:android  (builds + syncs in one step)\n');
  process.exit(1);
}

const indexHtml = join(SRC, 'index.html');
if (!existsSync(indexHtml)) {
  console.error('\n❌  dist/public/index.html missing — build may have failed.\n');
  process.exit(1);
}

// ── Wipe destination and copy fresh ─────────────────────────────────────────
console.log(`\n📦  Syncing web bundle → Android assets`);
console.log(`    FROM: ${SRC}`);
console.log(`    TO:   ${DEST}\n`);

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, { recursive: true });

// ── Summary ──────────────────────────────────────────────────────────────────
function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(join(dir, entry.name));
    else count++;
  }
  return count;
}

const total = countFiles(DEST);
console.log(`✅  Done — ${total} files copied to android/app/src/main/assets/www/`);
console.log(`    JS bundle: ${readdirSync(join(DEST, 'assets')).join(', ')}\n`);
