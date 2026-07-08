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
├── app-icon.png        ← ikon App Bar gambar_1 (80×80 px PNG)
├── icon-192.png        ← ikon PWA (192×192 px PNG, crop persegi gambar_1)
├── icon-512.png        ← ikon PWA besar (512×512 px PNG, crop persegi gambar_1)
├── gambar_1.png        ← alias icon-192.png — siap pakai untuk Image Asset Studio
├── splash.jpg          ← splash screen gambar_2 (752×1392 px JPEG)
├── manifest.json       ← PWA manifest (ikon, warna tema, display mode)
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
├── app-icon.png        ← ikon App Bar (gambar_1, 80×80 px)
├── icon-192.png        ← ikon PWA / manifest (gambar_1, 192×192 px)
├── icon-512.png        ← ikon PWA besar (gambar_1, 512×512 px)
├── gambar_1.png        ← alias icon-192.png — siap pakai untuk Image Asset Studio
├── splash.jpg          ← splash screen (gambar_2, 752×1392 px)
├── manifest.json
├── robots.txt
└── assets/
    └── index-[hash].js ← JS + CSS dalam satu bundle IIFE
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
import android.app.DownloadManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
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

        // Tombol Back — navigasi di dalam WebView (API 33+ compat, tanpa onBackPressed deprecated)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Download listener — diperlukan untuk tombol Export JSON
        webView.setDownloadListener { url, _, _, mimetype, _ ->
            try {
                val request = DownloadManager.Request(Uri.parse(url))
                request.setMimeType(mimetype)
                request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )
                request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    "SaldoTracker-backup.json"
                )
                val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(this, "Menyimpan file backup...", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Gagal menyimpan: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }

        webView.loadUrl("file:///android_asset/www/index.html")
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
import androidx.activity.OnBackPressedCallback;
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
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Tombol Back — navigasi di dalam WebView (API 33+ compat)
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

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
}
```

> **Catatan:** Kedua contoh di atas adalah setup dasar WebView untuk referensi jika membuat project Android baru dari nol.
> `android/app/src/main/java/com/andsetiyawan/saldotracker/MainActivity.kt` di repo ini **sudah berisi implementasi final** dan lebih lengkap dari contoh di atas — termasuk `ExportBridge` (`window.AndroidExport`), sebuah JS-interface yang membuka dialog sistem **"Simpan ke..."** (`ACTION_CREATE_DOCUMENT` / Storage Access Framework) saat tombol **Export JSON** ditekan, alih-alih auto-download via `DownloadManager` ke folder Downloads. `setDownloadListener` tetap ada di file itu hanya sebagai fallback untuk skenario blob-download lain, bukan jalur utama Export JSON lagi. Gunakan file tersebut sebagai sumber kebenaran, jangan salin ulang contoh di atas ke project produksi.

### 5. Ganti Launcher Icon Android Native (Wajib)

> **Mengapa perlu langkah ini?**  
> App Bar dan Splash Screen diganti melalui web app (di `assets/www/`).  
> Tapi **ikon di layar utama HP (launcher icon)** diambil dari resource Android native (`res/mipmap-*`),  
> **bukan** dari file web. Jika langkah ini dilewati, ikon di homescreen tetap menggunakan ikon bawaan Android Studio (robot hijau).

#### A. Siapkan file sumber

File `gambar_1.png` sudah tersedia di:
```
artifacts/saldo-tracker/dist/public/gambar_1.png   ← gunakan ini
```
atau `artifacts/saldo-tracker/public/gambar_1.png` (sumber, sebelum build).

Ini adalah crop persegi dari gambar_1, ukuran 192×192 px, format PNG — langsung siap untuk Image Asset Studio.

#### B. Buka Image Asset Studio di Android Studio

1. Di panel **Project**, klik kanan pada folder `app/src/main/res/`
2. Pilih **New → Image Asset**
3. Wizard **Configure Image Asset** terbuka

#### C. Konfigurasi ikon

| Field | Nilai |
|---|---|
| **Icon Type** | Launcher Icons (Adaptive and Legacy) |
| **Name** | `ic_launcher` |
| **Asset Type** | Image |
| **Path** | Klik ikon folder → pilih `gambar_1.png` dari `dist/public/` |
| **Scaling → Trim** | Yes |
| **Scaling → Resize** | 100% (atau sesuaikan agar gambar tidak terpotong berlebihan) |

Tab **Foreground Layer:**
- Source Asset → Image → pilih `gambar_1.png`
- Scaling: geser hingga ikon terlihat pas di dalam preview lingkaran

Tab **Background Layer:**
- Source Asset → Color → pilih warna biru `#1E88E5` (warna tema aplikasi)
- Ini memastikan tampilan ikon "adaptive" di Android 8+ terlihat bersih

