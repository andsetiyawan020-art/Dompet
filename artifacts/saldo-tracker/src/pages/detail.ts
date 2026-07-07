// ============================================================
// Rincian Dashboard — Detail views for each dashboard stat card
// ============================================================

import { getEntries, getDaySummariesFromEntries, getDayEntries } from '../storage';
import { formatRupiah, formatDate, escHtml } from '../utils';
import type { DaySummary } from '../types';

export type DetailView = 'saldo-kemarin' | 'pendapatan' | 'pengeluaran' | 'selisih';

let activeView:  DetailView = 'saldo-kemarin';
let prevView:    DetailView = 'saldo-kemarin';
let searchDate   = '';
let filterMonth  = '';
let filterYear   = '';

const VIEW_TITLES: Record<DetailView, string> = {
  'saldo-kemarin': 'Saldo Kemarin',
  'pendapatan':    'Pendapatan Harian',
  'pengeluaran':   'Pengeluaran Harian',
  'selisih':       'Selisih Saldo',
};

const VIEW_ICONS: Record<DetailView, string> = {
  'saldo-kemarin': '💰',
  'pendapatan':    '📈',
  'pengeluaran':   '📉',
  'selisih':       '💳',
};

function isDetailView(v: string): v is DetailView {
  return ['saldo-kemarin', 'pendapatan', 'pengeluaran', 'selisih'].includes(v);
}

// ---- Render -------------------------------------------------

export function renderDetail(view?: string | null): string {
  if (view && isDetailView(view)) {
    // Reset filters when navigating to a different view
    if (view !== prevView) {
      searchDate  = '';
      filterMonth = '';
      filterYear  = '';
      prevView    = view;
    }
    activeView = view;
  }

  const allEntries  = getEntries();
  const allSummaries = getDaySummariesFromEntries(allEntries);

  const allMonths = [...new Set(allEntries.map(e => e.tanggal.slice(0, 7)))].sort((a, b) =>
    b.localeCompare(a)
  );
  const allYears = [...new Set(allEntries.map(e => e.tanggal.slice(0, 4)))].sort((a, b) =>
    b.localeCompare(a)
  );

  return `
    <div class="page page-detail">
      <div class="detail-page-header">
        <button class="btn-back" onclick="window.navigate('dashboard')" aria-label="Kembali ke Dashboard">
          ←
        </button>
        <div class="detail-page-title">
          <span class="detail-page-icon">${VIEW_ICONS[activeView]}</span>
          <h2 class="page-title">${VIEW_TITLES[activeView]}</h2>
        </div>
      </div>

      <!-- Search by date -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="search" id="detail-search" class="search-input"
            placeholder="Cari tanggal (cth: 2026-07-07)…"
            value="${escHtml(searchDate)}" autocomplete="off">
        </div>
      </div>

      <!-- Month + Year filters -->
      <div class="filter-row">
        <select id="detail-filter-month" class="filter-select">
          <option value="">Semua Bulan</option>
          ${allMonths.map(m => {
            const [y, mo] = m.split('-');
            const label = new Date(+y, +mo - 1, 1).toLocaleDateString('id-ID', {
              month: 'long', year: 'numeric',
            });
            return `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>${label}</option>`;
          }).join('')}
        </select>
        <select id="detail-filter-year" class="filter-select">
          <option value="">Semua Tahun</option>
          ${allYears.map(y =>
            `<option value="${y}" ${y === filterYear ? 'selected' : ''}>${y}</option>`
          ).join('')}
        </select>
      </div>

      <!-- List -->
      <div id="detail-list" class="detail-list">
        ${renderDetailList(allSummaries)}
      </div>
    </div>
  `;
}

function applyFilters(summaries: DaySummary[]): DaySummary[] {
  let result = summaries;
  if (searchDate)  result = result.filter(s => s.tanggal.includes(searchDate.trim()));
  if (filterMonth) result = result.filter(s => s.tanggal.startsWith(filterMonth));
  if (filterYear)  result = result.filter(s => s.tanggal.startsWith(filterYear));
  return result;
}

