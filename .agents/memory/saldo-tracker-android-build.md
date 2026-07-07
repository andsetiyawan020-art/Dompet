---
name: Saldo Tracker Android Build Config
description: Critical rules for building the saldo-tracker artifact as an offline Android APK bundle.
---

## Rule
Always use `npm run build:apk` (or `BASE_PATH=./ vite build`) for Android builds — never plain `npm run build`.

**Why:** The `build:apk` script sets `BASE_PATH=./` (relative paths) AND triggers the `stripModuleType` Vite plugin which removes `type="module"` and `crossorigin` from the built HTML. Relative paths are required for WebView file:// loading. Classic script (no `type="module"`) is required for Android WebView API < 61.

**How to apply:** Any Android Studio README or CI step must reference `pnpm --filter @workspace/saldo-tracker run build:apk`. Output goes to `artifacts/saldo-tracker/dist/public/` — copy that folder to `app/src/main/assets/www/` in Android Studio.

## Build output characteristics (IIFE format)
- Single JS file (`assets/index-[hash].js`) — CSS is embedded in the JS bundle, no separate .css file
- Classic `<script src="./assets/...">` — no `type="module"`, no `crossorigin`
- Target: Chrome 60 (supports async/await, for-of, destructuring, template literals)
- No dynamic chunk loading at runtime — everything in one IIFE bundle
- Zero CDN/external URLs in output

## Why IIFE instead of ES module
Vite's default module format produces `<script type="module">` which is silently ignored by Android WebView before Chrome 61 (API < 26 without Play Store WebView updates). IIFE format + `stripModuleType` plugin removes this dependency so the bundle loads as a classic script.

## WebView requirements (MainActivity)
- `setJavaScriptEnabled(true)`
- `setDomStorageEnabled(true)` — required for localStorage
- `setAllowFileAccess(true)` — required for file:// assets
- `setDownloadListener(...)` — required for Export JSON button (blob: URL downloads)

## Export/Import flow
- Export: `showSaveFilePicker` (modern Android WebView) → fallback `<a download>` with blob URL (requires download listener in MainActivity)
- Import: `<input type="file">` — works natively in WebView with `setAllowFileAccess(true)`
- All dynamic `import('../storage')` calls in riwayat.ts have been converted to static imports — no runtime lazy loading

## No external dependencies
Zero CDN, zero remote fonts, zero fetch/XHR in app code. System font stack only. All logic is self-contained in the built JS bundle (CSS embedded inside).
