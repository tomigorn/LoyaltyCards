import { defineConfig } from '@playwright/test';

// Standalone config for live sync tests — does NOT manage a web server (start separately).
// Usage:
//   docker run -d --rm --name pb-e2e -p 8091:8090 -e PB_ADMIN_EMAIL=a@b.c \
//              -e PB_ADMIN_PASSWORD=password123456 loyaltycards-sync:local
//   VITE_SYNC_URL=http://localhost:8091 npm run build
//   npx vite preview --port 4173 &
//   npx playwright test e2e-live/sync.spec.ts --config e2e-live/playwright.config.ts

export default defineConfig({
  testDir: '.',
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
  },
  timeout: 60_000,
  reporter: 'list',
});
