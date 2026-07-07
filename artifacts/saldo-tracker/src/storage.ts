// ============================================================
// LocalStorage Data Layer
// ============================================================

import type { SaldoEntry, DaySummary } from './types';

const STORAGE_KEY = 'saldo_tracker_data';
const SETTINGS_KEY = 'saldo_tracker_settings';

// ---- CRUD Operations ----------------------------------------

export function getEntries(): SaldoEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as SaldoEntry[];
    // Sort by date descending, then by createdAt descending within the same date
    return entries.sort((a, b) => {
      const dateCmp = b.tanggal.localeCompare(a.tanggal);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  } catch {
    return [];
  }
}

export function getEntriesAsc(): SaldoEntry[] {
  return [...getEntries()].reverse();
}

export function getEntryById(id: string): SaldoEntry | null {
  return getEntries().find(e => e.id === id) ?? null;
}

export function saveEntry(entry: SaldoEntry): void {
  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function updateEntry(updated: SaldoEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === updated.id);
  if (idx !== -1) {
    entries[idx] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Delete ALL entries for a specific date (used when user deletes a whole day) */
export function deleteAllDayEntries(tanggal: string): void {
  const entries = getEntries().filter(e => e.tanggal !== tanggal);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ---- Day-Level Aggregation ----------------------------------

/** Get all entries for a specific date */
export function getDayEntries(dateStr: string): SaldoEntry[] {
  return getEntries().filter(e => e.tanggal === dateStr);
}

/** Sum of all pengeluaran for a specific date */
export function getDayTotalPengeluaran(dateStr: string): number {
  return getDayEntries(dateStr).reduce((s, e) => s + e.pengeluaran, 0);
}

/**
 * Get saldoHariIni for a specific date.
 * Returns 0 if no closing entry (saldoHariIni > 0) exists for that date.
 */
export function getDaySaldoHariIni(dateStr: string): number {
  const closing = getDayEntries(dateStr).find(e => e.saldoHariIni > 0);
  return closing?.saldoHariIni ?? 0;
}

/**
 * Update or set the Saldo Hari Ini for a specific date.
 * - If a closing entry (saldoHariIni > 0) exists for that date, update it.
 * - Otherwise, set saldoHariIni on the most recent entry for that date.
 * Recalculates pendapatan automatically.
 */
export function updateOrSetDaySHI(tanggal: string, shi: number): void {
  const allEntries = getEntries();
  const totalPe = allEntries
    .filter(e => e.tanggal === tanggal)
    .reduce((s, e) => s + e.pengeluaran, 0);

  const closingIdx = allEntries.findIndex(e => e.tanggal === tanggal && e.saldoHariIni > 0);
  if (closingIdx !== -1) {
    const e = allEntries[closingIdx];
    allEntries[closingIdx] = {
      ...e,
      saldoHariIni: shi,
      pendapatan: shi - e.saldoKemarin + totalPe,
    };
  } else {
    // Set SHI on the most recent entry for this date
    const dayEntries = allEntries
      .filter(e => e.tanggal === tanggal)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (dayEntries.length > 0) {
      const latestIdx = allEntries.findIndex(e => e.id === dayEntries[0].id);
      const e = allEntries[latestIdx];
      allEntries[latestIdx] = {
        ...e,
        saldoHariIni: shi,
        pendapatan: shi - e.saldoKemarin + totalPe,
      };
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
}

/** Clear (remove) the Saldo Hari Ini for a specific date */
export function clearDaySHI(tanggal: string): void {
  const allEntries = getEntries();
  const closingIdx = allEntries.findIndex(e => e.tanggal === tanggal && e.saldoHariIni > 0);
  if (closingIdx !== -1) {
    allEntries[closingIdx] = {
      ...allEntries[closingIdx],
      saldoHariIni: 0,
      pendapatan: 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
  }
}

/**
 * Compute the DaySummary for a given date.
 * Aggregates all entries for that date.
 */
export function getDaySummary(dateStr: string): DaySummary {
  const entries = getDayEntries(dateStr);
  const totalPengeluaran = entries.reduce((s, e) => s + e.pengeluaran, 0);

  // Closing entry = entry with saldoHariIni > 0 (take the latest one by createdAt)
  const closingEntry = entries
    .filter(e => e.saldoHariIni > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

  const saldoHariIni = closingEntry?.saldoHariIni ?? 0;
  const hasSaldo = saldoHariIni > 0;

  // saldoKemarin: use the closing entry's saldoKemarin if available,
  // otherwise the first entry's saldoKemarin
  const saldoKemarin =
    closingEntry?.saldoKemarin ??
    (entries.length > 0 ? entries[entries.length - 1].saldoKemarin : 0);

  // Pendapatan formula: SHI - SK + Total Pengeluaran Hari Ini
  const pendapatan = hasSaldo
    ? saldoHariIni - saldoKemarin + totalPengeluaran
    : 0;

  return { tanggal: dateStr, saldoKemarin, totalPengeluaran, saldoHariIni, hasSaldo, pendapatan };
}

/** Get DaySummary for every unique date in a list of entries, sorted desc */
export function getDaySummariesFromEntries(entries: SaldoEntry[]): DaySummary[] {
  const dates = [...new Set(entries.map(e => e.tanggal))].sort((a, b) =>
    b.localeCompare(a)
  );
  return dates.map(d => getDaySummary(d));
}

// ---- Query Helpers ------------------------------------------

/** Get the most recent entry (by date then createdAt) */
export function getLastEntry(): SaldoEntry | null {
  const entries = getEntries();
  return entries.length > 0 ? entries[0] : null;
}

/**
 * Get the most recent saldoHariIni value before a given date.
 * Only considers closing entries (saldoHariIni > 0).
 */
export function getLastSaldoHariIni(beforeDate: string): number {
  const candidates = getEntriesAsc().filter(
    e => e.tanggal < beforeDate && e.saldoHariIni > 0
  );
  if (candidates.length === 0) return 0;
  return candidates[candidates.length - 1].saldoHariIni;
}

/** Get entries for a specific month (YYYY-MM) */
export function getEntriesByMonth(yearMonth: string): SaldoEntry[] {
  return getEntries().filter(e => e.tanggal.startsWith(yearMonth));
}

/** Get entries for a specific year (YYYY) */
export function getEntriesByYear(year: string): SaldoEntry[] {
  return getEntries().filter(e => e.tanggal.startsWith(year));
}

/** Get all available years in data */
export function getAvailableYears(): string[] {
  const years = new Set(getEntries().map(e => e.tanggal.slice(0, 4)));
  return [...years].sort((a, b) => b.localeCompare(a));
}

/** Get all available months (YYYY-MM) in data */
export function getAvailableMonths(): string[] {
  const months = new Set(getEntries().map(e => e.tanggal.slice(0, 7)));
  return [...months].sort((a, b) => b.localeCompare(a));
}

/** Sum pengeluaran for a date, excluding one specific entry by id */
export function getDayTotalPengeluaranExcluding(dateStr: string, excludeId?: string): number {
  return getDayEntries(dateStr)
    .filter(e => e.id !== excludeId)
    .reduce((s, e) => s + e.pengeluaran, 0);
}

// ---- Export / Import ----------------------------------------

export function exportDataJSON(): string {
  const entries = getEntries();
  return JSON.stringify(
    { version: '2.0', exportedAt: new Date().toISOString(), entries },
    null,
    2
  );
}

export function importDataJSON(json: string): { ok: boolean; message: string; count: number } {
  try {
    const parsed = JSON.parse(json);
    const incoming: SaldoEntry[] =
      parsed.entries ?? (Array.isArray(parsed) ? parsed : []);

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return { ok: false, message: 'Format tidak valid atau data kosong.', count: 0 };
    }

    // Validate each entry has required fields
    for (const e of incoming) {
      if (
        typeof e.id !== 'string' ||
        typeof e.tanggal !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(e.tanggal) ||
        typeof e.pengeluaran !== 'number' ||
        typeof e.saldoKemarin !== 'number' ||
        typeof e.saldoHariIni !== 'number'
      ) {
        return {
          ok: false,
          message: 'Data tidak valid: field penting hilang atau tipe salah.',
          count: 0,
        };
      }
      // Coerce and sanitize optional fields
      if (typeof e.pendapatan !== 'number') e.pendapatan = 0;
      // kategori kept for backward compat but not required in new data
      if (typeof e.kategori !== 'string') e.kategori = '';
      e.kategori = e.kategori.replace(/<[^>]*>/g, '').slice(0, 100);
      if (typeof e.catatan !== 'string') e.catatan = '';
      // Strip HTML tags from user text fields to prevent stored XSS
      e.catatan = e.catatan.replace(/<[^>]*>/g, '').slice(0, 500);
      if (typeof e.createdAt !== 'string') e.createdAt = new Date().toISOString();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
    return { ok: true, message: `Berhasil import ${incoming.length} data.`, count: incoming.length };
  } catch {
    return { ok: false, message: 'File tidak valid (bukan JSON).', count: 0 };
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ---- Settings -----------------------------------------------

export interface Settings {
  darkMode: boolean;
}

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { darkMode: false };
    return JSON.parse(raw) as Settings;
  } catch {
    return { darkMode: false };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
