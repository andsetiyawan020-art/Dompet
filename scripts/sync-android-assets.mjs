/**
 * sync-android-assets.mjs
 *
 * Copies artifacts/saldo-tracker/dist/public/ → android/app/src/main/assets/www/
 *
 * Cross-platform (Windows, macOS, Linux) — pure Node.js fs, no shell commands.
 *
 * Usage:
 *   node scripts/sync-android-assets.mjs
 *
 * Or via root package.json scripts:
 *   pnpm run sync:android     — copy only (dist must already exist)
 *   pnpm run build:android    — build web bundle then copy
 */

import { cpSync, rmSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
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

if (!existsSync(join(SRC, 'index.html'))) {
  console.error('\n❌  dist/public/index.html missing — build may have failed.\n');
  process.exit(1);
}

// ── Wipe destination and copy fresh ─────────────────────────────────────────
console.log(`\n📦  Syncing web bundle → Android assets`);
console.log(`    FROM: ${SRC}`);
console.log(`    TO:   ${DEST}\n`);

try {
  rmSync(DEST, { recursive: true, force: true });
  mkdirSync(DEST, { recursive: true });
  cpSync(SRC, DEST, { recursive: true });
} catch (err) {
  console.error(`\n❌  Sync failed: ${err.message}\n`);
  process.exit(1);
}

// ── Summary ──────────────────────────────────────────────────────────────────
function countFiles(dir) {
  let count = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) count += countFiles(join(dir, entry.name));
      else count++;
    }
  } catch {
    // ignore unreadable subdirs in count
  }
  return count;
}

const total = countFiles(DEST);

// List JS bundle files without assuming an 'assets/' subfolder exists
const assetsDir = join(DEST, 'assets');
const bundleList = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter(f => f.endsWith('.js') || f.endsWith('.css')).join(', ')
  : '(no assets/ subfolder)';

console.log(`✅  Done — ${total} files copied to android/app/src/main/assets/www/`);
if (bundleList) console.log(`    Bundle: ${bundleList}\n`);
