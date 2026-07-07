// ============================================================
// Riwayat (History) Page
// ============================================================

import { getEntries, deleteEntry } from '../storage';
import { formatRupiah, formatDateShort, showToast, escHtml } from '../utils';
import { KATEGORI_LIST, KATEGORI_ICONS } from '../types';
import type { SaldoEntry } from '../types';

let searchQuery   = '';
let filterKategori = '';
let filterMonth   = '';

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

      <!-- Search & Filter -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="search" id="search-input" class="search-input"
            placeholder="Cari catatan..." value="${escHtml(searchQuery)}" autocomplete="off">
        </div>
      </div>

      <div class="filter-row">
        <select id="filter-kategori" class="filter-select">
          <option value="">Semua Kategori</option>
          ${KATEGORI_LIST.map(k => `
            <option value="${k}" ${k === filterKategori ? 'selected' : ''}>${KATEGORI_ICONS[k]} ${k}</option>
          `).join('')}
        </select>
        <select id="filter-month" class="filter-select">
          <option value="">Semua Bulan</option>
          ${availableMonths.map(m => {
            const [y, mo] = m.split('-');
            const label = new Date(+y, +mo - 1, 1).toLocaleDateString('id-ID', {
              month: 'long',
              year: 'numeric',
            });
            return `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>${label}</option>`;
          }).join('')}
        </select>
      </div>

      <!-- Entry List -->
      <div id="riwayat-list" class="riwayat-list">
        ${renderEntryList(allEntries)}
      </div>

      <!-- Export / Import Actions -->
      <div class="data-actions">
        <button class="btn-action" id="btn-export">📤 Export JSON</button>
        <label class="btn-action" id="btn-import-label">
          📥 Import JSON
          <input type="file" id="btn-import" accept=".json" style="display:none">
        </label>
        <button class="btn-action btn-danger" id="btn-clear-all">🗑️ Hapus Semua</button>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div id="delete-overlay" class="modal-overlay" style="display:none"></div>
    <div id="delete-modal" class="modal" style="display:none">
      <div class="modal-header">Hapus Catatan?</div>
      <div class="modal-body">Catatan ini akan dihapus permanen.</div>
      <div class="modal-footer">
        <button id="delete-cancel" class="btn-secondary">Batal</button>
        <button id="delete-confirm" class="btn-danger">Hapus</button>
      </div>
    </div>
  `;
}

function renderEntryList(entries: SaldoEntry[]): string {
  let filtered = entries;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e =>
      e.catatan.toLowerCase().includes(q) ||
      e.kategori.toLowerCase().includes(q) ||
      e.tanggal.includes(q)
    );
  }

  if (filterKategori) {
    filtered = filtered.filter(e => e.kategori === filterKategori);
  }

  if (filterMonth) {
    filtered = filtered.filter(e => e.tanggal.startsWith(filterMonth));
  }

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">Tidak ada data</div>
        <div class="empty-desc">${entries.length === 0 ? 'Belum ada catatan saldo.' : 'Tidak ada hasil pencarian.'}</div>
      </div>
    `;
  }

  return filtered.map(e => {
    // saldoHariIni = 0 means "not yet set"
    const hasSaldo      = e.saldoHariIni > 0;
    const saldoDisplay  = hasSaldo ? formatRupiah(e.saldoHariIni) : '—';
    const pendLabel     = hasSaldo ? formatRupiah(e.pendapatan) : 'Menunggu SHI';
    const pendClass     = hasSaldo ? (e.pendapatan >= 0 ? 'positive' : 'negative') : 'text-muted-sm';

    return `
    <div class="entry-card" data-id="${e.id}">
      <div class="entry-top">
        <div class="entry-date-wrap">
          <span class="entry-kategori-icon">${KATEGORI_ICONS[e.kategori] ?? '📌'}</span>
          <div>
            <div class="entry-date">${formatDateShort(e.tanggal)}</div>
            <div class="entry-kategori">${escHtml(e.kategori)}</div>
          </div>
        </div>
        <div class="entry-saldo">${saldoDisplay}</div>
      </div>

      <div class="entry-stats">
        <div class="entry-stat">
          <div class="entry-stat-label">Kemarin</div>
          <div class="entry-stat-val">${formatRupiah(e.saldoKemarin)}</div>
        </div>
        <div class="entry-stat">
          <div class="entry-stat-label">Pendapatan</div>
          <div class="entry-stat-val ${pendClass}">${pendLabel}</div>
        </div>
        <div class="entry-stat">
          <div class="entry-stat-label">Pengeluaran</div>
          <div class="entry-stat-val negative">${formatRupiah(e.pengeluaran)}</div>
        </div>
      </div>

      ${e.catatan ? `<div class="entry-catatan">📝 ${escHtml(e.catatan)}</div>` : ''}

      <div class="entry-actions">
        <button class="btn-edit" data-id="${e.id}">✏️ Edit</button>
        <button class="btn-delete" data-id="${e.id}">🗑️ Hapus</button>
      </div>
    </div>
  `;
  }).join('');
}

