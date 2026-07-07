// ============================================================
// Tambah / Edit Entry Page
// ============================================================

import {
  saveEntry,
  updateEntry,
  getEntryById,
  getDayTotalPengeluaranExcluding,
  getDaySaldoHariIni,
  updateOrSetDaySHI,
  getLastSaldoHariIni,
} from '../storage';
import { formatRupiah, formatNumber, generateId, today, showToast, escHtml } from '../utils';
import type { SaldoEntry } from '../types';
import { showCalculator } from '../calculator';

/**
 * editId can be:
 * - null / undefined  → new entry
 * - 'YYYY-MM-DD'      → new entry with that date pre-filled
 * - an entry ID       → edit that specific entry
 */
export function renderTambah(editId?: string | null): string {
  const isDatePrefill = !!editId && /^\d{4}-\d{2}-\d{2}$/.test(editId);
  const isEditing     = !!editId && !isDatePrefill;
  const editing       = isEditing ? getEntryById(editId!) : null;

  const todayStr    = today();
  const defaultDate = editing?.tanggal ?? (isDatePrefill ? editId! : todayStr);

  const saldoKemarin = editing?.saldoKemarin ?? getLastSaldoHariIni(defaultDate);
  const pengeluaran  = editing?.pengeluaran ?? 0;
  const catatan      = editing?.catatan ?? '';

  // For edit mode show the day's current SHI (day-level); for new mode start blank
  const daySHI = isEditing ? getDaySaldoHariIni(defaultDate) : 0;

  const pendapatanHTML = daySHI > 0
    ? formatRupiah(computePendapatan(daySHI, saldoKemarin, pengeluaran, defaultDate, isEditing ? editId! : null))
    : '<span class="text-muted-sm">Belum diisi</span>';

  const title = editing ? 'Edit Transaksi' : 'Tambah Pengeluaran';

  return `
    <div class="page page-tambah">
      <div class="page-header">
        <h2 class="page-title">${title}</h2>
      </div>

      <form id="form-tambah" class="form-card" novalidate>
        <input type="hidden" id="edit-id" value="${editing?.id ?? ''}">

        <!-- Tanggal -->
        <div class="form-group">
          <label class="form-label" for="inp-tanggal">📅 Tanggal</label>
          <input type="date" id="inp-tanggal" class="form-input" value="${defaultDate}"
            max="${todayStr}" required ${isEditing ? 'readonly' : ''}>
        </div>

        <!-- Saldo Kemarin (read-only) -->
        <div class="form-group">
          <label class="form-label">💰 Saldo Kemarin</label>
          <div class="form-readonly" id="saldo-kemarin-display">
            ${formatRupiah(saldoKemarin)}
          </div>
          <input type="hidden" id="inp-saldo-kemarin" value="${saldoKemarin}">
        </div>

        <!-- Pengeluaran -->
        <div class="form-group">
          <label class="form-label" for="inp-pengeluaran">📉 Pengeluaran</label>
          <div class="input-with-calc">
            <input type="text" id="inp-pengeluaran" class="form-input" inputmode="numeric"
              placeholder="Rp 0" value="${pengeluaran > 0 ? formatNumber(pengeluaran) : ''}" autocomplete="off">
            <button type="button" class="btn-calc" data-target="pengeluaran" title="Buka Kalkulator">🧮</button>
          </div>
        </div>

        <!-- Catatan (nama / keterangan pengeluaran) -->
        <div class="form-group">
          <label class="form-label" for="inp-catatan">📝 Catatan</label>
          <input type="text" id="inp-catatan" class="form-input"
            placeholder="Contoh: Belanja, Bensin, Bayar Listrik, Jajan..."
            value="${escHtml(catatan)}" autocomplete="off" maxlength="200">
          <div class="form-hint">Nama atau keterangan pengeluaran (bebas).</div>
        </div>

        <!-- Saldo Hari Ini (opsional) -->
        <div class="form-group">
          <label class="form-label" for="inp-saldo">
            💳 Saldo Hari Ini
            <span class="badge-optional">Opsional</span>
          </label>
          <div class="input-with-calc">
            <input type="text" id="inp-saldo" class="form-input" inputmode="numeric"
              placeholder="Isi di akhir hari..."
              value="${daySHI > 0 ? formatNumber(daySHI) : ''}" autocomplete="off">
            <button type="button" class="btn-calc" data-target="saldo" title="Buka Kalkulator">🧮</button>
          </div>
          <div class="form-hint">Kosongkan jika belum tutup buku hari ini.</div>
        </div>

        <!-- Pendapatan (auto) -->
        <div class="form-group">
          <label class="form-label">📈 Pendapatan Hari Ini <span class="badge-auto">Otomatis</span></label>
          <div class="form-readonly pendapatan-display" id="pendapatan-display">
            ${pendapatanHTML}
          </div>
        </div>

        <button type="submit" class="btn-primary btn-full">
          ${editing ? '💾 Simpan Perubahan' : '✅ Simpan'}
        </button>
        ${editing ? `<button type="button" class="btn-secondary btn-full" id="btn-cancel-edit">Batal</button>` : ''}
      </form>
    </div>
  `;
}

