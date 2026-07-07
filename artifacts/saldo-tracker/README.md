# Saldo Tracker 💰

Aplikasi pencatatan saldo harian — input **Saldo Hari Ini** dan **Pengeluaran**, hitung **Pendapatan** otomatis.  
Seluruh data disimpan lokal di perangkat (localStorage/DOM Storage). Tidak memerlukan server, internet, atau cloud.

---

## Rumus

```
Sisa Saldo  = Saldo Kemarin − Pengeluaran Hari Ini
Pendapatan  = Saldo Hari Ini − Sisa Saldo
```

---

## Fitur

| Fitur | Keterangan |
|---|---|
| Dashboard saldo harian | Ringkasan Saldo Hari Ini, Kemarin, Pendapatan, Pengeluaran |
| Tambah / Edit catatan | Form lengkap dengan kalkulator nominal |
| Format angka otomatis | Ketik `1000000` → tampil `1.000.000` (real-time) |
| Riwayat transaksi | Pencarian & filter kategori / bulan |
| Statistik grafik | Bulanan & tahunan via Canvas API |
| Export JSON | Simpan ke File Manager Android (showSaveFilePicker / fallback `<a download>`) |
| Import JSON | Pilih file dari File Manager Android (`<input type="file">`) |
| Dark Mode | Toggle, tersimpan di localStorage |
| Offline 100% | Tidak ada fetch, XHR, CDN, atau server |

---

## Stack Teknologi

| Teknologi | Versi | Peran |
|---|---|---|
| Node.js | ≥ 18.x (LTS) | Runtime build tool |
| pnpm | ≥ 9.x | Package manager (direkomendasikan) |
| TypeScript | ~5.9.3 | Bahasa utama |
| Vite | ^6.x (dari catalog) | Build tool & dev server |
| localStorage / DOM Storage | — | Penyimpanan data lokal |
| Canvas API | — | Rendering grafik statistik |

> **Catatan:** npm ≥ 9 juga didukung. pnpm lebih cepat karena workspace sudah dikonfigurasi.

---

## Struktur Project

```
artifacts/saldo-tracker/
├── index.html              # HTML shell (entry point)
├── vite.config.ts          # Konfigurasi Vite
├── tsconfig.json           # Konfigurasi TypeScript
├── package.json            # Dependency & scripts
├── public/
│   ├── favicon.svg         # Ikon aplikasi
│   └── robots.txt
└── src/
    ├── main.ts             # Bootstrap aplikasi
    ├── app.ts              # SPA router & shell navigasi
    ├── style.css           # Semua CSS (tema, layout, komponen)
    ├── types.ts            # Interface & konstanta TypeScript
    ├── utils.ts            # Format, ID, toast, escaping
    ├── storage.ts          # CRUD localStorage
    ├── calculator.ts       # Modal kalkulator
    ├── charts.ts           # Grafik Canvas API
    └── pages/
        ├── dashboard.ts    # Halaman Dashboard
        ├── tambah.ts       # Halaman Tambah / Edit
        ├── riwayat.ts      # Halaman Riwayat (+ Export/Import)
        ├── detail.ts       # Detail catatan
        └── statistik.ts    # Halaman Statistik
```

---

## Cara Menjalankan di Replit (Dev)

Klik **Run** — Vite dev server langsung berjalan pada port yang ditetapkan Replit.

---

## Build untuk Android Studio (Offline Bundle)

### Prasyarat

| Software | Versi | Link |
|---|---|---|
| Node.js | ≥ 18.x LTS | https://nodejs.org |
| pnpm | ≥ 9.x | `npm install -g pnpm` |
| Android Studio | Hedgehog 2023.1+ | https://developer.android.com/studio |
| JDK | 17 atau 21 | Bundled dengan Android Studio |

### 1. Clone / Unzip Project

```bash
# Unzip hasil export dari Replit
unzip saldo-tracker.zip -d saldo-tracker
cd saldo-tracker
```

