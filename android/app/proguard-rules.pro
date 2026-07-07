# ProGuard rules untuk Saldo Tracker
# Keep JavaScript Interface (jika ditambahkan di masa mendatang)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
