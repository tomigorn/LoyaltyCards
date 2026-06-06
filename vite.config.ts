import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// Single source of truth for the app version: package.json "version". Injected at build time
// and shown in Settings. Bump it (commit "bump version to x.x.x") to cut a release; that same
// number is used as the Docker image tag and the git tag.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LoyaltyCards',
        short_name: 'Cards',
        theme_color: '#0b0b0d',
        background_color: '#0b0b0d',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Exclude large tesseract assets from precache — they are lazy-loaded
        // and will be cached at runtime on first OCR use.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        globIgnores: ['tess/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', 'e2e-live/**'],
    alias: [
      { find: /^svelte$/, replacement: new URL('./node_modules/svelte/src/index-client.js', import.meta.url).pathname },
    ],
  },
});
