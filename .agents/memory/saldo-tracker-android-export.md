---
name: Saldo Tracker Android export bridge
description: Why the Export JSON button silently did nothing in the Android WebView build, and the actual committed fix.
---

Android WebView does not reliably trigger `setDownloadListener`/`onDownloadStart` for a programmatic `<a download> ... .click()` on a `blob:` URL — blob resolution happens inside the DOM without a real network navigation, so the download listener never fires. This looked like nothing happened (no dialog, no toast, no error) with no exception thrown anywhere.

**Committed fix (origin/main, commit `c7afe8c`):** a `@JavascriptInterface` bridge (`window.AndroidExport`) registered via `webView.addJavascriptInterface(...)` before `webView.loadUrl(...)` in `MainActivity.kt`. `exportJson(json, filename)` launches `ActivityResultContracts.CreateDocument(...)` (SAF "Save to..." dialog), writes the file via `contentResolver.openOutputStream(uri)`, then reports the result back to JS via `webView.evaluateJavascript(...)` calling `window.__onAndroidExportResult(success, message, cancelled)` (escaped with `JSONObject.quote`). The frontend wraps this protocol in `artifacts/saldo-tracker/src/androidExport.ts` (`isAndroidExportAvailable()`, `exportJsonViaAndroid()` returning a Promise), consumed by `handleExport()` in `riwayat.ts`. Both sides guard against a second tap clobbering an in-flight export.

**Why:** SAF's `ACTION_CREATE_DOCUMENT` is the only reliable native "Save to" flow from a WebView; relying on WebView's download interception for blob URLs is a known dead end. The async JS callback (vs. fire-and-forget) lets the web UI show accurate success/failure/cancelled toasts.

**How to apply:** any future "export/download does nothing in the Android WebView app" bug in this project — check `androidExport.ts` / `MainActivity.kt` first; this is the established bridge pattern, don't reintroduce blob/`<a download>` for Android.

**Git note:** this repo has both a `gitsafe-backup` remote and `origin` (GitHub). They can diverge — always `git fetch origin` and diff before assuming local HEAD matches what's on GitHub.