4. Klik **Next** → pastikan preview semua ukuran terlihat benar
5. Klik **Finish**

#### D. Hasil yang dihasilkan otomatis oleh Android Studio

Image Asset Studio akan membuat/mengganti file-file berikut:

```
app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png          ← 48×48 px
│   └── ic_launcher_round.png    ← 48×48 px (bulat)
├── mipmap-hdpi/
│   ├── ic_launcher.png          ← 72×72 px
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png          ← 96×96 px
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png          ← 144×144 px
│   └── ic_launcher_round.png
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png          ← 192×192 px
│   └── ic_launcher_round.png
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml          ← Adaptive icon (Android 8+)
    └── ic_launcher_round.xml
```

> **Setelah selesai:** Rebuild APK → install ke perangkat. Launcher icon di homescreen akan berubah ke `gambar_1`.

#### E. Verifikasi di perangkat

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Tekan lama ikon aplikasi di homescreen → ikon harus menampilkan gambar_1 (dompet koin biru).

---

### 6. Update Layout `activity_main.xml`

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
- Export: tombol **Export JSON** di halaman Riwayat → membuka dialog sistem **"Simpan ke..."** (Storage Access Framework / `ACTION_CREATE_DOCUMENT`), pengguna memilih sendiri lokasi (Unduhan, Penyimpanan Internal, SD Card, Google Drive, dll) dan nama file
- Import: tombol **Import JSON** → pilih file dari File Manager (tidak berubah)

### Export JSON via Storage Access Framework (Android)
Tombol Export JSON di web (`riwayat.ts`) memanggil `window.AndroidExport.exportJson(json, filename)`, sebuah JS bridge (`@JavascriptInterface`) yang diekspos oleh `MainActivity.kt`. Alur:

1. Native meluncurkan `ActivityResultContracts.CreateDocument("application/json")` — ini adalah dialog "Simpan ke..." bawaan Android (SAF), sama seperti yang dipakai Files/Downloads/Drive.
2. Pengguna memilih lokasi & (opsional) mengubah nama file, lalu menekan Simpan.
3. Native menulis konten JSON ke `Uri` hasil pilihan via `contentResolver.openOutputStream(uri)` — tidak menyentuh folder Downloads secara otomatis dan tidak memakai Share Intent.
4. Native memanggil balik `window.__onAndroidExportResult(success, message, cancelled)` di WebView agar UI web bisa menampilkan toast sukses/gagal/batal.

Di browser desktop (bukan APK), tombol Export tetap memakai `showSaveFilePicker` (jika tersedia) lalu fallback `<a download>` — perilaku ini tidak berubah.

### Kompatibilitas Android
| Fitur | Min Android |
|---|---|
| Bundle IIFE (classic script, tanpa ES module) | API 21+ (WebView diupdate via Google Play) |
| Syntax JS yang digunakan (async/await, destructuring) | Chrome 60+ = API 26 natively; API 24+ via Play Store update |
| localStorage (DOM Storage) | API 21 (Android 5.0) |
| Export via SAF `ACTION_CREATE_DOCUMENT` (`AndroidExport` bridge) | API 19+ — tidak perlu permission storage, teruji untuk target Android 10–14 (API 29–34) |
| `showSaveFilePicker` (fallback di browser desktop, bukan di APK) | Chrome 86+ |
| `<input type="file">` (import dari File Manager) | API 21+ |

> Direkomendasikan target minimum **API 26 (Android 8.0)** untuk garansi penuh tanpa bergantung pada update WebView.  
> Direkomendasikan **API 24+ dengan WebView diupdate** untuk jangkauan lebih luas.
> `minSdk` project ini adalah 24 dan `targetSdk` 34 — sudah mencakup rentang Android 10–14 yang disyaratkan untuk fitur Export JSON.

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

### ❌ Generate Signed APK Gagal

Ini masalah paling umum. Cek satu per satu:

#### 1. Belum buat keystore
```bash
keytool -genkey -v \
  -keystore saldo-tracker.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias saldo-tracker-key
```
Simpan file `.jks` dan password. **Jangan di-commit ke Git.**