### 2. Install Dependency

```bash
# Dengan pnpm (direkomendasikan — project sudah dikonfigurasi workspace pnpm)
pnpm install

# Atau dengan npm (alternatif)
npm install
```

> Jika memakai npm, abaikan file `pnpm-workspace.yaml` dan `pnpm-lock.yaml`.  
> npm akan membuat `package-lock.json` sendiri.

### 3. Jalankan Dev Server (Opsional — untuk cek sebelum build)

```bash
PORT=5173 pnpm --filter @workspace/saldo-tracker run dev
# atau
PORT=5173 npm run dev
```

Buka browser ke `http://localhost:5173`.

### 4. Buat Production Build (untuk Android)

Gunakan script `build:apk` — sudah dikonfigurasi dengan `BASE_PATH=./` sehingga semua asset menggunakan path relatif.  
Path relatif wajib agar WebView dapat memuat file dari `file:///android_asset/www/`.

```bash
# Dari root monorepo (direkomendasikan):
pnpm --filter @workspace/saldo-tracker run build:apk

# Atau masuk ke folder artifact langsung:
cd artifacts/saldo-tracker
npm run build:apk
```

**Windows (Command Prompt) — jika script tidak terbaca:**
```cmd
set BASE_PATH=./
pnpm --filter @workspace/saldo-tracker run build
```

**Windows (PowerShell) — jika script tidak terbaca:**
```powershell
$env:BASE_PATH="./"
pnpm --filter @workspace/saldo-tracker run build
```

> **Jangan** gunakan `npm run build` (tanpa `:apk`) untuk APK — script tersebut tanpa `BASE_PATH` akan menghasilkan path absolut `/assets/...` yang tidak bisa dimuat oleh WebView.

### 5. Cek Hasil Build

Output ada di: `artifacts/saldo-tracker/dist/public/`

```
dist/public/
├── index.html          ← <script src="./assets/..."> (classic, tanpa type="module")
├── favicon.svg
├── robots.txt
└── assets/
    └── index-[hash].js ← JS + CSS semuanya dalam satu file (IIFE bundle)
```

> **Catatan:** CSS sudah di-embed ke dalam bundle JS (IIFE format). Tidak ada file `.css` terpisah — ini normal dan diinginkan untuk APK WebView.

Verifikasi: Buka `dist/public/index.html` di browser lokal (drag & drop ke Chrome) — semua fitur harus berjalan tanpa server.

---

## Integrasi ke Android Studio

### 1. Buat Project Android Studio Baru

1. Buka Android Studio → **New Project**
2. Pilih template **Empty Views Activity**
3. Isi:
   - **Name:** Saldo Tracker
   - **Package name:** com.example.saldotracker (ganti sesuai kebutuhan)
   - **Language:** Kotlin (atau Java)
   - **Minimum SDK:** API 21 (Android 5.0) — direkomendasikan API 24+
4. Klik **Finish** dan tunggu Gradle sync selesai

### 2. Copy Offline Bundle ke Android Studio

Buat folder aset:

```
app/
└── src/
    └── main/
        └── assets/
            └── www/          ← buat folder ini
```

Copy **seluruh isi** `artifacts/saldo-tracker/dist/public/` ke dalam `app/src/main/assets/www/`:

```bash
# Di terminal / File Explorer:
cp -r artifacts/saldo-tracker/dist/public/* app/src/main/assets/www/
```

Hasil akhir struktur Android Studio:

```
app/src/main/assets/www/
├── index.html
├── favicon.svg
└── assets/
    ├── main-[hash].js
    └── main-[hash].css
```

### 3. Tambahkan Permission di `AndroidManifest.xml`

Buka `app/src/main/AndroidManifest.xml` dan tambahkan di dalam `<manifest>`:

