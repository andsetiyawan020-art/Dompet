# Saldo Tracker

Aplikasi pencatatan saldo harian. Pengguna input Saldo Hari Ini dan Pengeluaran, aplikasi menghitung Pendapatan secara otomatis.

**Rumus:** `Pendapatan = Saldo Hari Ini − (Saldo Kemarin − Pengeluaran)`

## Run & Operate

- `pnpm --filter @workspace/saldo-tracker run dev` — jalankan dev server (Vite)
- `pnpm --filter @workspace/saldo-tracker run typecheck` — type check TypeScript
- `BASE_PATH=/ pnpm --filter @workspace/saldo-tracker run build` — build untuk Android WebView APK
- Output build ada di: `artifacts/saldo-tracker/dist/public/`

## Stack

- Vanilla TypeScript + Vite (no React / no heavy framework)
- localStorage untuk penyimpanan data (no database)
- Canvas API untuk grafik statistik
- pnpm workspaces, TypeScript 5.9

## Where things live

```
artifacts/saldo-tracker/
├── index.html              # HTML shell
├── src/
│   ├── main.ts             # Entry point
│   ├── style.css           # Semua CSS
│   ├── app.ts              # SPA router & navigasi
│   ├── types.ts            # TypeScript interfaces
│   ├── utils.ts            # Utilitas (format rupiah, tanggal, dll)
│   ├── storage.ts          # CRUD localStorage
│   ├── calculator.ts       # Kalkulator modal
│   ├── charts.ts           # Grafik Canvas API
│   └── pages/              # Halaman-halaman SPA
│       ├── dashboard.ts
│       ├── tambah.ts
│       ├── riwayat.ts
│       └── statistik.ts
├── vite.config.ts
├── tsconfig.json
└── README.md               # Panduan lengkap + setup Android Studio
```

## Architecture decisions

- Vanilla TypeScript without React — output build berupa HTML/CSS/JS murni sehingga bisa diload langsung via Android WebView
- localStorage sebagai storage — tidak memerlukan server backend
- SPA routing manual (`navigate()`) — ringan dan tidak bergantung pada router library
- CSS custom properties untuk theming — mendukung dark mode tanpa JavaScript overhead

## Product

- **Dashboard** — Ringkasan saldo hari ini, kemarin, pendapatan, pengeluaran
- **Tambah** — Form input dengan kalkulator nominal, auto-hitung pendapatan
- **Riwayat** — List transaksi dengan search, filter, edit, delete, export/import JSON
- **Statistik** — Grafik bulanan & tahunan menggunakan Canvas API

## User preferences

_Tidak ada preferensi spesifik yang tersimpan._

## Gotchas

- `BASE_PATH` harus di-set saat build: `BASE_PATH=/ pnpm ... run build`
- Untuk Android WebView APK: `settings.setDomStorageEnabled(true)` **wajib** agar localStorage berfungsi
- Lihat README.md di artifact untuk panduan lengkap setup Android Studio

## Pointers

- `artifacts/saldo-tracker/README.md` — Panduan lengkap deploy ke GitHub & Android Studio APK