#### 2. Signing config di `build.gradle (Module: app)` belum benar
Buka `app/build.gradle`, pastikan ada blok ini (ganti nilai `storeFile`, password, dan alias sesuai keystore kamu):

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile     file("/Users/namaKamu/saldo-tracker.jks")   // ← path ABSOLUT lebih aman
            storePassword "isiPasswordKamu"
            keyAlias      "saldo-tracker-key"
            keyPassword   "isiPasswordKamu"
        }
    }
    buildTypes {
        release {
            minifyEnabled false        // ← Nonaktifkan dulu untuk APK pertama
            signingConfig signingConfigs.release
        }
    }
}
```

> **Tips:** Gunakan path **absolut** untuk `storeFile` — path relatif sering menyebabkan error `FileNotFoundException`.

> **Tips:** Gunakan `minifyEnabled false` untuk APK pertama. ProGuard (`minifyEnabled true`) memerlukan konfigurasi tambahan dan sering menjadi penyebab kegagalan tersembunyi.

#### 3. `onBackPressed()` deprecated (API 33+, Android 13+)
Jika `targetSdk` 33 atau lebih, kode `override fun onBackPressed()` yang lama akan menyebabkan warning/error di beberapa konfigurasi Gradle. **Gunakan kode `OnBackPressedCallback` yang ada di bagian MainActivity di atas** — sudah diperbarui.

#### 4. Gradle sync gagal / dependency tidak ditemukan
Cek `build.gradle` level project dan module:
- `compileSdk` minimal 34
- `targetSdk` minimal 33
- `androidx.activity:activity-ktx` atau `androidx.appcompat:appcompat` sudah include `OnBackPressedCallback`

```gradle
// app/build.gradle
dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
}
```

#### 5. Dist belum di-copy ke `assets/www/`
APK akan **build berhasil** tapi app layar putih jika `assets/www/` kosong atau berisi file lama.

Selalu jalankan ini sebelum build APK:
```bash
pnpm --filter @workspace/saldo-tracker run build:apk
cp -r artifacts/saldo-tracker/dist/public/* app/src/main/assets/www/
```

#### 6. Pesan error "Keystore file not found" atau "Wrong password"
- Pastikan path di `storeFile` benar dan file `.jks` ada
- Password di `storePassword` dan `keyPassword` harus sama persis seperti saat membuat keystore

---

### Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| Layar putih saat buka APK | Pastikan `dist/public/` sudah di-copy ke `assets/www/`, dan `setAllowFileAccess(true)` aktif |
| Tombol Export tidak menyimpan | Tambahkan `setDownloadListener` di MainActivity (lihat contoh di atas) |
| Import file tidak bisa dipilih | Pastikan `setAllowFileAccess(true)` dan `setAllowContentAccess(true)` aktif |
| Data hilang setelah update APK | Data localStorage aman selama package name tidak berubah |
| Data hilang setelah reinstall | Normal — backup dengan Export JSON sebelum uninstall |
| Build Vite gagal di Node 18/20 | Sudah diperbaiki — gunakan versi terbaru dari Replit. Atau: `BASE_PATH=./ npx vite build --config vite.config.ts` |
| Asset path salah (404 di WebView) | Pastikan build menggunakan `pnpm run build:apk` (sudah include `BASE_PATH=./`) |
| Layar putih di Android 7 ke bawah | Update WebView di Google Play Store, atau naikkan minSdkVersion ke 26 |

---

## Checklist Sebelum Distribusi

### Build & Copy
- [ ] Gunakan `pnpm run build:apk` (bukan `build` biasa)
- [ ] `dist/public/` sudah di-copy ke `assets/www/` (termasuk `gambar_1.png`, `splash.jpg`, `icon-192.png`)
- [ ] `setJavaScriptEnabled(true)` aktif
- [ ] `setDomStorageEnabled(true)` aktif
- [ ] `setAllowFileAccess(true)` aktif
- [ ] `setDownloadListener` dikonfigurasi

### Launcher Icon Native (Wajib — lihat panduan di atas)
- [ ] Image Asset Studio sudah dijalankan dengan `gambar_1.png` sebagai sumber
- [ ] File `res/mipmap-*/ic_launcher.png` sudah terganti (bukan robot hijau bawaan)
- [ ] Launcher icon di homescreen HP sudah menampilkan gambar_1 setelah install APK

### Testing
- [ ] Splash screen (gambar_2) muncul sebentar saat app pertama dibuka
- [ ] App Bar menampilkan ikon gambar_1 di sebelah kiri judul "Saldo Tracker"
- [ ] Launcher icon di homescreen menampilkan gambar_1 (dompet koin biru)
- [ ] APK sudah di-test di perangkat nyata
- [ ] Export → Import JSON sudah dicoba di perangkat Android
- [ ] Semua halaman (Dashboard, Tambah, Riwayat, Statistik) berfungsi offline
- [ ] Dark mode toggle berfungsi
- [ ] Format angka titik ribuan muncul saat mengetik
