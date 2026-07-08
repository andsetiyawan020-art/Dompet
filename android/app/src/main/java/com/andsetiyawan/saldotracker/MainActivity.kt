package com.andsetiyawan.saldotracker

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    // Holds the JSON content awaiting write once the user picks a destination
    // via the Storage Access Framework "Create Document" dialog.
    private var pendingExportJson: String? = null

    // True while a SAF "Save to..." picker is open, so a second export tap
    // can't clobber the pending payload/callback of the first one.
    private var exportInFlight = false

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        val result = if (uri != null) arrayOf(uri) else null
        fileChooserCallback?.onReceiveValue(result)
        fileChooserCallback = null
    }

    // Launches the system "Save to..." picker (SAF Create Document) so the user
    // can choose any location (Internal Storage, SD Card, Drive, etc). Does NOT
    // touch the Downloads folder or use a Share Intent.
    private val createExportDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri: Uri? ->
        val json = pendingExportJson
        pendingExportJson = null
        exportInFlight = false

        if (uri == null) {
            notifyExportResult(success = false, message = "Dibatalkan", cancelled = true)
            return@registerForActivityResult
        }

        // Guard against a cleared/overwritten pending payload (e.g. a second
        // export was requested and clobbered state before this one resolved).
        // Never treat a missing payload as a successful write of nothing.
        if (json == null) {
            notifyExportResult(success = false, message = "Ekspor dibatalkan karena ada permintaan baru.")
            return@registerForActivityResult
        }

        try {
            val stream = contentResolver.openOutputStream(uri)
                ?: throw IllegalStateException("Tidak bisa membuka lokasi tujuan")
            stream.use { out ->
                out.write(json.toByteArray(Charsets.UTF_8))
            }
            notifyExportResult(success = true, message = "Backup berhasil disimpan.")
        } catch (e: Exception) {
            notifyExportResult(success = false, message = "Gagal menyimpan: ${e.message}")
        }
    }

    private fun notifyExportResult(success: Boolean, message: String, cancelled: Boolean = false) {
        runOnUiThread {
            // Build the JS call via JSONObject.quote() so any quotes/newlines in
            // the message can't break out of the evaluateJavascript string.
            val js = "window.__onAndroidExportResult && window.__onAndroidExportResult(" +
                success.toString() + ", " + JSONObject.quote(message) + ", " + cancelled.toString() + ")"
            webView.evaluateJavascript(js, null)
        }
    }

    /**
     * JS bridge exposed as `window.AndroidExport`. The web app calls
     * `exportJson(json, filename)` to open the native "Save to..." dialog
     * (Storage Access Framework) instead of auto-downloading to /Downloads.
     */
    inner class ExportBridge {
        @JavascriptInterface
        fun exportJson(json: String, filename: String) {
            runOnUiThread {
                // Ignore taps while a picker is already open instead of
                // clobbering the in-flight payload/callback.
                if (exportInFlight) {
                    notifyExportResult(success = false, message = "Ekspor sebelumnya masih berjalan.")
                    return@runOnUiThread
                }
                exportInFlight = true
                pendingExportJson = json
                try {
                    createExportDocumentLauncher.launch(filename)
                } catch (e: Exception) {
                    exportInFlight = false
                    pendingExportJson = null
                    notifyExportResult(success = false, message = "Gagal membuka dialog simpan: ${e.message}")
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        setupWebView()
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    private fun setupWebView() {
        val settings = webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_NO_CACHE
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        webView.addJavascriptInterface(ExportBridge(), "AndroidExport")

        webView.webViewClient = WebViewClient()

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)

                if (filePathCallback == null) {
                    return false
                }

                fileChooserCallback = filePathCallback
                filePickerLauncher.launch("application/json")
                return true
            }
        }

        webView.setDownloadListener { url, _, _, mimeType, _ ->
            try {
                val request = DownloadManager.Request(Uri.parse(url))
                request.setMimeType(mimeType)
                request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )
                request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    "SaldoTracker-backup.json"
                )

                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)

                Toast.makeText(
                    this,
                    "Menyimpan ke folder Downloads...",
                    Toast.LENGTH_SHORT
                ).show()

            } catch (e: Exception) {
                Toast.makeText(
                    this,
                    "Gagal menyimpan: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}