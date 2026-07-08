// ============================================================
// SPA Router & App Shell
// ============================================================

import type { PageName } from './types';
import { renderDashboard, initDashboard }   from './pages/dashboard';
import { renderTambah,    initTambah }      from './pages/tambah';
import { renderRiwayat,   initRiwayat }     from './pages/riwayat';
import { renderDetail,    initDetail }      from './pages/detail';
import { getCalculatorHTML, initCalculator } from './calculator';
import { getSettings, saveSettings }        from './storage';

let currentPage: PageName = 'dashboard';
let editingId: string | null = null;

const NAV_ITEMS: { page: PageName; icon: string; label: string }[] = [
  { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { page: 'tambah',    icon: '➕', label: 'Tambah'    },
  { page: 'riwayat',  icon: '📋', label: 'Riwayat'   },
];

export function initApp(): void {
  applyTheme();

  // Inject the overlay structure (toast, calculator, bottom-nav)
  document.body.insertAdjacentHTML('beforeend', `
    <div id="toast-container" aria-live="polite"></div>
    ${getCalculatorHTML()}
  `);

  renderNav();
  initCalculator();

  // Global navigate function used by inline onclick handlers
  window.navigate = navigate;

  navigate('dashboard');
}

export function navigate(page: string, extra?: string): void {
  currentPage = page as PageName;
  editingId   = extra ?? null;

  // Update bottom nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', (el as HTMLElement).dataset.page === page);
  });

  // Special: Tambah page when opened via nav (no editId) clears editing
  if (page === 'tambah' && !extra) editingId = null;

  renderPage();
}

function renderPage(): void {
  const main = document.getElementById('main-content');
  if (!main) return;

  let html = '';
  switch (currentPage) {
    case 'dashboard':  html = renderDashboard(); break;
    case 'tambah':     html = renderTambah(editingId); break;
    case 'riwayat':    html = renderRiwayat(); break;
    case 'detail':     html = renderDetail(editingId); break;
  }

  main.innerHTML = html;
  main.scrollTop = 0;

  // Init page event handlers
  switch (currentPage) {
    case 'dashboard':  initDashboard(); break;
    case 'tambah':     initTambah(editingId); break;
    case 'riwayat':    initRiwayat(); break;
    case 'detail':     initDetail(); break;
  }
}

function renderNav(): void {
  const header = document.getElementById('app-header');
  if (header) {
    header.innerHTML = `
      <div class="header-brand">
        <img class="header-icon" src="./app-icon.png" alt="" aria-hidden="true" />
        <span class="header-title">Dompet</span>
      </div>
      <button id="btn-dark-mode" class="btn-icon" title="Toggle Dark Mode" aria-label="Toggle Dark Mode">
        <span id="dark-icon">🌙</span>
      </button>
    `;
    document.getElementById('btn-dark-mode')?.addEventListener('click', toggleDarkMode);
  }

  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  nav.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-item ${item.page === currentPage ? 'active' : ''}"
            data-page="${item.page}"
            aria-label="${item.label}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = (btn as HTMLElement).dataset.page as PageName;
      navigate(page);
    });
  });
}

function toggleDarkMode(): void {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  applyThemeValue(next === 'dark');
  saveSettings({ darkMode: next === 'dark' });
  const icon = document.getElementById('dark-icon');
  if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
}

function applyTheme(): void {
  const settings = getSettings();
  applyThemeValue(settings.darkMode);
  const icon = document.getElementById('dark-icon');
  if (icon) icon.textContent = settings.darkMode ? '☀️' : '🌙';
}

function applyThemeValue(dark: boolean): void {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
