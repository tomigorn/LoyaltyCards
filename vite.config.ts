import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    alias: [
      { find: /^svelte$/, replacement: new URL('./node_modules/svelte/src/index-client.js', import.meta.url).pathname },
    ],
  },
});
