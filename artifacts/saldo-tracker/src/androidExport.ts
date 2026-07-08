// ============================================================
// Android SAF (Storage Access Framework) export bridge.
//
// When running inside the SaldoTracker Android WebView, the native shell
// exposes `window.AndroidExport.exportJson(json, filename)`, which opens
// the system "Save to..." dialog (Intent.ACTION_CREATE_DOCUMENT). This lets
// the user pick any location (Internal Storage, SD Card, Google Drive,
// other apps) — no Share Intent, no auto-save to /Downloads.
//
// The native side calls back into `window.__onAndroidExportResult` once the
// user finishes (or cancels) the picker.
// ============================================================

export interface AndroidExportResult {
  ok: boolean;
  message: string;
  cancelled?: boolean;
}

declare global {
  interface Window {
    AndroidExport?: {
      exportJson: (json: string, filename: string) => void;
    };
    __onAndroidExportResult?: (success: boolean, message: string, cancelled?: boolean) => void;
  }
}

export function isAndroidExportAvailable(): boolean {
  return typeof window.AndroidExport?.exportJson === 'function';
}

// Tracks whether a native SAF export is currently awaiting a result, so a
// second tap can't overwrite `window.__onAndroidExportResult` and orphan
// the first call's promise (the first would then never resolve).
let exportInFlight = false;

/**
 * Delegates the export to the native Android "Save to..." picker and
 * resolves once the native side reports success, failure, or cancellation.
 */
export function exportJsonViaAndroid(json: string, filename: string): Promise<AndroidExportResult> {
  if (exportInFlight) {
    return Promise.resolve({ ok: false, message: 'Ekspor sebelumnya masih berjalan.' });
  }

  exportInFlight = true;

  return new Promise((resolve) => {
    window.__onAndroidExportResult = (success: boolean, message: string, cancelled?: boolean) => {
      delete window.__onAndroidExportResult;
      exportInFlight = false;
      resolve({ ok: success, message, cancelled });
    };

    try {
      window.AndroidExport!.exportJson(json, filename);
    } catch (err) {
      delete window.__onAndroidExportResult;
      exportInFlight = false;
      resolve({
        ok: false,
        message: err instanceof Error ? err.message : 'Gagal membuka dialog simpan.',
      });
    }
  });
}