export function initTambah(editId?: string | null): void {
  const form = document.getElementById('form-tambah') as HTMLFormElement | null;
  if (!form) return;

  const isDatePrefill = !!editId && /^\d{4}-\d{2}-\d{2}$/.test(editId);
  const actualEditId  = (editId && !isDatePrefill) ? editId : null;

  const saldoInput         = document.getElementById('inp-saldo')         as HTMLInputElement;
  const pengeluaranInput   = document.getElementById('inp-pengeluaran')   as HTMLInputElement;
  const saldoKemarinHidden = document.getElementById('inp-saldo-kemarin') as HTMLInputElement;
  const tanggalInput       = document.getElementById('inp-tanggal')       as HTMLInputElement;
  const pendapatanDisp     = document.getElementById('pendapatan-display') as HTMLElement;
  const saldoKemarinDisp   = document.getElementById('saldo-kemarin-display') as HTMLElement;

  // Update Saldo Kemarin when date changes (new entry only)
  if (!actualEditId) {
    tanggalInput?.addEventListener('change', () => {
      const skVal = getLastSaldoHariIni(tanggalInput.value);
      saldoKemarinHidden.value = String(skVal);
      saldoKemarinDisp.textContent = formatRupiah(skVal);
      recalculate();
    });
  }

  [saldoInput, pengeluaranInput].forEach(inp => {
    inp?.addEventListener('input', () => {
      const num = parseInt(inp.value.replace(/\D/g, '')) || 0;
      inp.value = num > 0 ? new Intl.NumberFormat('id-ID').format(num) : '';
      recalculate();
    });
  });

  document.querySelectorAll('.btn-calc').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = (btn as HTMLElement).dataset.target as 'saldo' | 'pengeluaran';
      showCalculator((val: number) => {
        const inp = target === 'saldo' ? saldoInput : pengeluaranInput;
        inp.value = new Intl.NumberFormat('id-ID').format(val);
        recalculate();
      });
    });
  });

  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    window.navigate('riwayat');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(actualEditId);
  });

  function recalculate(): void {
    const tanggal = tanggalInput?.value ?? today();
    const sk      = parseLocalNumber(saldoKemarinHidden?.value ?? '0');
    const shi     = parseLocalNumber(saldoInput?.value ?? '0');
    const pe      = parseLocalNumber(pengeluaranInput?.value ?? '0');
    if (!pendapatanDisp) return;
    if (shi === 0) {
      pendapatanDisp.innerHTML = '<span class="text-muted-sm">Belum diisi</span>';
      pendapatanDisp.classList.remove('negative');
    } else {
      const pendapatan = computePendapatan(shi, sk, pe, tanggal, actualEditId);
      pendapatanDisp.textContent = formatRupiah(pendapatan);
      pendapatanDisp.classList.toggle('negative', pendapatan < 0);
    }
  }
}