```xml
<!-- Izin internet diperlukan jika showSaveFilePicker diaktifkan -->
<uses-permission android:name="android.permission.INTERNET" />
<!-- Izin baca/tulis storage untuk export/import file (Android < 10) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
```

Di dalam tag `<application>`:
```xml
android:usesCleartextTraffic="false"
```

### 4. Setup WebView di `MainActivity`

**Kotlin (`MainActivity.kt`):**

```kotlin
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true       // Wajib untuk localStorage
        settings.allowFileAccess = true         // Wajib untuk file:// assets
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_NO_CACHE

        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        // Download listener — diperlukan untuk tombol Export JSON
        webView.setDownloadListener { url, _, _, mimetype, _ ->
            try {
                val request = android.app.DownloadManager.Request(android.net.Uri.parse(url))
                request.setMimeType(mimetype)
                request.setNotificationVisibility(
                    android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )
                request.setDestinationInExternalPublicDir(
                    android.os.Environment.DIRECTORY_DOWNLOADS,
                    "SaldoTracker-backup.json"
                )
                val dm = getSystemService(DOWNLOAD_SERVICE) as android.app.DownloadManager
                dm.enqueue(request)
                Toast.makeText(this, "Menyimpan file backup...", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Gagal menyimpan: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }

        webView.loadUrl("file:///android_asset/www/index.html")
    }

    // Tombol Back kembali ke halaman sebelumnya di WebView
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

**Java (`MainActivity.java`):**

```java
import android.app.DownloadManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.*;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);       // Wajib untuk localStorage
        settings.setAllowFileAccess(true);          // Wajib untuk file:// assets
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Download listener — diperlukan untuk tombol Export JSON
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimeType);
                request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                );
                request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS, "SaldoTracker-backup.json"
                );
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.enqueue(request);
                Toast.makeText(this, "Menyimpan file backup...", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Gagal menyimpan: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        });

        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

### 5. Update Layout `activity_main.xml`

Buka `app/src/main/res/layout/activity_main.xml` dan ganti isinya:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
```

---

## Build APK Debug (Testing)

Di Android Studio:
1. Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Tunggu proses selesai
3. Klik **locate** di notifikasi untuk membuka folder APK
4. APK berada di: `app/build/outputs/apk/debug/app-debug.apk`

Install ke perangkat:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Build APK Release (Distribusi)

### 1. Buat Keystore (sekali saja)

```bash
keytool -genkey -v \
  -keystore saldo-tracker.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias saldo-tracker-key