function renderDetailList(summaries: DaySummary[]): string {
  const filtered = applyFilters(summaries);

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">Tidak ada data</div>
        <div class="empty-desc">
          ${summaries.length === 0
            ? 'Belum ada catatan saldo.'
            : 'Tidak ada hasil untuk filter yang dipilih.'}
        </div>
      </div>
    `;
  }

  switch (activeView) {
    case 'saldo-kemarin': return renderSaldoKemarin(filtered);
    case 'pendapatan':    return renderPendapatan(filtered);
    case 'pengeluaran':   return renderPengeluaran(filtered);
    case 'selisih':       return renderSelisih(filtered);
  }
}

// ---- View renderers -----------------------------------------

function renderSaldoKemarin(summaries: DaySummary[]): string {
  return summaries.map(s => `
    <div class="detail-card">
      <div class="detail-card-row">
        <span class="detail-date">${formatDate(s.tanggal)}</span>
        <span class="detail-main-val">${formatRupiah(s.saldoKemarin)}</span>
      </div>
    </div>
  `).join('');
}

function renderPendapatan(summaries: DaySummary[]): string {
  return summaries.map(s => {
    const pendStr   = s.hasSaldo ? formatRupiah(s.pendapatan) : '—';
    const pendClass = s.hasSaldo
      ? (s.pendapatan > 0 ? 'positive' : s.pendapatan < 0 ? 'negative' : '')
      : 'text-muted-sm';

    return `
      <div class="detail-card">
        <div class="detail-card-row">
          <span class="detail-date">${formatDate(s.tanggal)}</span>
          <span class="detail-main-val ${pendClass}">${pendStr}</span>
        </div>
        <div class="detail-meta">
          <div class="detail-meta-row">
            <span class="detail-meta-label">Saldo Kemarin</span>
            <span class="detail-meta-val">${formatRupiah(s.saldoKemarin)}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-label">Saldo Hari Ini</span>
            <span class="detail-meta-val">${s.hasSaldo ? formatRupiah(s.saldoHariIni) : '—'}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-label">Pengeluaran</span>
            <span class="detail-meta-val">${formatRupiah(s.totalPengeluaran)}</span>
          </div>
        </div>
        <div class="detail-formula">
          Pendapatan = SHI ${s.hasSaldo ? formatRupiah(s.saldoHariIni) : '?'} − SK ${formatRupiah(s.saldoKemarin)} + PE ${formatRupiah(s.totalPengeluaran)}
        </div>
      </div>
    `;
  }).join('');
}

function renderPengeluaran(summaries: DaySummary[]): string {
  return summaries.map(s => {
    const dayEntries = getDayEntries(s.tanggal);
    const items = dayEntries.map(e => `
      <div class="detail-sub-item">
        <span class="detail-sub-label">• ${escHtml(e.catatan ? e.catatan : e.kategori)}</span>
        <span class="detail-sub-val negative">${formatRupiah(e.pengeluaran)}</span>
      </div>
    `).join('');

    return `
      <div class="detail-card">
        <div class="detail-card-row">
          <span class="detail-date">${formatDate(s.tanggal)}</span>
          <span class="detail-main-val negative">${formatRupiah(s.totalPengeluaran)}</span>
        </div>
        <div class="detail-total-label">Total Pengeluaran: <strong>${formatRupiah(s.totalPengeluaran)}</strong></div>
        ${items}
      </div>
    `;
  }).join('');
}

function renderSelisih(summaries: DaySummary[]): string {
  return summaries.map(s => {
    const selisih = s.hasSaldo ? s.saldoHariIni - s.saldoKemarin : null;
    const selisihClass  = selisih === null ? '' : selisih > 0 ? 'positive' : selisih < 0 ? 'negative' : '';
    const selisihPrefix = selisih !== null && selisih > 0 ? '+' : '';
    const selisihStr    = selisih === null
      ? '<span class="text-muted-sm">Menunggu SHI</span>'
      : `<span class="${selisihClass}">${selisihPrefix}${formatRupiah(selisih)}</span>`;

    return `
      <div class="detail-card">
        <div class="detail-card-row">
          <span class="detail-date">${formatDate(s.tanggal)}</span>
          <span class="detail-main-val">${selisihStr}</span>
        </div>
        <div class="detail-meta">
          <div class="detail-meta-row">
            <span class="detail-meta-label">Saldo Kemarin</span>
            <span class="detail-meta-val">${formatRupiah(s.saldoKemarin)}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-meta-label">Saldo Hari Ini</span>
            <span class="detail-meta-val">${s.hasSaldo ? formatRupiah(s.saldoHariIni) : '—'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Init ---------------------------------------------------

export function initDetail(): void {
  const allEntries  = getEntries();
  const allSummaries = getDaySummariesFromEntries(allEntries);
  const list = document.getElementById('detail-list');

  function rerender(): void {
    if (list) list.innerHTML = renderDetailList(allSummaries);
  }

  document.getElementById('detail-search')?.addEventListener('input', (e) => {
    searchDate  = (e.target as HTMLInputElement).value;
    filterMonth = '';
    filterYear  = '';
    const ms = document.getElementById('detail-filter-month') as HTMLSelectElement | null;
    const ys = document.getElementById('detail-filter-year')  as HTMLSelectElement | null;
    if (ms) ms.value = '';
    if (ys) ys.value = '';
    rerender();
  });

  document.getElementById('detail-filter-month')?.addEventListener('change', (e) => {
    filterMonth = (e.target as HTMLSelectElement).value;
    filterYear  = '';
    searchDate  = '';
    const si = document.getElementById('detail-search')       as HTMLInputElement  | null;
    const ys = document.getElementById('detail-filter-year')  as HTMLSelectElement | null;
    if (si) si.value = '';
    if (ys) ys.value = '';
    rerender();
  });

  document.getElementById('detail-filter-year')?.addEventListener('change', (e) => {
    filterYear  = (e.target as HTMLSelectElement).value;
    filterMonth = '';
    searchDate  = '';
    const si = document.getElementById('detail-search')        as HTMLInputElement  | null;
    const ms = document.getElementById('detail-filter-month')  as HTMLSelectElement | null;
    if (si) si.value = '';
    if (ms) ms.value = '';
    rerender();
  });
}