function handleSubmit(editId: string | null): void {
  const tanggal         = (document.getElementById('inp-tanggal')      as HTMLInputElement)?.value;
  const saldoKemarinRaw = (document.getElementById('inp-saldo-kemarin') as HTMLInputElement)?.value;
  const saldoRaw        = (document.getElementById('inp-saldo')        as HTMLInputElement)?.value ?? '';
  const pengeRaw        = (document.getElementById('inp-pengeluaran')  as HTMLInputElement)?.value ?? '';
  const catatan         = ((document.getElementById('inp-catatan')     as HTMLInputElement)?.value ?? '').trim();

  if (!tanggal) { showToast('Tanggal harus diisi.', 'error'); return; }

  const saldoKemarin = parseLocalNumber(saldoKemarinRaw ?? '0');
  const saldoHariIni = parseLocalNumber(saldoRaw);
  const pengeluaran  = parseLocalNumber(pengeRaw);

  if (pengeluaran === 0 && saldoHariIni === 0) {
    showToast('Isi Pengeluaran atau Saldo Hari Ini terlebih dahulu.', 'error');
    return;
  }

  if (editId) {
    // ---- Edit: update catatan + pengeluaran on this specific entry ----
    const existing = getEntryById(editId);
    if (!existing) { showToast('Data tidak ditemukan.', 'error'); return; }

    const otherPe = getDayTotalPengeluaranExcluding(tanggal, editId);
    const newPendapatan = existing.saldoHariIni > 0
      ? existing.saldoHariIni - existing.saldoKemarin + otherPe + pengeluaran
      : 0;

    updateEntry({ ...existing, pengeluaran, catatan, pendapatan: newPendapatan });

    // If user also updated the SHI field, propagate to the day's closing entry
    const currentDaySHI = getDaySaldoHariIni(tanggal);
    if (saldoHariIni > 0 && saldoHariIni !== currentDaySHI) {
      updateOrSetDaySHI(tanggal, saldoHariIni);
    }

    showToast('Transaksi berhasil diperbarui!', 'success');
  } else {
    // ---- New entry ----
    const existingDaySHI = getDaySaldoHariIni(tanggal);

    // Only embed SHI directly on this entry if the day has no closing entry yet
    const entrySHI        = (saldoHariIni > 0 && existingDaySHI === 0) ? saldoHariIni : 0;
    const entryPendapatan = entrySHI > 0
      ? computePendapatan(entrySHI, saldoKemarin, pengeluaran, tanggal, null)
      : 0;

    const entry: SaldoEntry = {
      id:           generateId(),
      tanggal,
      saldoKemarin,
      pengeluaran,
      saldoHariIni: entrySHI,
      pendapatan:   entryPendapatan,
      kategori:     '', // backward compat; not used in UI
      catatan,
      createdAt:    new Date().toISOString(),
    };
    saveEntry(entry);

    // Day already had a closing entry → update its SHI
    if (saldoHariIni > 0 && existingDaySHI > 0) {
      updateOrSetDaySHI(tanggal, saldoHariIni);
    }

    showToast('Pengeluaran berhasil disimpan!', 'success');
  }

  window.navigate('riwayat');
}

function computePendapatan(
  shi: number, sk: number, thisPe: number, tanggal: string, editId: string | null,
): number {
  const otherPe = getDayTotalPengeluaranExcluding(tanggal, editId ?? undefined);
  return shi - sk + otherPe + thisPe;
}

function parseLocalNumber(str: string): number {
  return parseInt(str.replace(/\./g, '').replace(/,/g, '')) || 0;
}

declare global {
  interface Window { navigate: (page: string, extra?: string) => void; }
}
