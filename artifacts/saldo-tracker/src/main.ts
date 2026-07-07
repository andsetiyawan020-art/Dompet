// ============================================================
// Entry Point
// ============================================================

import './style.css';
import { initApp } from './app';

// Bootstrap the app once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    initApp();
  } finally {
    // Always dismiss splash — even if initApp() throws.
    // Uses transitionend as primary trigger, with a hard fallback timer
    // so the overlay never blocks the app permanently.
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('splash-fade-out');

      // Fallback: force-remove after 600 ms in case transitionend doesn't fire
      // (e.g. CSS not parsed yet, reduced-motion, or WebView timing quirk).
      const fallback = setTimeout(() => splash.remove(), 600);
      splash.addEventListener('transitionend', () => {
        clearTimeout(fallback);
        splash.remove();
      }, { once: true });
    }
  }
});
