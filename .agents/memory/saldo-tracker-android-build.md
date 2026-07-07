---
name: Saldo Tracker Android Build Config
description: Critical rules for building the saldo-tracker artifact as an offline Android APK bundle.
---

## Rule
Always use `npm run build:apk` (or `BASE_PATH=./ vite build`) for Android builds — never plain `npm run build`.

**Why:** `vite.config.ts` defaults `BASE_PATH` to `'./'` (relative). Plain `build` without the env var is safe now, but the dedicated `build:apk` script is explicit and should be the documented entry point. Previously the default was `'/'` which broke WebView file:// loading.

**How to apply:** Any Android Studio README or CI step must reference `pnpm --filter @workspace/saldo-tracker run build:apk`. Output goes to `artifacts/saldo-tracker/dist/public/` — copy that folder to `app/src/main/assets/www/` in Android Studio.

## WebView requirements (MainActivity)
- `setJavaScriptEnabled(true)`
- `setDomStorageEnabled(true)` — required for localStorage
- `setAllowFileAccess(true)` — required for file:// assets
- `setDownloadListener(...)` — required for Export JSON button (blob: URL downloads)

## Export/Import flow
- Export: `showSaveFilePicker` (modern Android WebView) → fallback `<a download>` with blob URL (requires download listener in MainActivity)
- Import: `<input type="file">` — works natively in WebView with `setAllowFileAccess(true)`

## No external dependencies
Zero CDN, zero remote fonts, zero fetch/XHR in app code. System font stack only. All logic is self-contained in the built JS/CSS bundle.
