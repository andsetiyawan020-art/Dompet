// ============================================================
// Riwayat (History) Page — one card per date
// ============================================================

import {
  getEntries,
  getDayEntries,
  getDaySummary,
  getDaySummariesFromEntries,
  deleteEntry,
  deleteAllDayEntries,
  updateOrSetDaySHI,
  clearDaySHI,
  clearAllData,
  exportDataJSON,
  importDataJSON,
} from '../storage';
import { formatRupiah, formatNumber, formatDateShort, formatDate, showToast, escHtml, truncate } from '../utils';
import { isAndroidExportAvailable, exportJsonViaAndroid } from '../androidExport';
import type { SaldoEntry, DaySummary } from '../types';

let searchQuery  = '';
let filterMonth  = '';

// Tracks which date's detail sheet is open
let currentDetailTanggal: string | null = null;

// ============================================================
// Render
// ============================================================

export function renderRiwayat(): string {
  const allEntries = getEntries();
  const availableMonths = [...new Set(allEntries.map(e => e.tanggal.slice(0, 7)))].sort((a, b) =>
    b.localeCompare(a)
  );

  return `
    <div class="page page-riwayat">
      <div class="page-header">
        <h2 class="page-title">Riwayat</h2>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="search" id="search-input" class="search-input"
            placeholder="Cari catatan atau tanggal..." value="${escHtml(searchQuery)}" autocomplete="off">
        </div>
      </div>

      <!-- Month filter -->
      <div class="filter-row">
        <select id="filter-month" class="filter-select">
          <option value="">Semua Bulan</option>
          ${availableMonths.map(m => {
            const [y, mo] = m.split('-');
            const label = new Date(+y, +mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            return `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>${label}</option>`;
          }).join('')}
        </select>
      </div>

      <!-- Day cards -->
      <div id="riwayat-list" class="riwayat-list">
        ${renderDayList(allEntries)}
      </div>

      <!-- Export / Import -->
      <div class="data-actions">
        <button class="btn-action" id="btn-export">📤 Export JSON</button>
        <label class="btn-action" id="btn-import-label">
          📥 Import JSON
          <input type="file" id="btn-import" accept=".json" style="display:none">
        </label>
        <button class="btn-action btn-danger" id="btn-clear-all">🗑️ Hapus Semua</button>
      </div>
    </div>

    <!-- Detail bottom-sheet overlay -->
    <div id="detail-overlay" class="detail-sheet-overlay" style="display:none"></div>
    <div id="detail-sheet" class="detail-sheet" style="display:none">
      <div class="detail-sheet-header">
        <div class="detail-sheet-date" id="detail-sheet-date">—</div>
        <button class="detail-sheet-close" id="detail-sheet-close" aria-label="Tutup">✕</button>
      </div>
      <div class="detail-sheet-body" id="detail-sheet-body"></div>
    </div>

    <!-- Delete-entry confirm modal -->
    <div id="delete-overlay"  class="modal-overlay" style="display:none"></div>
    <div id="delete-modal"    class="modal"          style="display:none">
      <div class="modal-header">Hapus Transaksi?</div>
      <div class="modal-body">Transaksi ini akan dihapus permanen.</div>
      <div class="modal-footer">
        <button id="delete-cancel"  class="btn-secondary">Batal</button>
        <button id="delete-confirm" class="btn-danger">Hapus</button>
      </div>
    </div>

    <!-- Delete-day confirm modal -->
    <div id="delete-day-overlay"  class="modal-overlay" style="display:none"></div>
    <div id="delete-day-modal"    class="modal"          style="display:none">
      <div class="modal-header">Hapus Hari Ini?</div>
      <div class="modal-body" id="delete-day-modal-body">Semua transaksi pada hari ini akan dihapus permanen.</div>
      <div class="modal-footer">
        <button id="delete-day-cancel"  class="btn-secondary">Batal</button>
        <button id="delete-day-confirm" class="btn-danger">Hapus Semua</button>
      </div>
    </div>
  `;
}

