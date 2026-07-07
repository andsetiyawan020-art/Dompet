import path from 'path';
import { defineConfig } from 'vite';

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
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, '..') }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
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
