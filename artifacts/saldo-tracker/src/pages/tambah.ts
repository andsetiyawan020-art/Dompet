// ============================================================
// Tambah / Edit Entry Page
// ============================================================

import {
  saveEntry,
  updateEntry,
  getEntryById,
  getDayTotalPengeluaranExcluding,
  hasDayClosingEntry,
  getLastSaldoHariIni,
} from '../storage';
import { formatRupiah, formatNumber, generateId, today, showToast, escHtml } from '../utils';
import { KATEGORI_LIST, KATEGORI_ICONS } from '../types';
import type { SaldoEntry } from '../types';
import { showCalculator } from '../calculator';

export function renderTambah(editId?: string | null): string {
  const editing = editId ? getEntryById(editId) : null;

  const todayStr    = today();
  const defaultDate = editing?.tanggal ?? todayStr;

  // Saldo Kemarin: auto-fill from previous day's closing balance
  const saldoKemarin = editing?.saldoKemarin ?? getLastSaldoHariIni(defaultDate);

  // From editing entry (if any)
  const saldoHariIni = editing?.saldoHariIni ?? 0;
  const pengeluaran  = editing?.pengeluaran ?? 0;
  const kategori     = editing?.kategori ?? '';
  const catatan      = editing?.catatan ?? '';

  // Pendapatan display
  const pendapatanHTML = saldoHariIni > 0
    ? formatRupiah(computePendapatan(saldoHariIni, saldoKemarin, pengeluaran, defaultDate, editId ?? null))
    : '<span class="text-muted-sm">Menunggu Saldo Hari Ini</span>';

  const title = editing ? 'Edit Catatan' : 'Tambah Catatan';

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
            max="${todayStr}" required>
        </div>

        <!-- Saldo Kemarin (read-only) -->
        <div class="form-group">
          <label class="form-label">💰 Saldo Kemarin</label>
          <div class="form-readonly" id="saldo-kemarin-display">
            ${formatRupiah(saldoKemarin)}
          </div>
          <input type="hidden" id="inp-saldo-kemarin" value="${saldoKemarin}">
        </div>

        <!-- Pengeluaran Hari Ini -->
        <div class="form-group">
          <label class="form-label" for="inp-pengeluaran">📉 Pengeluaran</label>
          <div class="input-with-calc">
            <input type="text" id="inp-pengeluaran" class="form-input" inputmode="numeric"
              placeholder="Rp 0" value="${pengeluaran > 0 ? formatNumber(pengeluaran) : ''}" autocomplete="off">
            <button type="button" class="btn-calc" data-target="pengeluaran" title="Buka Kalkulator">🧮</button>
          </div>
        </div>

        <!-- Saldo Hari Ini (opsional — tutup hari) -->
        <div class="form-group">
          <label class="form-label" for="inp-saldo">
            💳 Saldo Hari Ini
            <span class="badge-optional">Opsional</span>
          </label>
          <div class="input-with-calc">
            <input type="text" id="inp-saldo" class="form-input" inputmode="numeric"
              placeholder="Isi di akhir hari..." value="${saldoHariIni > 0 ? formatNumber(saldoHariIni) : ''}" autocomplete="off">
            <button type="button" class="btn-calc" data-target="saldo" title="Buka Kalkulator">🧮</button>
          </div>
          <div class="form-hint">Kosongkan jika belum tutup buku hari ini.</div>
        </div>

        <!-- Pendapatan (calculated) -->
        <div class="form-group">
          <label class="form-label">📈 Pendapatan Hari Ini <span class="badge-auto">Otomatis</span></label>
          <div class="form-readonly pendapatan-display" id="pendapatan-display">
            ${pendapatanHTML}
          </div>
        </div>

        <!-- Kategori -->
        <div class="form-group">
          <label class="form-label" for="inp-kategori">🗂️ Kategori Pengeluaran</label>
          <select id="inp-kategori" class="form-input">
            <option value="">-- Pilih Kategori --</option>
            ${KATEGORI_LIST.map(k => `
              <option value="${k}" ${k === kategori ? 'selected' : ''}>
                ${KATEGORI_ICONS[k] ?? '📌'} ${k}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Catatan -->
        <div class="form-group">
          <label class="form-label" for="inp-catatan">📝 Catatan</label>
          <textarea id="inp-catatan" class="form-input form-textarea" rows="3"
            placeholder="Tambahkan catatan...">${escHtml(catatan)}</textarea>
        </div>

        <!-- Submit — always enabled -->
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

  const saldoInput         = document.getElementById('inp-saldo')         as HTMLInputElement;
  const pengeluaranInput   = document.getElementById('inp-pengeluaran')   as HTMLInputElement;
  const saldoKemarinHidden = document.getElementById('inp-saldo-kemarin') as HTMLInputElement;
  const tanggalInput       = document.getElementById('inp-tanggal')       as HTMLInputElement;
  const pendapatanDisp     = document.getElementById('pendapatan-display') as HTMLElement;
  const saldoKemarinDisp   = document.getElementById('saldo-kemarin-display') as HTMLElement;

  // Update Saldo Kemarin when date changes
  tanggalInput?.addEventListener('change', () => {
    const dateVal = tanggalInput.value;
    const skVal = getLastSaldoHariIni(dateVal);
    saldoKemarinHidden.value = String(skVal);
    saldoKemarinDisp.textContent = formatRupiah(skVal);
    recalculate();
  });

  // Auto-format number inputs and recalculate
  [saldoInput, pengeluaranInput].forEach(inp => {
    inp?.addEventListener('input', () => {
      const raw = inp.value.replace(/\D/g, '');
      const num = parseInt(raw) || 0;
      inp.value = num > 0 ? new Intl.NumberFormat('id-ID').format(num) : '';
      recalculate();
    });
  });

  // Calculator buttons
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

  // Cancel edit
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    window.navigate('riwayat');
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(editId ?? null);
  });

  function recalculate(): void {
    const tanggal = tanggalInput?.value ?? today();
    const sk      = parseLocalNumber(saldoKemarinHidden?.value ?? '0');
    const shi     = parseLocalNumber(saldoInput?.value ?? '0');
    const pe      = parseLocalNumber(pengeluaranInput?.value ?? '0');

    if (!pendapatanDisp) return;

    if (shi === 0) {
      // SHI not yet filled — show waiting indicator
      pendapatanDisp.innerHTML = '<span class="text-muted-sm">Menunggu Saldo Hari Ini</span>';
      pendapatanDisp.classList.remove('negative');
    } else {
      const pendapatan = computePendapatan(shi, sk, pe, tanggal, editId ?? null);
      pendapatanDisp.textContent = formatRupiah(pendapatan);
      pendapatanDisp.classList.toggle('negative', pendapatan < 0);
    }
  }
}

function handleSubmit(editId: string | null): void {
  const tanggal          = (document.getElementById('inp-tanggal')       as HTMLInputElement)?.value;
  const saldoKemarinRaw  = (document.getElementById('inp-saldo-kemarin') as HTMLInputElement)?.value;
  const saldoRaw         = (document.getElementById('inp-saldo')         as HTMLInputElement)?.value ?? '';
  const pengeRaw         = (document.getElementById('inp-pengeluaran')   as HTMLInputElement)?.value ?? '';
  const kategori         = (document.getElementById('inp-kategori')      as HTMLSelectElement)?.value;
  const catatan          = (document.getElementById('inp-catatan')       as HTMLTextAreaElement)?.value ?? '';

  if (!tanggal) {
    showToast('Tanggal harus diisi.', 'error');
    return;
  }

  const saldoKemarin = parseLocalNumber(saldoKemarinRaw ?? '0');
  const saldoHariIni = parseLocalNumber(saldoRaw);
  const pengeluaran  = parseLocalNumber(pengeRaw);

  // At least one of pengeluaran or saldoHariIni must be filled
  if (saldoHariIni === 0 && pengeluaran === 0) {
    showToast('Isi Pengeluaran atau Saldo Hari Ini terlebih dahulu.', 'error');
    return;
  }

  // If SHI is set, guard against duplicate closing entry for this date
  if (saldoHariIni > 0 && hasDayClosingEntry(tanggal, editId ?? undefined)) {
    showToast('Saldo Hari Ini sudah diisi untuk tanggal ini. Silakan edit catatan yang ada.', 'error');
    return;
  }

  // Pendapatan is 0 until saldoHariIni is set
  const pendapatan = saldoHariIni > 0
    ? computePendapatan(saldoHariIni, saldoKemarin, pengeluaran, tanggal, editId)
    : 0;

  // Preserve original createdAt when editing so sort/aggregation order stays stable
  const existingEntry = editId ? getEntryById(editId) : null;

  const entry: SaldoEntry = {
    id:         editId ?? generateId(),
    tanggal,
    saldoKemarin,
    pengeluaran,
    saldoHariIni,
    pendapatan,
    kategori:   kategori || 'Lainnya',
    catatan:    catatan.trim(),
    createdAt:  existingEntry?.createdAt ?? new Date().toISOString(),
  };

  if (editId) {
    updateEntry(entry);
    showToast('Catatan berhasil diperbarui!', 'success');
  } else {
    saveEntry(entry);
    showToast('Catatan berhasil disimpan!', 'success');
  }

  window.navigate('riwayat');
}

/**
 * Compute pendapatan for this entry.
 * Formula: SHI - SK + (other entries' pengeluaran for this date + this entry's pengeluaran)
 */
function computePendapatan(
  shi: number,
  sk: number,
  thisPengeluaran: number,
  tanggal: string,
  editId: string | null,
): number {
  // Sum all pengeluaran for this date except the entry being edited
  const otherPe = getDayTotalPengeluaranExcluding(tanggal, editId ?? undefined);
  const totalPe = otherPe + thisPengeluaran;
  return shi - sk + totalPe;
}

function parseLocalNumber(str: string): number {
  return parseInt(str.replace(/\./g, '').replace(/,/g, '')) || 0;
}

declare global {
  interface Window {
    navigate: (page: string, extra?: string) => void;
  }
}
