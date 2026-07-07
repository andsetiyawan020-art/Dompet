---
name: Saldo Tracker data model v2
description: Multi-entry-per-day model, optional saldoHariIni, day aggregation via getDaySummary()
---

## Rule
`saldoHariIni = 0` means "not yet set" (pengeluaran-only entry).  
Multiple `SaldoEntry` records per date are allowed; exactly one may be a "closing" entry (`saldoHariIni > 0`).

## Pendapatan formula (v2)
```
Pendapatan = SaldoHariIni - SaldoKemarin + TotalPengeluaranHariIni
```
Where `TotalPengeluaranHariIni` = sum of `pengeluaran` across ALL entries for that date.

**Old formula (v1):** `SHI - (SK - PE)` — algebraically identical but only applied to a single entry per day.

## Key functions in storage.ts
- `getDaySummary(dateStr)` → `DaySummary` — single aggregation point used by Dashboard, Statistik, Charts
- `getDayTotalPengeluaranExcluding(dateStr, excludeId?)` — used by tambah.ts during recalculate
- `hasDayClosingEntry(dateStr, excludeId?)` — prevents duplicate SHI entries per day
- `getLastSaldoHariIni(beforeDate)` — replaces getLastEntryBefore for saldoKemarin auto-fill

**Why:** Allows recording multiple expenses throughout the day without requiring the closing balance upfront. SHI is entered once at end of day as the "closing" entry.

**How to apply:** Any future feature that reads saldo/pendapatan/pengeluaran at a day level must go through `getDaySummary()`, not `entry.saldoHariIni` directly.

## Export/Import
- Export: File System Access API (`showSaveFilePicker`) → fallback to `<a download>`. No Web Share API.
- Filename: `SaldoTracker-YYYY-MM-DD.json`
- Import: plain file picker + FileReader (works on Android WebView). Strips HTML tags from `kategori`/`catatan` on import.
