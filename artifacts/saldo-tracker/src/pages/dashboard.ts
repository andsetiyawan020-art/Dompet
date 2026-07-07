// ============================================================
// Dashboard Page
// ============================================================

import { getEntries, getDaySummary, getDaySummariesFromEntries } from '../storage';
import { formatRupiah, formatDate, today, escHtml } from '../utils';
import type { DaySummary } from '../types';

export function renderDashboard(): string {
  const allEntries = getEntries();
  const todayStr   = today();

  const todaySummary   = getDaySummary(todayStr);
  const todayHasData   = allEntries.some(e => e.tanggal === todayStr);
  const recentSummaries = getDaySummariesFromEntries(allEntries);
  const displayed: DaySummary | null = todayHasData ? todaySummary : (recentSummaries[0] ?? null);

  const saldoKemarin     = displayed?.saldoKemarin     ?? 0;
  const totalPengeluaran = displayed?.totalPengeluaran ?? 0;
  const pendapatan       = displayed?.pendapatan       ?? 0;
  const saldoHariIni     = displayed?.saldoHariIni     ?? 0;
  const hasSaldo         = displayed?.hasSaldo         ?? false;
  const isToday          = displayed?.tanggal === todayStr;
  const tanggalLabel     = displayed
    ? (isToday ? 'Hari Ini' : formatDate(displayed.tanggal))
    : '—';

  const saldoDisplay = hasSaldo
    ? formatRupiah(saldoHariIni)
    : '<span style="font-size:18px;opacity:.8">Belum diisi</span>';

  const pendapatanDisplay = hasSaldo ? formatRupiah(pendapatan) : '—';

  const selisihSaldo  = hasSaldo ? saldoHariIni - saldoKemarin : null;
  const selisihClass  = selisihSaldo === null ? '' : selisihSaldo > 0 ? 'positive' : selisihSaldo < 0 ? 'negative' : '';
  const selisihPrefix = selisihSaldo === null ? '' : selisihSaldo > 0 ? '+' : '';
  const selisihDisplay = selisihSaldo === null
    ? '—'
    : `<span class="${selisihClass}">${selisihPrefix}${formatRupiah(selisihSaldo)}</span>`;

  return `
    <div class="page page-dashboard">
      <div class="dashboard-hero">
        <div class="hero-label">SALDO HARI INI</div>
        <div class="hero-amount">${saldoDisplay}</div>
        <div class="hero-date">${tanggalLabel}</div>
      </div>

      <div class="stat-cards">
        <div class="stat-card stat-card--blue" role="button" onclick="window.navigate('detail','saldo-kemarin')">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-label">Saldo Kemarin</div>
            <div class="stat-value">${formatRupiah(saldoKemarin)}</div>
          </div>
        </div>
        <div class="stat-card stat-card--green" role="button" onclick="window.navigate('detail','pendapatan')">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <div class="stat-label">Pendapatan Hari Ini</div>
            <div class="stat-value">${pendapatanDisplay}</div>
          </div>
        </div>
        <div class="stat-card stat-card--red" role="button" onclick="window.navigate('detail','pengeluaran')">
          <div class="stat-icon">📉</div>
          <div class="stat-info">
            <div class="stat-label">Pengeluaran Hari Ini</div>
            <div class="stat-value">${formatRupiah(totalPengeluaran)}</div>
          </div>
        </div>
        <div class="stat-card stat-card--purple" role="button" onclick="window.navigate('detail','selisih')">
          <div class="stat-icon">💳</div>
          <div class="stat-info">
            <div class="stat-label">Selisih Saldo</div>
            <div class="stat-value">${selisihDisplay}</div>
          </div>
        </div>
      </div>

      ${recentSummaries.length === 0 ? renderEmptyState() : renderRecentList(recentSummaries.slice(0, 5))}

      <div class="dashboard-formula-hint">
        <div class="formula-card">
          <div class="formula-title">📊 Rumus Otomatis</div>
          <div class="formula-row">
            <span>Selisih Saldo</span>
            <span>= Saldo Hari Ini − Saldo Kemarin</span>
          </div>
          <div class="formula-row highlight">
            <span>Pendapatan</span>
            <span>= Saldo Hari Ini − Saldo Kemarin + Pengeluaran</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEmptyState(): string {
  return `
    <div class="empty-state">
      <div class="empty-icon">📒</div>
      <div class="empty-title">Belum ada catatan</div>
      <div class="empty-desc">Mulai catat saldo harian kamu!</div>
      <button class="btn-primary" onclick="window.navigate('tambah')">+ Tambah Catatan</button>
    </div>
  `;
}

function renderRecentList(summaries: DaySummary[]): string {
  const rows = summaries.map(s => {
    const saldoStr  = s.hasSaldo ? formatRupiah(s.saldoHariIni) : '—';
    const pendSign  = s.pendapatan >= 0 ? '▲' : '▼';
    const pendClass = s.pendapatan >= 0 ? 'positive' : 'negative';
    const pendStr   = s.hasSaldo
      ? `${pendSign} ${formatRupiah(Math.abs(s.pendapatan))}`
      : 'Belum diisi';
    const expStr = escHtml(`Pengeluaran: ${formatRupiah(s.totalPengeluaran)}`);

    return `
    <div class="recent-item" onclick="window.navigate('riwayat')">
      <div class="recent-left">
        <div class="recent-date">${formatDate(s.tanggal)}</div>
        <div class="recent-kategori">${expStr}</div>
      </div>
      <div class="recent-right">
        <div class="recent-saldo">${saldoStr}</div>
        <div class="recent-pendapatan ${s.hasSaldo ? pendClass : 'text-muted-sm'}">
          ${pendStr}
        </div>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="recent-section">
      <div class="section-header">
        <span class="section-title">Transaksi Terkini</span>
        <button class="btn-link" onclick="window.navigate('riwayat')">Lihat Semua</button>
      </div>
      <div class="recent-list">${rows}</div>
    </div>
  `;
}

export function initDashboard(): void {
  // No specific init needed; event handlers are inline
}