// ---- Day-card list ------------------------------------------

function renderDayList(allEntries: SaldoEntry[]): string {
  let entries = allEntries;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const matchingDates = new Set(
      entries
        .filter(e => e.catatan.toLowerCase().includes(q) || e.tanggal.includes(q))
        .map(e => e.tanggal)
    );
    entries = entries.filter(e => matchingDates.has(e.tanggal));
  }

  if (filterMonth) {
    entries = entries.filter(e => e.tanggal.startsWith(filterMonth));
  }

  if (entries.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">Tidak ada data</div>
        <div class="empty-desc">${allEntries.length === 0 ? 'Belum ada catatan saldo.' : 'Tidak ada hasil pencarian.'}</div>
      </div>`;
  }

  const summaries = getDaySummariesFromEntries(entries);

  return summaries.map(s => renderDayCard(s, entries)).join('');
}

function renderDayCard(s: DaySummary, allEntries: SaldoEntry[]): string {
  const saldoDisplay  = s.hasSaldo ? formatRupiah(s.saldoHariIni) : '—';
  const saldoClass    = s.hasSaldo ? '' : 'text-muted-sm';
  const pendLabel     = s.hasSaldo ? formatRupiah(s.pendapatan) : 'Belum diisi';
  const pendClass     = s.hasSaldo ? (s.pendapatan >= 0 ? 'positive' : 'negative') : 'text-muted-sm';

  // Compact transaction preview (up to 3 catatan labels)
  const dayEntries    = allEntries.filter(e => e.tanggal === s.tanggal);
  const preview = dayEntries
    .filter(e => e.catatan.trim())
    .map(e => escHtml(truncate(e.catatan, 14)))
    .slice(0, 3)
    .join(' &bull; ');
  const txnCount = dayEntries.length;

  return `
  <div class="entry-card" data-tanggal="${s.tanggal}">
    <div class="entry-top">
      <div class="entry-date-wrap">
        <span class="entry-day-icon">📅</span>
        <div>
          <div class="entry-date">${formatDateShort(s.tanggal)}</div>
          <div class="entry-txn-count">${txnCount} transaksi</div>
        </div>
      </div>
      <div class="entry-saldo ${saldoClass}">${saldoDisplay}</div>
    </div>

    <div class="entry-stats">
      <div class="entry-stat">
        <div class="entry-stat-label">Kemarin</div>
        <div class="entry-stat-val">${formatRupiah(s.saldoKemarin)}</div>
      </div>
      <div class="entry-stat">
        <div class="entry-stat-label">Pendapatan</div>
        <div class="entry-stat-val ${pendClass}">${pendLabel}</div>
      </div>
      <div class="entry-stat">
        <div class="entry-stat-label">Pengeluaran</div>
        <div class="entry-stat-val negative">${formatRupiah(s.totalPengeluaran)}</div>
      </div>
    </div>

    ${preview ? `<div class="entry-catatan">• ${preview}</div>` : ''}

    <div class="entry-actions">
      <button class="btn-edit"   data-tanggal="${s.tanggal}">🔍 Detail &amp; Edit</button>
      <button class="btn-delete" data-tanggal="${s.tanggal}">🗑️ Hapus</button>
    </div>
  </div>`;
}

// ---- Detail sheet body --------------------------------------

function renderDetailBody(tanggal: string): string {
  const entries = getDayEntries(tanggal); // sorted desc by createdAt
  const summary = getDaySummary(tanggal);
  const shiVal  = summary.saldoHariIni > 0 ? formatNumber(summary.saldoHariIni) : '';
  const pendStr = summary.hasSaldo
    ? `<span class="${summary.pendapatan >= 0 ? 'positive' : 'negative'}">${formatRupiah(summary.pendapatan)}</span>`
    : '<span class="text-muted-sm">Belum diisi</span>';

  const txnRows = entries.length === 0
    ? '<div class="empty-small">Tidak ada transaksi</div>'
    : entries.map(e => `
      <div class="txn-row" data-id="${e.id}">
        <div class="txn-info">
          <span class="txn-catatan">${escHtml(e.catatan || '(tanpa catatan)')}</span>
          <span class="txn-amount negative">${formatRupiah(e.pengeluaran)}</span>
        </div>
        <div class="txn-actions">
          <button class="txn-btn-edit"   data-id="${e.id}" title="Edit">✏️</button>
          <button class="txn-btn-delete" data-id="${e.id}" title="Hapus">🗑️</button>
        </div>
      </div>`).join('');

  return `
    <div class="detail-section">
      <div class="detail-section-title">📋 Transaksi</div>
      <div class="txn-list">${txnRows}</div>
    </div>

    <div class="detail-total-row">
      <span class="detail-total-label">Total Pengeluaran</span>
      <span class="detail-total-val negative">${formatRupiah(summary.totalPengeluaran)}</span>
    </div>

    <div class="detail-section detail-shi-section">
      <div class="detail-section-title">💳 Saldo Hari Ini</div>
      <div class="shi-row">
        <input type="text" id="shi-edit-input" class="form-input" inputmode="numeric"
          placeholder="Belum diisi" value="${shiVal}" autocomplete="off">
        <button id="shi-save-btn" class="btn-primary shi-save-btn">Simpan</button>
        ${summary.hasSaldo ? `<button id="shi-clear-btn" class="btn-secondary shi-clear-btn" title="Hapus SHI">✕</button>` : ''}
      </div>
    </div>

    <div class="detail-pendapatan-row">
      <span class="detail-total-label">Pendapatan</span>
      <span id="detail-pendapatan-val">${pendStr}</span>
    </div>

    <div class="detail-sheet-footer">
      <button id="detail-add-btn"   class="btn-secondary">➕ Tambah Pengeluaran</button>
      <button id="detail-hapus-btn" class="btn-danger">🗑️ Hapus Hari</button>
    </div>`;
}

// ============================================================
// Init
// ============================================================

export function initRiwayat(): void {
  const list = document.getElementById('riwayat-list');

  function rerender(): void {
    if (list) list.innerHTML = renderDayList(getEntries());
    attachDayCardHandlers();
  }

  // Search
  document.getElementById('search-input')?.addEventListener('input', e => {
    searchQuery = (e.target as HTMLInputElement).value;
    rerender();
  });

  // Month filter
  document.getElementById('filter-month')?.addEventListener('change', e => {
    filterMonth = (e.target as HTMLSelectElement).value;
    rerender();
  });

  // Export
  document.getElementById('btn-export')?.addEventListener('click', handleExport);

  // Import
  document.getElementById('btn-import')?.addEventListener('change', handleImport);

  // Clear all
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (confirm('Hapus SEMUA data? Aksi ini tidak bisa dibatalkan.')) {
      clearAllData();
      searchQuery = '';
      filterMonth = '';
      rerender();
      showToast('Semua data dihapus.', 'info');
    }
  });

  attachDayCardHandlers();
  initDetailSheet(rerender);
  initDeleteModals(rerender);
}

// ---- Day card click handlers --------------------------------

function attachDayCardHandlers(): void {
  document.querySelectorAll<HTMLElement>('.btn-edit[data-tanggal]').forEach(btn => {
    btn.addEventListener('click', () => openDetailSheet(btn.dataset.tanggal!));
  });

  document.querySelectorAll<HTMLElement>('.btn-delete[data-tanggal]').forEach(btn => {
    btn.addEventListener('click', () => openDeleteDayModal(btn.dataset.tanggal!));
  });
}

// ---- Detail bottom sheet ------------------------------------

function initDetailSheet(rerenderList: () => void): void {
  const overlay = document.getElementById('detail-overlay')!;
  const sheet   = document.getElementById('detail-sheet')!;

  function close(): void {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
    setTimeout(() => {
      overlay.style.display = 'none';
      sheet.style.display   = 'none';
      currentDetailTanggal  = null;
    }, 280);
  }

  document.getElementById('detail-sheet-close')?.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // Single delegated listener on the sheet — covers all dynamic children
  sheet.addEventListener('click', (e) => {
    handleDetailBodyClick(e as MouseEvent, close, rerenderList);
  });
}

function handleDetailBodyClick(
  e: MouseEvent,
  close: () => void,
  rerenderList: () => void,
): void {
  const target = e.target as HTMLElement;
  const tanggal = currentDetailTanggal;
  if (!tanggal) return;

  // ✏️ Edit individual transaction
  if (target.closest('.txn-btn-edit')) {
    const id = (target.closest('.txn-btn-edit') as HTMLElement).dataset.id!;
    close();
    window.navigate('tambah', id);
    return;
  }

  // 🗑️ Delete individual transaction
  if (target.closest('.txn-btn-delete')) {
    const id = (target.closest('.txn-btn-delete') as HTMLElement).dataset.id!;
    if (confirm('Hapus transaksi ini?')) {
      deleteEntry(id);
      showToast('Transaksi dihapus.', 'info');
      // Refresh detail body in place
      const body = document.getElementById('detail-sheet-body');
      const dateEl = document.getElementById('detail-sheet-date');
      const dayEntries = getDayEntries(tanggal);
      if (dayEntries.length === 0) {
        close();
        rerenderList();
      } else {
        if (body) body.innerHTML = renderDetailBody(tanggal);
        if (dateEl) dateEl.textContent = formatDate(tanggal);
        rerenderList();
      }
    }
    return;
  }

  // 💳 Save SHI
  if (target.id === 'shi-save-btn') {
    const inp = document.getElementById('shi-edit-input') as HTMLInputElement;
    const val = parseInt(inp.value.replace(/\D/g, '')) || 0;
    if (val > 0) {
      updateOrSetDaySHI(tanggal, val);
      showToast('Saldo Hari Ini disimpan!', 'success');
    } else {
      clearDaySHI(tanggal);
      showToast('Saldo Hari Ini dihapus.', 'info');
    }
    const body = document.getElementById('detail-sheet-body');
    if (body) body.innerHTML = renderDetailBody(tanggal);
    rerenderList();
    return;
  }

  // ✕ Clear SHI
  if (target.id === 'shi-clear-btn') {
    clearDaySHI(tanggal);
    showToast('Saldo Hari Ini dihapus.', 'info');
    const body = document.getElementById('detail-sheet-body');
    if (body) body.innerHTML = renderDetailBody(tanggal);
    rerenderList();
    return;
  }

  // ➕ Add transaction for this date
  if (target.id === 'detail-add-btn') {
    close();
    window.navigate('tambah', tanggal);
    return;
  }

  // 🗑️ Delete whole day
  if (target.id === 'detail-hapus-btn') {
    openDeleteDayModal(tanggal, () => close());
    return;
  }
}

function openDetailSheet(tanggal: string): void {
  currentDetailTanggal = tanggal;
  const overlay = document.getElementById('detail-overlay')!;
  const sheet   = document.getElementById('detail-sheet')!;
  const dateEl  = document.getElementById('detail-sheet-date')!;
  const body    = document.getElementById('detail-sheet-body')!;

  dateEl.textContent = formatDate(tanggal);
  body.innerHTML     = renderDetailBody(tanggal);

  overlay.style.display = 'block';
  sheet.style.display   = 'block';

  // Format SHI input on open
  const shiInp = document.getElementById('shi-edit-input') as HTMLInputElement | null;
  if (shiInp) {
    shiInp.addEventListener('input', () => {
      const num = parseInt(shiInp.value.replace(/\D/g, '')) || 0;
      shiInp.value = num > 0 ? new Intl.NumberFormat('id-ID').format(num) : '';
    });
  }

  requestAnimationFrame(() => {
    overlay.classList.add('open');
    sheet.classList.add('open');
  });
}

// ---- Delete day modal ---------------------------------------

let pendingDeleteDayTanggal: string | null = null;
let pendingDeleteDayCallback: (() => void) | null = null;

function openDeleteDayModal(tanggal: string, onDeleted?: () => void): void {
  pendingDeleteDayTanggal  = tanggal;
  pendingDeleteDayCallback = onDeleted ?? null;
  const overlay = document.getElementById('delete-day-overlay')!;
  const modal   = document.getElementById('delete-day-modal')!;
  const bodyEl  = document.getElementById('delete-day-modal-body')!;
  bodyEl.textContent = `Semua transaksi pada ${formatDateShort(tanggal)} akan dihapus permanen.`;
  overlay.style.display = 'block';
  modal.style.display   = 'block';
  requestAnimationFrame(() => { overlay.classList.add('open'); modal.classList.add('open'); });
}

function closeDeleteDayModal(): void {
  const overlay = document.getElementById('delete-day-overlay')!;
  const modal   = document.getElementById('delete-day-modal')!;
  overlay.classList.remove('open');
  modal.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; modal.style.display = 'none'; }, 200);
  pendingDeleteDayTanggal = null;
}

// ---- Delete entry modal -------------------------------------

let pendingDeleteId: string | null = null;

function initDeleteModals(rerenderList: () => void): void {
  // Entry delete modal
  document.getElementById('delete-cancel')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-overlay')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm')?.addEventListener('click', () => {
    if (pendingDeleteId) {
      deleteEntry(pendingDeleteId);
      closeDeleteModal();
      rerenderList();
      showToast('Catatan dihapus.', 'info');
    }
  });

  // Day delete modal
  document.getElementById('delete-day-cancel')?.addEventListener('click', closeDeleteDayModal);
  document.getElementById('delete-day-overlay')?.addEventListener('click', closeDeleteDayModal);
  document.getElementById('delete-day-confirm')?.addEventListener('click', () => {
    if (pendingDeleteDayTanggal) {
      deleteAllDayEntries(pendingDeleteDayTanggal);
      pendingDeleteDayCallback?.();
      closeDeleteDayModal();
      rerenderList();
      showToast('Semua transaksi hari ini dihapus.', 'info');
    }
  });
}

function closeDeleteModal(): void {
  const overlay = document.getElementById('delete-overlay')!;
  const modal   = document.getElementById('delete-modal')!;
  overlay.classList.remove('open');
  modal.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; modal.style.display = 'none'; }, 200);
  pendingDeleteId = null;
}

// ============================================================
// Export / Import
// ============================================================

async function handleExport(): Promise<void> {
  const json     = exportDataJSON();
  const dateStr  = new Date().toISOString().slice(0, 10);
  const filename = `SaldoTracker-${dateStr}.json`;

  // Android WebView: use the native "Save to..." dialog (Storage Access
  // Framework) so the user picks the destination themselves. No Share
  // Intent, no auto-save to /Downloads.
  if (isAndroidExportAvailable()) {
    const result = await exportJsonViaAndroid(json, filename);
    if (result.ok) {
      showToast(result.message || 'Backup berhasil disimpan.', 'success');
    } else if (!result.cancelled) {
      showToast(result.message || 'Gagal menyimpan backup.', 'error');
    }
    return;
  }

  if ('showSaveFilePicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fh = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = await (fh as any).createWritable();
      await w.write(json);
      await w.close();
      showToast('Backup berhasil disimpan.', 'success');
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup berhasil disimpan.', 'success');
}

function handleImport(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = importDataJSON(reader.result as string);
    if (result.ok) {
      showToast(result.message, 'success');
      window.navigate('riwayat');
    } else {
      showToast(result.message, 'error');
    }
  };
  reader.readAsText(file);
  (e.target as HTMLInputElement).value = '';
}
