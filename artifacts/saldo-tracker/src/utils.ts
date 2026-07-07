// ============================================================
// Utility Functions
// ============================================================

/** Format number as Indonesian Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format number with thousand separators (no currency symbol) */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

/** Parse formatted number string back to number */
export function parseFormattedNumber(str: string): number {
  const cleaned = str.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/** Format date to Indonesian locale */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format date to short format */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Get today's date as YYYY-MM-DD */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get current month name */
export function currentMonthName(): string {
  return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

/** Get month name from YYYY-MM string */
export function monthName(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'short' });
}

/** Generate unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Get YYYY-MM from date string */
export function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Get YYYY from date string */
export function getYear(dateStr: string): string {
  return dateStr.slice(0, 4);
}

/** Show a toast notification */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** Truncate text */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/** Sanitize HTML to prevent XSS */
export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
