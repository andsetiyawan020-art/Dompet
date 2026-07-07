# Saldo Tracker 💰

Aplikasi pencatatan saldo harian berbasis web. Pengguna cukup input **Saldo Hari Ini** dan **Pengeluaran**, lalu aplikasi menghitung **Pendapatan** secara otomatis.

## Rumus

```
Sisa Saldo     = Saldo Kemarin − Pengeluaran Hari Ini
Pendapatan     = Saldo Hari Ini − Sisa Saldo
```

## Fitur

- Dashboard ringkasan saldo harian
- Form tambah / edit catatan dengan kalkulator nominal
- Riwayat transaksi dengan pencarian & filter
- Statistik grafik bulanan & tahunan
- Export & Import data (JSON)
- Dark Mode
- Semua data tersimpan di `localStorage` (tanpa database)

## Struktur Project

```
artifacts/saldo-tracker/
├── index.html              # HTML shell (entry point)
├── src/
│   ├── main.ts             # Entry point TypeScript
│   ├── style.css           # Semua CSS (tema, layout, komponen)
│   ├── app.ts              # Router SPA & shell navigasi
│   ├── types.ts            # Interface TypeScript
│   ├── utils.ts            # Fungsi utilitas (format, dll)
│   ├── storage.ts          # CRUD localStorage
│   ├── calculator.ts       # Kalkulator modal
│   ├── charts.ts           # Grafik Canvas API
│   └── pages/
│       ├── dashboard.ts    # Halaman Dashboard
│       ├── tambah.ts       # Halaman Tambah / Edit
│       ├── riwayat.ts      # Halaman Riwayat
│       └── statistik.ts    # Halaman Statistik
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Menjalankan di Replit

Klik **Run** — server Vite langsung berjalan.

## Build untuk Android Studio (WebView APK)

### 1. Build static files

```bash
BASE_PATH=/ pnpm --filter @workspace/saldo-tracker run build
```

Output ada di `artifacts/saldo-tracker/dist/public/`.

### 2. Buat project Android Studio

1. Buat **Empty Activity** baru di Android Studio.
2. Tambahkan permission internet di `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```
3. Di `activity_main.xml`, tambahkan:
   ```xml
   <WebView
       android:id="@+id/webView"
       android:layout_width="match_parent"
       android:layout_height="match_parent" />
   ```
4. Copy folder `dist/public/` ke `app/src/main/assets/www/`.

### 3. Setup WebView di `MainActivity.java` / `MainActivity.kt`

**Kotlin:**
```kotlin
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView: WebView = findViewById(R.id.webView)
        webView.webViewClient = WebViewClient()

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true   // Diperlukan untuk localStorage
        settings.allowFileAccess = true

        webView.loadUrl("file:///android_asset/www/index.html")
    }
}
```

**Java:**
```java
WebView webView = findViewById(R.id.webView);
webView.setWebViewClient(new WebViewClient());
WebSettings settings = webView.getSettings();
settings.setJavaScriptEnabled(true);
settings.setDomStorageEnabled(true); // Diperlukan untuk localStorage
settings.setAllowFileAccess(true);
webView.loadUrl("file:///android_asset/www/index.html");
```

### 4. Build APK

Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**

## Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit - Saldo Tracker"
git remote add origin https://github.com/username/saldo-tracker.git
git push -u origin main
```

## Stack Teknologi

| Teknologi | Peran |
|-----------|-------|
| HTML5     | Struktur markup |
| CSS3      | Styling & responsive design |
| TypeScript | Logika aplikasi (vanilla, tanpa framework) |
| Vite      | Build tool & dev server |
| localStorage | Penyimpanan data di browser / WebView |
| Canvas API | Rendering grafik statistik |

## Catatan

- Tidak memerlukan server backend.
- Semua data tersimpan lokal di browser / WebView.
- Untuk APK, pastikan `domStorageEnabled = true` agar `localStorage` berfungsi.