```

Simpan file `.jks` dan password dengan aman. Jangan di-commit ke Git.

### 2. Konfigurasi Signing di `build.gradle (app)`

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../saldo-tracker.jks")  // sesuaikan path
            storePassword "YOUR_STORE_PASSWORD"
            keyAlias "saldo-tracker-key"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

> Untuk keamanan, gunakan `local.properties` atau environment variable, bukan hardcode password.

### 3. Build APK Release

Menu **Build → Generate Signed Bundle / APK → APK → Release → Finish**

APK berada di: `app/build/outputs/apk/release/app-release.apk`

---

## Build AAB untuk Google Play

Menu **Build → Generate Signed Bundle / APK → Android App Bundle → Release → Finish**

AAB berada di: `app/build/outputs/bundle/release/app-release.aab`

Upload ke Google Play Console melalui **Production → Releases → Create new release**.

---

## Catatan Penting

### Offline & Data Lokal
- Seluruh data disimpan di **DOM Storage (localStorage)** WebView — data tidak hilang saat app ditutup
- Uninstall app = data hilang; gunakan Export JSON sebelum uninstall
- Export: tombol **Export JSON** di halaman Riwayat → tersimpan di folder Downloads
- Import: tombol **Import JSON** → pilih file dari File Manager

### Kompatibilitas Android
| Fitur | Min Android |
|---|---|
| Bundle IIFE (classic script, tanpa ES module) | API 21+ (WebView diupdate via Google Play) |
| Syntax JS yang digunakan (async/await, destructuring) | Chrome 60+ = API 26 natively; API 24+ via Play Store update |
| localStorage (DOM Storage) | API 21 (Android 5.0) |
| `showSaveFilePicker` (save dialog ke File Manager) | Chrome 86+ / API 30+ |
| Fallback `<a download>` via DownloadManager | API 21+ |
| `<input type="file">` (import dari File Manager) | API 21+ |

> Direkomendasikan target minimum **API 26 (Android 8.0)** untuk garansi penuh tanpa bergantung pada update WebView.  
> Direkomendasikan **API 24+ dengan WebView diupdate** untuk jangkauan lebih luas.

### Jika Export Tidak Muncul di File Manager
Perangkat Android lama (API < 23) kadang memerlukan permission runtime untuk WRITE_EXTERNAL_STORAGE. Tambahkan permission request di `MainActivity` menggunakan `ActivityCompat.requestPermissions()`.

---

## Dependency Lengkap

### JavaScript / TypeScript (dari `package.json`)

| Package | Versi | Keterangan |
|---|---|---|
| `vite` | dari workspace catalog | Build tool & dev server |
| `typescript` | ~5.9.3 | Compiler TypeScript |
| `@replit/vite-plugin-cartographer` | dari catalog | Dev only — tidak masuk production build |
| `@replit/vite-plugin-dev-banner` | dari catalog | Dev only — tidak masuk production build |
| `@types/node` | dari catalog | TypeScript types untuk Node.js |

> Plugin Replit (`cartographer`, `dev-banner`) hanya aktif saat `NODE_ENV !== 'production'` — **tidak masuk ke APK**.

### Android (dari Android Studio — Gradle)

| Library | Versi | Keterangan |
|---|---|---|
| `androidx.appcompat:appcompat` | 1.6.x+ | Activity base |
| `com.google.android.material:material` | 1.11.x+ | Material design |
| `androidx.webkit:webkit` | 1.10.x+ | WebView compat (opsional) |

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Layar putih saat buka APK | Pastikan `dist/public/` sudah di-copy ke `assets/www/`, dan `setAllowFileAccess(true)` aktif |
| Tombol Export tidak menyimpan | Tambahkan `setDownloadListener` di MainActivity (lihat contoh di atas) |
| Import file tidak bisa dipilih | Pastikan `setAllowFileAccess(true)` dan `setAllowContentAccess(true)` aktif |
| Data hilang setelah update APK | Data localStorage aman selama package name tidak berubah |
| Data hilang setelah reinstall | Normal — backup dengan Export JSON sebelum uninstall |
| Build Vite gagal: "PORT not set" | Build tidak memerlukan PORT. Jalankan langsung: `BASE_PATH=./ npx vite build --config vite.config.ts` |
| Asset path salah (404 di WebView) | Pastikan build menggunakan `pnpm run build:apk` (sudah include `BASE_PATH=./`) |
| Layar putih di Android 7 ke bawah | Update WebView di Google Play Store, atau naikkan minSdkVersion ke 26 |

---

## Checklist Sebelum Distribusi

- [ ] Gunakan `pnpm run build:apk` (bukan `build` biasa)
- [ ] `dist/public/` sudah di-copy ke `assets/www/`
- [ ] `setJavaScriptEnabled(true)` aktif
- [ ] `setDomStorageEnabled(true)` aktif
- [ ] `setAllowFileAccess(true)` aktif
- [ ] `setDownloadListener` dikonfigurasi
- [ ] APK sudah di-test di perangkat nyata
- [ ] Export → Import JSON sudah dicoba di perangkat Android
- [ ] Semua halaman (Dashboard, Tambah, Riwayat, Statistik) berfungsi offline
- [ ] Dark mode toggle berfungsi
- [ ] Format angka titik ribuan muncul saat mengetik
