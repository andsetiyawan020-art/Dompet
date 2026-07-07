// ============================================================
// Data Types & Interfaces
// ============================================================

export interface SaldoEntry {
  id: string;
  tanggal: string;       // YYYY-MM-DD
  saldoKemarin: number;  // Previous day's closing balance
  pengeluaran: number;   // This entry's expense
  saldoHariIni: number;  // Today's closing balance (0 = not yet set)
  pendapatan: number;    // Auto-calculated at day level (0 if saldoHariIni not set)
  kategori: string;      // Kept for backward compatibility with old data; not used in new UI
  catatan: string;       // Expense name / notes (free text)
  createdAt: string;     // ISO timestamp
}

/**
 * Aggregated summary for a single calendar date.
 * Computed from all entries with e.tanggal === date.
 */
export interface DaySummary {
  tanggal: string;
  saldoKemarin: number;       // From earliest entry of the date
  totalPengeluaran: number;   // Sum of all entries' pengeluaran
  saldoHariIni: number;       // From the closing entry (saldoHariIni > 0); 0 if not yet set
  hasSaldo: boolean;          // true when closing entry exists
  pendapatan: number;         // saldoHariIni - saldoKemarin + totalPengeluaran; 0 if !hasSaldo
}

export type PageName = 'dashboard' | 'tambah' | 'riwayat' | 'detail';

export interface AppState {
  currentPage: PageName;
  darkMode: boolean;
  editingId: string | null;
}