export function initRiwayat(): void {
  const list = document.getElementById('riwayat-list');

  function rerender(): void {
    if (list) list.innerHTML = renderEntryList(getEntries());
    attachEntryHandlers();
  }

  // Search
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    rerender();
  });

  // Filter kategori
  document.getElementById('filter-kategori')?.addEventListener('change', (e) => {
    filterKategori = (e.target as HTMLSelectElement).value;
    rerender();
  });

  // Filter month
  document.getElementById('filter-month')?.addEventListener('change', (e) => {
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
      import('../storage').then(({ clearAllData }) => {
        clearAllData();
        searchQuery    = '';
        filterKategori = '';
        filterMonth    = '';
        rerender();
        showToast('Semua data dihapus.', 'info');
      });
    }
  });

  attachEntryHandlers();

  // Delete modal
  let pendingDeleteId: string | null = null;
  document.getElementById('delete-cancel')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-overlay')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm')?.addEventListener('click', () => {
    if (pendingDeleteId) {
      deleteEntry(pendingDeleteId);
      closeDeleteModal();
      rerender();
      showToast('Catatan dihapus.', 'info');
    }
  });

  function openDeleteModal(id: string): void {
    pendingDeleteId = id;
    const overlay = document.getElementById('delete-overlay');
    const modal   = document.getElementById('delete-modal');
    if (overlay) overlay.style.display = 'block';
    if (modal)   modal.style.display   = 'block';
    setTimeout(() => {
      overlay?.classList.add('open');
      modal?.classList.add('open');
    }, 10);
  }

  function closeDeleteModal(): void {
    const overlay = document.getElementById('delete-overlay');
    const modal   = document.getElementById('delete-modal');
    overlay?.classList.remove('open');
    modal?.classList.remove('open');
    setTimeout(() => {
      if (overlay) overlay.style.display = 'none';
      if (modal)   modal.style.display   = 'none';
    }, 200);
    pendingDeleteId = null;
  }

  function attachEntryHandlers(): void {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        window.navigate('tambah', id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        openDeleteModal(id);
      });
    });
  }
}

// ---- Export -------------------------------------------------

async function handleExport(): Promise<void> {
  const { exportDataJSON } = await import('../storage');
  const json = exportDataJSON();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `SaldoTracker-${dateStr}.json`;

  // Try File System Access API (modern browsers & some Android WebViews)
  if ('showSaveFilePicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const writable = await (fileHandle as any).createWritable();
      await writable.write(json);
      await writable.close();
      showToast('Backup berhasil disimpan.', 'success');
      return;
    } catch (err: unknown) {
      // User cancelled the dialog — do nothing
      if (err instanceof Error && err.name === 'AbortError') return;
      // Other error — fall through to download fallback
    }
  }

  // Fallback: standard <a download> (works on all platforms including Android WebView)
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup berhasil disimpan.', 'success');
}

// ---- Import -------------------------------------------------

function handleImport(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    import('../storage').then(({ importDataJSON }) => {
      const result = importDataJSON(reader.result as string);
      if (result.ok) {
        showToast(result.message, 'success');
        window.navigate('riwayat');
      } else {
        showToast(result.message, 'error');
      }
    });
  };
  reader.readAsText(file);
  // Reset so the same file can be re-imported if needed
  (e.target as HTMLInputElement).value = '';
}
