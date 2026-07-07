import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

// import.meta.dirname is Node 21+ only. Use fileURLToPath for Node 18/20 compat.
const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Vite plugin: removes type="module" and crossorigin from built HTML so the
 * IIFE bundle loads as a classic <script> on Android WebView without needing
 * ES-module support (required for API < 61 / Chrome < 61).
 */
function stripModuleType(): Plugin {
  return {
    name: 'strip-module-type',
    enforce: 'post',
    transformIndexHtml(html: string) {
      return html
        .replace(/ type="module"/g, '')
        .replace(/ crossorigin/g, '');
    },
  };
}

// PORT is required for the Replit dev server but not for `vite build`.
// Outside Replit (e.g. local build for Android Studio), fall back to 5173.
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

// BASE_PATH defaults to './' so asset references are always relative.
// Relative paths are required for Android WebView (file:///android_asset/www/).
// Override with BASE_PATH=/ only when serving from a web server root.
const basePath = process.env.BASE_PATH ?? './';

export default defineConfig({
  base: basePath,
  plugins: [
    // Strip type="module" / crossorigin from built HTML (production only).
    // This makes the IIFE bundle load as a classic script on all WebView versions.
    ...(process.env.NODE_ENV === 'production' ? [stripModuleType()] : []),

    // Replit dev-only plugins (never included in production build).
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({ root: path.resolve(__dirname, '..') }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    // IIFE format produces a classic <script> (no type="module") so the bundle
    // loads on Android WebView API 26+ (Chrome 60+, Android 8.0+) without
    // requiring ES-module support. Chrome 60 supports for-of, destructuring,
    // async/await, template literals — all syntax used in this app.
    target: 'chrome60',
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'SaldoTrackerApp',
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: false },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
