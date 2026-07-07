package com.andsetiyawan.saldotracker

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.FileChooserParams
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    // Callback untuk file chooser (tombol Import JSON)
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    /**
     * Launcher modern (API 19+) untuk membuka file JSON.
     * Hasil dipasok kembali ke WebView melalui fileChooserCallback.
     */
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        val result = if (uri != null) arrayOf(uri) else null
        fileChooserCallback?.onReceiveValue(result)
        fileChooserCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        setupWebView()

        // Muat aplikasi dari asset bundle offline
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    private fun setupWebView() {
        val settings: WebSettings = webView.settings

        // Wajib untuk JavaScript dan localStorage
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        // Wajib untuk memuat file dari file:///android_asset/
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        // Performa & cache
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_NO_CACHE

        // Tidak ada mixed content — app 100% offline
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        // Client dasar — tidak override navigasi (SPA menangani routing sendiri)
        webView.webViewClient = WebViewClient()

        // Chrome client untuk file chooser (Import JSON)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                // Batalkan callback sebelumnya jika ada
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback
                filePickerLauncher.launch("application/json")
                return true
            }
        }

        // Download listener — diperlukan untuk tombol Export JSON
        // WebView menghasilkan blob URL → diteruskan ke DownloadManager
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
                    this@MainActivity,
                    "Menyimpan ke folder Downloads...",
                    Toast.LENGTH_SHORT
                ).show()
            } catch (e: Exception) {
                Toast.makeText(
                    this@MainActivity,
                    "Gagal menyimpan: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    /** Tombol Back menavigasi mundur di WebView, baru keluar jika sudah di root. */
    @Suppress("OVERRIDE_DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
