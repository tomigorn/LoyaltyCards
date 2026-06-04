# LoyaltyCards v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first, installable PWA that stores loyalty cards and shows their barcode at checkout, self-hosted on a Raspberry Pi behind Traefik — a clean, private, nag-free Stocard replacement.

**Architecture:** 100% client-side Svelte + Vite PWA. All data on-device in IndexedDB (cards + image Blobs). Barcodes scanned via the native `BarcodeDetector` API (fallback `@zxing/browser`) and rendered via `bwip-js`. Logos resolve catalog → on-demand fetch → generated tile. Built into an nginx static image pushed to Docker Hub as `tomigorn/loyalty-cards`; a separate compose project pulls and runs it; a Traefik dynamic file routes `loyalty-cards.holy-grail.ch`.

**Tech Stack:** Svelte 5 + Vite + TypeScript, `vite-plugin-pwa`, `idb`, `bwip-js`, `@zxing/browser`, Vitest + `fake-indexeddb`, Playwright, Docker (node-build → nginx), Traefik file provider.

**Two repos / locations:**
- **Source:** `/home/pi/Documents/development/LoyaltyCards` (git branch `loyaltycards-v1`).
- **Deploy compose:** `/home/pi/Projects/Docker/LoyaltyCards` (sample structure).
- **Traefik route:** `/home/pi/Projects/Docker/Traefik/traefik/dynamic/loyalty-cards.yml`.

**Conventions learned from the existing infra (do not re-derive):**
- Traefik uses a **file provider**; each service gets one `dynamic/<name>.yml` with `router`, per-service `secure-headers` middleware, shared `default-rate-limit@file`, `entryPoints: [websecure]`, `tls.certResolver: cloudflare`.
- Containers join the **external** docker network `traefik_proxy`.
- The Pi is already `docker login`'d as `tomigorn`.
- Docker compose projects follow the sample structure: sectioned `docker-compose.yaml`, `.env.example` (starts with `COMPOSE_PROJECT_NAME=`), gitignored `.env`, `.gitignore`.
- Commit style: `LoyaltyCards: <short description>`. **No AI co-author trailer.**

---

## File Structure (target)

```
SOURCE  /home/pi/Documents/development/LoyaltyCards
├── package.json  vite.config.ts  svelte.config.js  tsconfig.json  index.html
├── Dockerfile  nginx.conf  .dockerignore
├── public/                       # manifest icons, favicon
├── src/
│   ├── main.ts  App.svelte  app.css
│   ├── lib/
│   │   ├── types.ts             # Card, CatalogEntry, BarcodeFormat, Logo
│   │   ├── db.ts                # IndexedDB layer (idb): cards + images stores
│   │   ├── stores.ts            # svelte stores: cards, search query
│   │   ├── barcode/formats.ts   # format list + validateBarcode()
│   │   ├── barcode/render.ts    # bwip-js → canvas
│   │   ├── barcode/scan.ts      # BarcodeDetector + zxing fallback
│   │   ├── logo/tile.ts         # generated initials tile (canvas → dataURL)
│   │   ├── logo/fetch.ts        # on-demand online fetch (interface + impl)
│   │   ├── logo/resolve.ts      # resolution chain → display URL
│   │   ├── catalog/catalog.ts   # findCatalogEntry()
│   │   ├── catalog/data.ts      # bundled CatalogEntry[]
│   │   └── backup.ts            # export/import JSON
│   ├── screens/  Home / Checkout / AddCard / CardDetail / Settings .svelte
│   └── components/ CardTile / BarcodeView / ScannerView / PhotoField .svelte
├── tests/                       # *.test.ts (Vitest)
└── e2e/                         # *.spec.ts (Playwright)

DEPLOY  /home/pi/Projects/Docker/LoyaltyCards
├── docker-compose.yaml  .env.example  .env  .gitignore

TRAEFIK /home/pi/Projects/Docker/Traefik/traefik/dynamic/loyalty-cards.yml
```

---

# MILESTONE 0 — Walking Skeleton Deploy

Prove Docker Hub → compose → Traefik → Cloudflare end-to-end with a placeholder, before any app code. Done when `https://loyalty-cards.holy-grail.ch` returns HTTP 200 with a "coming soon" page.

### Task 0.1: Placeholder site + nginx image

**Files:**
- Create: `/home/pi/Documents/development/LoyaltyCards/public/index.html` (temporary placeholder; replaced by the real build later)
- Create: `/home/pi/Documents/development/LoyaltyCards/nginx.conf`
- Create: `/home/pi/Documents/development/LoyaltyCards/Dockerfile`
- Create: `/home/pi/Documents/development/LoyaltyCards/.dockerignore`

- [ ] **Step 1: Placeholder page**

`public/index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LoyaltyCards</title>
<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
background:#0b0b0d;color:#e6e6ec;font:18px system-ui,sans-serif;text-align:center}</style>
</head><body><div><h1>🪪 LoyaltyCards</h1><p>Coming soon.</p></div></body></html>
```

- [ ] **Step 2: nginx config** (SPA fallback + caching; CSP/headers come from Traefik)

`nginx.conf`:
```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location = /manifest.webmanifest { add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
}
```

- [ ] **Step 3: Multi-stage Dockerfile** (placeholder build copies `public/`; real build added in M1)

`Dockerfile`:
```dockerfile
# ---- build stage (real app build added in Milestone 1) ----
FROM node:22-alpine AS build
WORKDIR /app
# For the skeleton there is no app yet; copy the static placeholder.
COPY public/ ./dist/
# (Milestone 1 replaces the two lines above with: COPY package*.json ./; RUN npm ci;
#  COPY . .; RUN npm run build)

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 4: .dockerignore**

`.dockerignore`:
```
node_modules
dist
.git
docs
e2e
tests
*.log
.superpowers
```

- [ ] **Step 5: Commit**
```bash
cd /home/pi/Documents/development/LoyaltyCards
git add public nginx.conf Dockerfile .dockerignore
git commit -m "LoyaltyCards: skeleton nginx image (placeholder)"
```

### Task 0.2: Build & push placeholder image

- [ ] **Step 1: Build for the Pi's arch and tag**
```bash
cd /home/pi/Documents/development/LoyaltyCards
docker build -t tomigorn/loyalty-cards:0.0.1-skeleton -t tomigorn/loyalty-cards:latest .
```
Expected: build completes, two tags created.

- [ ] **Step 2: Push**
```bash
docker push tomigorn/loyalty-cards:0.0.1-skeleton
docker push tomigorn/loyalty-cards:latest
```
Expected: both tags pushed (Pi is already logged in as `tomigorn`).

### Task 0.3: Deploy compose project

**Files (sample structure):**
- Create: `/home/pi/Projects/Docker/LoyaltyCards/docker-compose.yaml`
- Create: `/home/pi/Projects/Docker/LoyaltyCards/.env.example`
- Create: `/home/pi/Projects/Docker/LoyaltyCards/.env`
- Create: `/home/pi/Projects/Docker/LoyaltyCards/.gitignore`

- [ ] **Step 1: docker-compose.yaml**
```yaml
# #########################################################
# Services ################################################
# #########################################################
services:
# ---------------------------------------------------------
# LoyaltyCards --------------------------------------------
# ---------------------------------------------------------
  loyalty-cards:
    image: tomigorn/loyalty-cards:${IMAGE_TAG}
    container_name: loyalty-cards
    restart: unless-stopped
    networks:
      - traefik_proxy

# #########################################################
# Networks ################################################
# #########################################################
networks:
  traefik_proxy:
    external: true
```
> Note: no Traefik labels — routing is via the Traefik file provider (Task 0.4). The container name `loyalty-cards` is the service URL Traefik targets.

- [ ] **Step 2: .env.example**
```bash
COMPOSE_PROJECT_NAME=LoyaltyCards
IMAGE_TAG=
```

- [ ] **Step 3: .env** (real value)
```bash
COMPOSE_PROJECT_NAME=LoyaltyCards
IMAGE_TAG=0.0.1-skeleton
```

- [ ] **Step 4: .gitignore**
```
.env
```

### Task 0.4: Traefik route

**Files:**
- Create: `/home/pi/Projects/Docker/Traefik/traefik/dynamic/loyalty-cards.yml`

- [ ] **Step 1: Route file** (PWA-appropriate CSP; **camera allowed**, blob/data images, connect-src for logo fetch). The container listens on port 80.
```yaml
http:
  routers:
    loyalty-cards:
      rule: "Host(`loyalty-cards.holy-grail.ch`)"
      entryPoints: ["websecure"]
      priority: 1
      service: loyalty-cards
      middlewares:
        - default-rate-limit@file
        - loyalty-cards-secure-headers
      tls:
        certResolver: cloudflare

  middlewares:
    loyalty-cards-secure-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
        contentTypeNosniff: true
        referrerPolicy: "strict-origin-when-cross-origin"
        frameDeny: true
        permissionsPolicy: "camera=(self), microphone=(), geolocation=()"
        customResponseHeaders:
          Content-Security-Policy: >-
            default-src 'self';
            img-src 'self' data: blob:;
            script-src 'self';
            style-src 'self' 'unsafe-inline';
            connect-src 'self' https:;
            worker-src 'self' blob:;
            manifest-src 'self';
            frame-ancestors 'none'
          Server: ""

  services:
    loyalty-cards:
      loadBalancer:
        servers:
          - url: "http://loyalty-cards:80"
        passHostHeader: true
```
> `connect-src ... https:` is intentionally broad so the on-demand logo fetch works; tighten to the chosen logo host in Milestone 7 once decided.

### Task 0.5: Bring up & verify

- [ ] **Step 1: Start**
```bash
cd /home/pi/Projects/Docker/LoyaltyCards
docker compose up -d
```
Expected: `loyalty-cards` container Up. Traefik auto-reloads the new dynamic file (no restart needed).

- [ ] **Step 2: Verify end-to-end**
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://loyalty-cards.holy-grail.ch/
```
Expected: `200`. (If `404`: Traefik route not picked up — check the file is in `dynamic/`. If `502`: container not on `traefik_proxy` or wrong port.)

- [ ] **Step 3: Add checklist row** (per user rules: all ❌, other columns empty)

Edit `/home/pi/Projects/Docker/_global/checklist.md`, append a row:
`| LoyaltyCards | ❌ | ❌ |  |  |  |`

- [ ] **Step 4: Tell the user** to open `https://loyalty-cards.holy-grail.ch` and confirm the placeholder shows. **Pipeline proven.**

---

# MILESTONE 1 — App Scaffold

Replace the placeholder with a real Svelte+Vite+TS+PWA scaffold and a green test runner.

### Task 1.1: Scaffold Svelte + Vite + TS

**Files:** create `package.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/App.svelte`, `src/app.css`.

- [ ] **Step 1: Init** (in the source repo root; the dir is non-empty so scaffold manually)
```bash
cd /home/pi/Documents/development/LoyaltyCards
npm init -y
npm install svelte
npm install -D vite @sveltejs/vite-plugin-svelte typescript svelte-check \
  vite-plugin-pwa vitest @vitest/ui fake-indexeddb jsdom @testing-library/svelte \
  @playwright/test
npm install idb bwip-js @zxing/browser
```

- [ ] **Step 2: `vite.config.ts`**
```ts
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
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: `tsconfig.json`, `svelte.config.js`, `index.html`, `src/main.ts`, `src/App.svelte`, `src/app.css`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler",
    "strict": true, "skipLibCheck": true, "isolatedModules": true,
    "types": ["vitest/globals"], "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "tests", "e2e"]
}
```
`svelte.config.js`:
```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess() };
```
`index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>LoyaltyCards</title></head>
<body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>
```
`src/main.ts`:
```ts
import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
const app = mount(App, { target: document.getElementById('app')! });
export default app;
```
`src/App.svelte`:
```svelte
<script lang="ts">
</script>
<main><h1>LoyaltyCards</h1></main>
<style>:global(body){margin:0;background:#0b0b0d;color:#e6e6ec;font-family:system-ui,sans-serif}</style>
```
`src/app.css`:
```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
```

- [ ] **Step 4: Test setup + package scripts**

`tests/setup.ts`:
```ts
import 'fake-indexeddb/auto';
```
Add to `package.json` `"scripts"`:
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "check": "svelte-check --tsconfig ./tsconfig.json",
  "e2e": "playwright test"
}
```

- [ ] **Step 5: Verify build + empty test run**
```bash
npm run build && npm run test
```
Expected: build emits `dist/`; vitest reports "no tests" (exit 0) — acceptable at this step.

- [ ] **Step 6: Update Dockerfile build stage** to do a real build, then commit.

Replace the build stage's placeholder copy lines with:
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```
(The runtime stage already copies `/app/dist`.)
```bash
git add -A && git commit -m "LoyaltyCards: Svelte+Vite+PWA scaffold and test harness"
```

---

# MILESTONE 2 — Types & Storage Layer (TDD)

### Task 2.1: Types

**Files:** Create `src/lib/types.ts`.

- [ ] **Step 1: Write types** (no test needed — pure declarations)
```ts
export type BarcodeFormat =
  | 'ean13' | 'ean8' | 'upca' | 'upce'
  | 'code128' | 'code39' | 'itf' | 'codabar'
  | 'qr' | 'aztec' | 'pdf417' | 'datamatrix';

export type LogoSource = 'catalog' | 'fetched' | 'uploaded' | 'generated';
export interface Logo { source: LogoSource; blobRef?: string; }

export interface Card {
  id: string;
  storeName: string;
  barcodeValue: string;
  barcodeFormat: BarcodeFormat;
  brandColor: string;       // hex like "#FF6600"
  logo: Logo;
  notes: string;
  frontPhotoRef?: string;   // key in images store
  backPhotoRef?: string;
  favorite: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogEntry {
  id: string;
  name: string;
  aliases: string[];
  brandColor: string;
  logoAsset: string;        // path under /catalog-logos/
  defaultFormat?: BarcodeFormat;
}
```
- [ ] **Step 2: Commit** `git add src/lib/types.ts && git commit -m "LoyaltyCards: domain types"`

### Task 2.2: IndexedDB storage layer

**Files:** Create `src/lib/db.ts`, Test `tests/db.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDB, putCard, getCard, getAllCards, deleteCard,
         putImage, getImage, clearAll } from '../src/lib/db';
import type { Card } from '../src/lib/types';

const sample = (over: Partial<Card> = {}): Card => ({
  id: 'c1', storeName: 'Migros', barcodeValue: '7612345678900',
  barcodeFormat: 'ean13', brandColor: '#FF6600', logo: { source: 'generated' },
  notes: '', favorite: false, order: 0, createdAt: 1, updatedAt: 1, ...over,
});

describe('db', () => {
  beforeEach(async () => { await resetDB(); });

  it('stores and reads a card', async () => {
    await putCard(sample());
    expect((await getCard('c1'))?.storeName).toBe('Migros');
  });
  it('lists cards ordered by order asc', async () => {
    await putCard(sample({ id: 'a', order: 2 }));
    await putCard(sample({ id: 'b', order: 1 }));
    expect((await getAllCards()).map(c => c.id)).toEqual(['b', 'a']);
  });
  it('deletes a card', async () => {
    await putCard(sample());
    await deleteCard('c1');
    expect(await getCard('c1')).toBeUndefined();
  });
  it('stores and reads an image blob', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    await putImage('img1', blob);
    expect((await getImage('img1'))?.size).toBe(1);
  });
  it('clearAll empties both stores', async () => {
    await putCard(sample()); await putImage('i', new Blob(['y']));
    await clearAll();
    expect(await getAllCards()).toEqual([]);
    expect(await getImage('i')).toBeUndefined();
  });
});
```
- [ ] **Step 2: Run — expect FAIL** `npx vitest run tests/db.test.ts` → fails (module not found).
- [ ] **Step 3: Implement `src/lib/db.ts`**
```ts
import { openDB, type IDBPDatabase } from 'idb';
import type { Card } from './types';

const DB_NAME = 'loyaltycards';
const VERSION = 1;
let dbp: Promise<IDBPDatabase> | null = null;

function open() {
  if (!dbp) {
    dbp = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cards'))
          db.createObjectStore('cards', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('images'))
          db.createObjectStore('images');
      },
    });
  }
  return dbp;
}

export async function resetDB() {
  // test helper: wipe both stores
  const db = await open();
  await db.clear('cards'); await db.clear('images');
}
export async function putCard(card: Card) { (await open()).put('cards', card); }
export async function getCard(id: string): Promise<Card | undefined> {
  return (await open()).get('cards', id);
}
export async function getAllCards(): Promise<Card[]> {
  const all = (await (await open()).getAll('cards')) as Card[];
  return all.sort((a, b) => a.order - b.order);
}
export async function deleteCard(id: string) { (await open()).delete('cards', id); }
export async function putImage(key: string, blob: Blob) { (await open()).put('images', blob, key); }
export async function getImage(key: string): Promise<Blob | undefined> {
  return (await open()).get('images', key);
}
export async function deleteImage(key: string) { (await open()).delete('images', key); }
export async function clearAll() {
  const db = await open();
  await db.clear('cards'); await db.clear('images');
}
```
- [ ] **Step 4: Run — expect PASS** `npx vitest run tests/db.test.ts` → all pass.
- [ ] **Step 5: Commit** `git add src/lib/db.ts tests/db.test.ts && git commit -m "LoyaltyCards: IndexedDB storage layer"`

---

# MILESTONE 3 — Barcode Formats & Validation (TDD)

### Task 3.1: Format validation

**Files:** Create `src/lib/barcode/formats.ts`, Test `tests/formats.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { validateBarcode, FORMATS } from '../src/lib/barcode/formats';

describe('validateBarcode', () => {
  it('lists all 12 supported formats', () => { expect(FORMATS.length).toBe(12); });
  it('accepts a valid EAN-13 (correct checksum)', () => {
    expect(validateBarcode('ean13', '7612345678900').ok).toBe(true);
  });
  it('rejects EAN-13 with wrong length', () => {
    expect(validateBarcode('ean13', '123').ok).toBe(false);
  });
  it('rejects EAN-13 with bad checksum', () => {
    expect(validateBarcode('ean13', '7612345678901').ok).toBe(false);
  });
  it('accepts EAN-8 valid checksum', () => {
    expect(validateBarcode('ean8', '96385074').ok).toBe(true);
  });
  it('accepts any non-empty value for code128/qr', () => {
    expect(validateBarcode('code128', 'ABC-123').ok).toBe(true);
    expect(validateBarcode('qr', 'https://x').ok).toBe(true);
  });
  it('rejects empty value for any format', () => {
    expect(validateBarcode('qr', '').ok).toBe(false);
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/barcode/formats.ts`**
```ts
import type { BarcodeFormat } from '../types';

export const FORMATS: BarcodeFormat[] = [
  'ean13', 'ean8', 'upca', 'upce', 'code128', 'code39',
  'itf', 'codabar', 'qr', 'aztec', 'pdf417', 'datamatrix',
];

export const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  ean13: 'EAN-13', ean8: 'EAN-8', upca: 'UPC-A', upce: 'UPC-E',
  code128: 'Code 128', code39: 'Code 39', itf: 'ITF', codabar: 'Codabar',
  qr: 'QR', aztec: 'Aztec', pdf417: 'PDF417', datamatrix: 'Data Matrix',
};

export interface Validation { ok: boolean; error?: string; }

function eanChecksumOk(digits: string): boolean {
  const n = digits.split('').map(Number);
  const check = n.pop()!;
  // weights: rightmost data digit ×3, alternating
  const sum = n.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function validateBarcode(format: BarcodeFormat, value: string): Validation {
  if (!value) return { ok: false, error: 'Value is empty' };
  const digits = /^\d+$/.test(value);
  switch (format) {
    case 'ean13':
      if (value.length !== 13 || !digits) return { ok: false, error: 'EAN-13 needs 13 digits' };
      return eanChecksumOk(value) ? { ok: true } : { ok: false, error: 'Bad checksum' };
    case 'ean8':
      if (value.length !== 8 || !digits) return { ok: false, error: 'EAN-8 needs 8 digits' };
      return eanChecksumOk(value) ? { ok: true } : { ok: false, error: 'Bad checksum' };
    case 'upca':
      if (value.length !== 12 || !digits) return { ok: false, error: 'UPC-A needs 12 digits' };
      return eanChecksumOk('0' + value) ? { ok: true } : { ok: false, error: 'Bad checksum' };
    case 'upce':
      return value.length >= 6 && value.length <= 8 && digits
        ? { ok: true } : { ok: false, error: 'UPC-E needs 6–8 digits' };
    case 'itf':
      return digits && value.length % 2 === 0
        ? { ok: true } : { ok: false, error: 'ITF needs an even number of digits' };
    default:
      // code128, code39, codabar, qr, aztec, pdf417, datamatrix: any non-empty value
      return { ok: true };
  }
}
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/barcode/formats.ts tests/formats.test.ts && git commit -m "LoyaltyCards: barcode format validation"`

---

# MILESTONE 4 — Barcode Rendering (bwip-js)

### Task 4.1: Render to canvas

**Files:** Create `src/lib/barcode/render.ts`, Test `tests/render.test.ts`.

- [ ] **Step 1: Failing test** (test the format→bcid mapping, which is the logic; pixel output is covered by E2E)
```ts
import { describe, it, expect } from 'vitest';
import { toBwipId } from '../src/lib/barcode/render';

describe('toBwipId', () => {
  it('maps our formats to bwip-js bcids', () => {
    expect(toBwipId('ean13')).toBe('ean13');
    expect(toBwipId('upca')).toBe('upca');
    expect(toBwipId('qr')).toBe('qrcode');
    expect(toBwipId('datamatrix')).toBe('datamatrix');
    expect(toBwipId('code128')).toBe('code128');
    expect(toBwipId('itf')).toBe('interleaved2of5');
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/barcode/render.ts`**
```ts
import bwipjs from 'bwip-js';
import type { BarcodeFormat } from '../types';

const BCID: Record<BarcodeFormat, string> = {
  ean13: 'ean13', ean8: 'ean8', upca: 'upca', upce: 'upce',
  code128: 'code128', code39: 'code39', itf: 'interleaved2of5',
  codabar: 'rationalizedCodabar', qr: 'qrcode', aztec: 'azteccode',
  pdf417: 'pdf417', datamatrix: 'datamatrix',
};

export function toBwipId(format: BarcodeFormat): string { return BCID[format]; }

export function renderToCanvas(
  canvas: HTMLCanvasElement, format: BarcodeFormat, value: string,
) {
  bwipjs.toCanvas(canvas, {
    bcid: toBwipId(format),
    text: value,
    scale: 3,
    height: format === 'qr' || format === 'aztec' || format === 'datamatrix' ? undefined : 14,
    includetext: false,
    backgroundcolor: 'FFFFFF',
    paddingwidth: 10,
    paddingheight: 10,
  });
}
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/barcode/render.ts tests/render.test.ts && git commit -m "LoyaltyCards: barcode rendering via bwip-js"`

---

# MILESTONE 5 — Barcode Scanning

Camera scanning is hardware/browser-bound → unit-test the support detection and format mapping; full scan is verified by E2E (M14) and manual test.

### Task 5.1: Scan service

**Files:** Create `src/lib/barcode/scan.ts`, Test `tests/scan.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { mapDetectedFormat } from '../src/lib/barcode/scan';

describe('mapDetectedFormat', () => {
  it('maps BarcodeDetector format strings to ours', () => {
    expect(mapDetectedFormat('ean_13')).toBe('ean13');
    expect(mapDetectedFormat('qr_code')).toBe('qr');
    expect(mapDetectedFormat('upc_a')).toBe('upca');
    expect(mapDetectedFormat('code_128')).toBe('code128');
  });
  it('returns undefined for unsupported', () => {
    expect(mapDetectedFormat('unknown')).toBeUndefined();
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/barcode/scan.ts`**
```ts
import type { BarcodeFormat } from '../types';

const FROM_DETECTOR: Record<string, BarcodeFormat> = {
  ean_13: 'ean13', ean_8: 'ean8', upc_a: 'upca', upc_e: 'upce',
  code_128: 'code128', code_39: 'code39', itf: 'itf', codabar: 'codabar',
  qr_code: 'qr', aztec: 'aztec', pdf417: 'pdf417', data_matrix: 'datamatrix',
};

export function mapDetectedFormat(s: string): BarcodeFormat | undefined {
  return FROM_DETECTOR[s];
}

export interface ScanResult { value: string; format: BarcodeFormat; }

/** Start scanning from a <video> element. Returns a stop() function.
 *  Uses native BarcodeDetector when available, else @zxing/browser. */
export async function startScan(
  video: HTMLVideoElement, onResult: (r: ScanResult) => void,
): Promise<() => void> {
  // @ts-expect-error BarcodeDetector is not in TS DOM lib yet
  if (typeof window.BarcodeDetector !== 'undefined') {
    // @ts-expect-error runtime API
    const detector = new window.BarcodeDetector();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    video.srcObject = stream; await video.play();
    let active = true;
    const loop = async () => {
      if (!active) return;
      try {
        const codes = await detector.detect(video);
        if (codes.length) {
          const f = mapDetectedFormat(codes[0].format);
          if (f) { onResult({ value: codes[0].rawValue, format: f }); }
        }
      } catch { /* frame skip */ }
      if (active) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { active = false; stream.getTracks().forEach(t => t.stop()); };
  }
  // Fallback: @zxing/browser
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const reader = new BrowserMultiFormatReader();
  const controls = await reader.decodeFromVideoDevice(undefined, video, (res) => {
    if (res) {
      const fmt = mapDetectedFormat(res.getBarcodeFormat().toString().toLowerCase());
      onResult({ value: res.getText(), format: fmt ?? 'code128' });
    }
  });
  return () => controls.stop();
}
```
- [ ] **Step 4: Run — expect PASS** (only `mapDetectedFormat` is exercised in unit tests).
- [ ] **Step 5: Commit** `git add src/lib/barcode/scan.ts tests/scan.test.ts && git commit -m "LoyaltyCards: barcode scanning service"`

---

# MILESTONE 6 — Logo: Tile, Catalog, Resolution Chain (TDD)

### Task 6.1: Generated tile

**Files:** Create `src/lib/logo/tile.ts`, Test `tests/tile.test.ts`.

- [ ] **Step 1: Failing test** (test the pure `initials()` helper; canvas dataURL is DOM-bound)
```ts
import { describe, it, expect } from 'vitest';
import { initials } from '../src/lib/logo/tile';

describe('initials', () => {
  it('takes up to two leading letters of words', () => {
    expect(initials('Migros')).toBe('M');
    expect(initials('Coop City')).toBe('CC');
    expect(initials('  digitec galaxus ')).toBe('DG');
  });
  it('falls back to ? for empty', () => { expect(initials('')).toBe('?'); });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/logo/tile.ts`**
```ts
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map(w => w[0]!.toUpperCase()).join('');
}

/** Render a colored tile with initials → PNG data URL. */
export function generateTile(name: string, brandColor: string, size = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = brandColor || '#444';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.42}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), size / 2, size / 2 + size * 0.02);
  return canvas.toDataURL('image/png');
}
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/logo/tile.ts tests/tile.test.ts && git commit -m "LoyaltyCards: generated logo tiles"`

### Task 6.2: Catalog lookup + bundled data

**Files:** Create `src/lib/catalog/data.ts`, `src/lib/catalog/catalog.ts`, Test `tests/catalog.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { findCatalogEntry } from '../src/lib/catalog/catalog';

describe('findCatalogEntry', () => {
  it('matches by name case-insensitively', () => {
    expect(findCatalogEntry('migros')?.name).toBe('Migros');
  });
  it('matches by alias', () => {
    expect(findCatalogEntry('coop city')?.name).toBe('Coop');
  });
  it('returns undefined when unknown', () => {
    expect(findCatalogEntry('nonexistent store')).toBeUndefined();
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement data + lookup**

`src/lib/catalog/data.ts` (starter set — Swiss/DE; extend freely later):
```ts
import type { CatalogEntry } from '../types';
export const CATALOG: CatalogEntry[] = [
  { id: 'migros', name: 'Migros', aliases: ['cumulus'], brandColor: '#FF6600', logoAsset: 'migros.svg', defaultFormat: 'ean13' },
  { id: 'coop', name: 'Coop', aliases: ['coop city', 'supercard'], brandColor: '#E2001A', logoAsset: 'coop.svg', defaultFormat: 'ean13' },
  { id: 'ikea', name: 'IKEA', aliases: ['ikea family'], brandColor: '#0058A3', logoAsset: 'ikea.svg', defaultFormat: 'code128' },
  { id: 'manor', name: 'Manor', aliases: ['manor card'], brandColor: '#009640', logoAsset: 'manor.svg', defaultFormat: 'ean13' },
  { id: 'digitec', name: 'Digitec', aliases: ['digitec galaxus', 'galaxus'], brandColor: '#1A1A1A', logoAsset: 'digitec.svg', defaultFormat: 'code128' },
  { id: 'denner', name: 'Denner', aliases: [], brandColor: '#E2001A', logoAsset: 'denner.svg', defaultFormat: 'ean13' },
];
```
`src/lib/catalog/catalog.ts`:
```ts
import { CATALOG } from './data';
import type { CatalogEntry } from '../types';

export function findCatalogEntry(query: string): CatalogEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return CATALOG.find(e =>
    e.name.toLowerCase() === q ||
    e.aliases.some(a => a.toLowerCase() === q) ||
    e.name.toLowerCase().includes(q),
  );
}
export { CATALOG };
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/catalog tests/catalog.test.ts && git commit -m "LoyaltyCards: store catalog + lookup"`

### Task 6.3: Logo fetch (on-demand) + resolution chain

**Files:** Create `src/lib/logo/fetch.ts`, `src/lib/logo/resolve.ts`, Test `tests/resolve.test.ts`.

> **Open item resolved here:** use **`https://logo.clearbit.com/<domain>`**-style fetch via a guessed domain, behind the `LogoFetcher` interface so it is swappable. Failure (offline / 404) is non-fatal and falls back to a generated tile.

- [ ] **Step 1: Failing test** (inject a fake fetcher + fake image store so it's deterministic)
```ts
import { describe, it, expect } from 'vitest';
import { resolveLogoUrl } from '../src/lib/logo/resolve';
import type { Card } from '../src/lib/types';

const base: Card = {
  id: 'c1', storeName: 'Migros', barcodeValue: '7612345678900', barcodeFormat: 'ean13',
  brandColor: '#FF6600', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt: 1,
};

describe('resolveLogoUrl', () => {
  it('returns an uploaded blob URL when source=uploaded', async () => {
    const card = { ...base, logo: { source: 'uploaded' as const, blobRef: 'img1' } };
    const url = await resolveLogoUrl(card, {
      getImage: async () => new Blob(['x']),
      makeObjectUrl: () => 'blob://img1',
      generateTile: () => 'data:tile',
    });
    expect(url).toBe('blob://img1');
  });
  it('falls back to a generated tile when source=generated', async () => {
    const url = await resolveLogoUrl(base, {
      getImage: async () => undefined,
      makeObjectUrl: () => 'blob://x',
      generateTile: () => 'data:tile',
    });
    expect(url).toBe('data:tile');
  });
  it('falls back to tile if the stored blob is missing', async () => {
    const card = { ...base, logo: { source: 'uploaded' as const, blobRef: 'missing' } };
    const url = await resolveLogoUrl(card, {
      getImage: async () => undefined,
      makeObjectUrl: () => 'blob://x',
      generateTile: () => 'data:tile',
    });
    expect(url).toBe('data:tile');
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement fetch + resolve**

`src/lib/logo/fetch.ts`:
```ts
export interface LogoFetcher { fetchLogo(storeName: string): Promise<Blob | null>; }

/** Guess a domain from the store name and pull a logo. On-demand only. */
export const clearbitFetcher: LogoFetcher = {
  async fetchLogo(storeName) {
    const domain = storeName.trim().toLowerCase().replace(/\s+/g, '') + '.com';
    try {
      const res = await fetch(`https://logo.clearbit.com/${domain}?size=256`);
      if (!res.ok) return null;
      return await res.blob();
    } catch { return null; }
  },
};
```
`src/lib/logo/resolve.ts`:
```ts
import type { Card } from '../types';

export interface ResolveDeps {
  getImage: (key: string) => Promise<Blob | undefined>;
  makeObjectUrl: (blob: Blob) => string;
  generateTile: (name: string, color: string) => string;
}

/** Resolve a card to a displayable logo URL.
 *  uploaded/fetched/catalog → stored blob; otherwise → generated tile. */
export async function resolveLogoUrl(card: Card, deps: ResolveDeps): Promise<string> {
  if (card.logo.blobRef) {
    const blob = await deps.getImage(card.logo.blobRef);
    if (blob) return deps.makeObjectUrl(blob);
  }
  return deps.generateTile(card.storeName, card.brandColor);
}
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/logo tests/resolve.test.ts && git commit -m "LoyaltyCards: logo fetch + resolution chain"`

---

# MILESTONE 7 — Backup Export/Import (TDD)

> **Open item resolved here:** import is **replace** by default (clearAll then load), with a `merge` option for additive restore.

### Task 7.1: Export/import round-trip

**Files:** Create `src/lib/backup.ts`, Test `tests/backup.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { exportBackup, importBackup } from '../src/lib/backup';
import { resetDB, putCard, putImage, getAllCards, getImage } from '../src/lib/db';
import type { Card } from '../src/lib/types';

const card: Card = {
  id: 'c1', storeName: 'Migros', barcodeValue: '7612345678900', barcodeFormat: 'ean13',
  brandColor: '#FF6600', logo: { source: 'uploaded', blobRef: 'img1' }, notes: 'hi',
  favorite: true, order: 0, createdAt: 1, updatedAt: 1,
};

describe('backup', () => {
  beforeEach(async () => { await resetDB(); });
  it('round-trips cards and images through export→import (replace)', async () => {
    await putCard(card);
    await putImage('img1', new Blob(['PNGDATA'], { type: 'image/png' }));
    const json = await exportBackup();
    await resetDB();
    await importBackup(json, 'replace');
    expect((await getAllCards())[0].storeName).toBe('Migros');
    expect((await getImage('img1'))?.size).toBe(7);
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/backup.ts`**
```ts
import { getAllCards, putCard, putImage, getImage, clearAll } from './db';
import type { Card } from './types';

interface BackupFile {
  version: 1;
  cards: Card[];
  images: Record<string, string>; // key → base64
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ''; for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin);
}
function base64ToBlob(b64: string): Blob {
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr]);
}

export async function exportBackup(): Promise<string> {
  const cards = await getAllCards();
  const images: Record<string, string> = {};
  const refs = new Set<string>();
  for (const c of cards) {
    [c.logo.blobRef, c.frontPhotoRef, c.backPhotoRef].forEach(r => r && refs.add(r));
  }
  for (const ref of refs) {
    const blob = await getImage(ref);
    if (blob) images[ref] = await blobToBase64(blob);
  }
  const file: BackupFile = { version: 1, cards, images };
  return JSON.stringify(file);
}

export async function importBackup(json: string, mode: 'replace' | 'merge' = 'replace') {
  const file = JSON.parse(json) as BackupFile;
  if (file.version !== 1) throw new Error('Unsupported backup version');
  if (mode === 'replace') await clearAll();
  for (const [key, b64] of Object.entries(file.images)) await putImage(key, base64ToBlob(b64));
  for (const c of file.cards) await putCard(c);
}
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/backup.ts tests/backup.test.ts && git commit -m "LoyaltyCards: backup export/import"`

---

# MILESTONE 8 — Svelte Stores & Home Screen (Layout A)

### Task 8.1: Reactive stores

**Files:** Create `src/lib/stores.ts`, Test `tests/stores.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { cards, query, filtered, loadCards } from '../src/lib/stores';
import { resetDB, putCard } from '../src/lib/db';
import type { Card } from '../src/lib/types';

const mk = (id: string, name: string): Card => ({
  id, storeName: name, barcodeValue: '1', barcodeFormat: 'code128',
  brandColor: '#333', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt: 1,
});

describe('stores', () => {
  beforeEach(async () => { await resetDB(); query.set(''); });
  it('loadCards populates the cards store', async () => {
    await putCard(mk('a', 'Migros')); await loadCards();
    expect(get(cards).length).toBe(1);
  });
  it('filtered narrows by query (case-insensitive)', async () => {
    await putCard(mk('a', 'Migros')); await putCard(mk('b', 'Coop'));
    await loadCards(); query.set('co');
    expect(get(filtered).map(c => c.storeName)).toEqual(['Coop']);
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/stores.ts`**
```ts
import { writable, derived } from 'svelte/store';
import { getAllCards } from './db';
import type { Card } from './types';

export const cards = writable<Card[]>([]);
export const query = writable('');

export async function loadCards() { cards.set(await getAllCards()); }

export const filtered = derived([cards, query], ([$cards, $q]) => {
  const q = $q.trim().toLowerCase();
  const list = q ? $cards.filter(c => c.storeName.toLowerCase().includes(q)) : $cards;
  return [...list].sort((a, b) =>
    Number(b.favorite) - Number(a.favorite) || a.order - b.order);
});
```
- [ ] **Step 4: Run — expect PASS.** Commit `git add src/lib/stores.ts tests/stores.test.ts && git commit -m "LoyaltyCards: reactive card stores"`

### Task 8.2: CardTile + Home screen + minimal router

**Files:** Create `src/components/CardTile.svelte`, `src/screens/Home.svelte`, modify `src/App.svelte`.

- [ ] **Step 1: `CardTile.svelte`** (resolves logo URL; emits click)
```svelte
<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveLogoUrl } from '../lib/logo/resolve';
  import { getImage } from '../lib/db';
  import { generateTile } from '../lib/logo/tile';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let url = $state('');
  $effect(() => {
    resolveLogoUrl(card, {
      getImage, makeObjectUrl: URL.createObjectURL, generateTile,
    }).then(u => url = u);
  });
</script>
<button class="tile" style="background:{card.brandColor}" onclick={() => onopen(card)}>
  {#if url}<img src={url} alt={card.storeName} />{/if}
  <span>{card.storeName}</span>
</button>
<style>
  .tile{border:none;border-radius:14px;aspect-ratio:1.4;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:6px;color:#fff;cursor:pointer;padding:8px;overflow:hidden}
  img{max-width:70%;max-height:55%;object-fit:contain}
  span{font-size:13px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.4)}
</style>
```

- [ ] **Step 2: `Home.svelte`** (grid A + search bar)
```svelte
<script lang="ts">
  import { filtered, query, loadCards } from '../lib/stores';
  import CardTile from '../components/CardTile.svelte';
  import type { Card } from '../lib/types';
  let { onopen, onadd, onsettings }:
    { onopen: (c: Card) => void; onadd: () => void; onsettings: () => void } = $props();
  loadCards();
</script>
<header>
  <h1>Cards</h1>
  <button class="icon" onclick={onsettings} aria-label="Settings">⚙️</button>
</header>
<input class="search" placeholder="🔍 Search…" bind:value={$query} />
<div class="grid">
  {#each $filtered as card (card.id)}<CardTile {card} {onopen} />{/each}
  <button class="add" onclick={onadd} aria-label="Add card">＋</button>
</div>
<style>
  header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}
  h1{font-size:20px;margin:0}
  .icon{background:none;border:none;font-size:18px;cursor:pointer}
  .search{margin:0 16px 12px;width:calc(100% - 32px);padding:10px 12px;border-radius:10px;
    border:1px solid #2a2a30;background:#161618;color:#eee}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px 24px}
  .add{aspect-ratio:1.4;border-radius:14px;border:1px dashed #3a3a42;background:#161618;
    color:#9a9aa4;font-size:28px;cursor:pointer}
</style>
```

- [ ] **Step 3: Minimal router in `App.svelte`** (string-based screen state; no router lib — YAGNI)
```svelte
<script lang="ts">
  import Home from './screens/Home.svelte';
  import Checkout from './screens/Checkout.svelte';
  import AddCard from './screens/AddCard.svelte';
  import CardDetail from './screens/CardDetail.svelte';
  import Settings from './screens/Settings.svelte';
  import type { Card } from './lib/types';
  let screen = $state<'home'|'checkout'|'add'|'detail'|'settings'>('home');
  let active = $state<Card | null>(null);
  const go = (s: typeof screen) => screen = s;
</script>
{#if screen === 'home'}
  <Home onopen={(c) => { active = c; go('checkout'); }}
        onadd={() => go('add')} onsettings={() => go('settings')} />
{:else if screen === 'checkout' && active}
  <Checkout card={active} onback={() => go('home')} onedit={() => go('detail')} />
{:else if screen === 'add'}
  <AddCard ondone={() => go('home')} oncancel={() => go('home')} />
{:else if screen === 'detail' && active}
  <CardDetail card={active} ondone={() => go('home')} />
{:else if screen === 'settings'}
  <Settings onback={() => go('home')} />
{/if}
```
> Create empty stub `.svelte` files for `Checkout`, `AddCard`, `CardDetail`, `Settings` now (each just `<script lang="ts">let{}=$props();</script><p>TODO</p>`) so the app compiles; they are implemented in M9–M12.

- [ ] **Step 4: Verify** `npm run check && npm run build` → no type errors, build succeeds.
- [ ] **Step 5: Commit** `git add src/components src/screens src/App.svelte && git commit -m "LoyaltyCards: home screen (logo grid A) + search + router"`

---

# MILESTONE 9 — Add Card Flow

### Task 9.1: ScannerView component

**Files:** Create `src/components/ScannerView.svelte`.

- [ ] **Step 1: Implement** (wraps `startScan`; emits a result)
```svelte
<script lang="ts">
  import { startScan, type ScanResult } from '../lib/barcode/scan';
  let { onresult }: { onresult: (r: ScanResult) => void } = $props();
  let video: HTMLVideoElement;
  let stop: (() => void) | null = null;
  let error = $state('');
  $effect(() => {
    startScan(video, (r) => { onresult(r); }).then(s => stop = s)
      .catch(() => error = 'Camera unavailable — use manual entry.');
    return () => stop?.();
  });
</script>
{#if error}<p class="err">{error}</p>{/if}
<!-- svelte-ignore a11y_media_has_caption -->
<video bind:this={video} playsinline></video>
<style>video{width:100%;border-radius:12px;background:#000}.err{color:#f88}</style>
```

- [ ] **Step 2: Commit** `git add src/components/ScannerView.svelte && git commit -m "LoyaltyCards: camera scanner component"`

### Task 9.2: AddCard screen (scan or manual → store pick → save)

**Files:** Replace stub `src/screens/AddCard.svelte`.

- [ ] **Step 1: Implement**
```svelte
<script lang="ts">
  import ScannerView from '../components/ScannerView.svelte';
  import { FORMATS, FORMAT_LABELS, validateBarcode } from '../lib/barcode/formats';
  import { findCatalogEntry } from '../lib/catalog/catalog';
  import { putCard } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import type { BarcodeFormat, Card } from '../lib/types';
  let { ondone, oncancel }: { ondone: () => void; oncancel: () => void } = $props();

  let mode = $state<'choose'|'scan'|'manual'>('choose');
  let value = $state(''); let format = $state<BarcodeFormat>('ean13'); let storeName = $state('');
  let err = $state('');

  function onScan(r: { value: string; format: BarcodeFormat }) {
    value = r.value; format = r.format; mode = 'manual';
  }
  async function save() {
    const v = validateBarcode(format, value);
    if (!v.ok) { err = v.error ?? 'Invalid barcode'; return; }
    if (!storeName.trim()) { err = 'Enter a store name'; return; }
    const cat = findCatalogEntry(storeName);
    const now = Date.now();
    const card: Card = {
      id: crypto.randomUUID(), storeName: storeName.trim(), barcodeValue: value,
      barcodeFormat: format, brandColor: cat?.brandColor ?? '#444',
      logo: { source: cat ? 'catalog' : 'generated' }, notes: '',
      favorite: false, order: now, createdAt: now, updatedAt: now,
    };
    await putCard(card); await loadCards(); ondone();
  }
</script>
<header><button onclick={oncancel}>← Cancel</button><h2>Add card</h2></header>
{#if mode === 'choose'}
  <button class="big" onclick={() => mode = 'scan'}>📷 Scan barcode</button>
  <button class="big" onclick={() => mode = 'manual'}>⌨️ Enter manually</button>
{:else if mode === 'scan'}
  <ScannerView onresult={onScan} />
  <button onclick={() => mode = 'manual'}>Enter manually instead</button>
{:else}
  <label>Store name<input bind:value={storeName} placeholder="e.g. Migros" /></label>
  <label>Number<input bind:value /></label>
  <label>Format
    <select bind:value={format}>
      {#each FORMATS as f}<option value={f}>{FORMAT_LABELS[f]}</option>{/each}
    </select>
  </label>
  {#if err}<p class="err">{err}</p>{/if}
  <button class="big" onclick={save}>Save</button>
{/if}
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  button{cursor:pointer}
  .big{display:block;width:calc(100% - 32px);margin:10px 16px;padding:14px;border-radius:12px;
    border:none;background:#2a6df4;color:#fff;font-size:16px}
  label{display:block;margin:10px 16px;color:#cdd}
  input,select{width:100%;padding:10px;margin-top:4px;border-radius:10px;border:1px solid #2a2a30;
    background:#161618;color:#eee}
  .err{color:#f88;margin:6px 16px}
</style>
```

- [ ] **Step 2: Verify** `npm run check && npm run build`.
- [ ] **Step 3: Commit** `git add src/screens/AddCard.svelte && git commit -m "LoyaltyCards: add-card flow (scan + manual)"`

---

# MILESTONE 10 — Card Detail / Edit

### Task 10.1: PhotoField + CardDetail

**Files:** Create `src/components/PhotoField.svelte`, replace stub `src/screens/CardDetail.svelte`.

- [ ] **Step 1: `PhotoField.svelte`** (captures/uploads an image → stores Blob → returns key)
```svelte
<script lang="ts">
  import { putImage, getImage } from '../lib/db';
  let { label, value = $bindable() }: { label: string; value: string | undefined } = $props();
  let url = $state('');
  $effect(() => {
    if (value) getImage(value).then(b => { if (b) url = URL.createObjectURL(b); });
  });
  async function onPick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const key = crypto.randomUUID();
    await putImage(key, file); value = key; url = URL.createObjectURL(file);
  }
</script>
<label>{label}
  <input type="file" accept="image/*" capture="environment" onchange={onPick} />
</label>
{#if url}<img src={url} alt={label} />{/if}
<style>img{max-width:100%;border-radius:10px;margin:6px 16px}label{display:block;margin:10px 16px}</style>
```

- [ ] **Step 2: `CardDetail.svelte`** (edit name, color, logo source, notes, photos, favorite, delete)
```svelte
<script lang="ts">
  import PhotoField from '../components/PhotoField.svelte';
  import { putCard, deleteCard, putImage } from '../lib/db';
  import { loadCards } from '../lib/stores';
  import { clearbitFetcher } from '../lib/logo/fetch';
  import type { Card } from '../lib/types';
  let { card, ondone }: { card: Card; ondone: () => void } = $props();
  let draft = $state<Card>({ ...card });
  async function save() { draft.updatedAt = Date.now(); await putCard(draft); await loadCards(); ondone(); }
  async function remove() { await deleteCard(card.id); await loadCards(); ondone(); }
  async function uploadLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
    const key = crypto.randomUUID(); await putImage(key, file);
    draft.logo = { source: 'uploaded', blobRef: key };
  }
  async function fetchLogo() {
    const blob = await clearbitFetcher.fetchLogo(draft.storeName);
    if (!blob) { alert('No logo found online.'); return; }
    const key = crypto.randomUUID(); await putImage(key, blob);
    draft.logo = { source: 'fetched', blobRef: key };
  }
</script>
<header><button onclick={ondone}>← Back</button><h2>Edit</h2></header>
<label>Name<input bind:value={draft.storeName} /></label>
<label>Brand color<input type="color" bind:value={draft.brandColor} /></label>
<div class="logo">
  <input type="file" accept="image/*" onchange={uploadLogo} />
  <button onclick={fetchLogo}>🌐 Fetch logo online</button>
</div>
<label>Notes<textarea bind:value={draft.notes}></textarea></label>
<PhotoField label="Front photo" bind:value={draft.frontPhotoRef} />
<PhotoField label="Back photo" bind:value={draft.backPhotoRef} />
<label class="row"><input type="checkbox" bind:checked={draft.favorite} /> Favorite</label>
<button class="save" onclick={save}>Save</button>
<button class="del" onclick={remove}>Delete card</button>
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  label{display:block;margin:10px 16px}.row{display:flex;gap:8px;align-items:center}
  input:not([type]),input[type=text],textarea{width:100%;padding:10px;border-radius:10px;
    border:1px solid #2a2a30;background:#161618;color:#eee}
  .logo{display:flex;gap:8px;margin:10px 16px}
  .save{display:block;width:calc(100% - 32px);margin:10px 16px;padding:14px;border:none;
    border-radius:12px;background:#2a6df4;color:#fff}
  .del{display:block;margin:6px 16px;background:none;border:none;color:#f66}
</style>
```

- [ ] **Step 3: Verify** `npm run check && npm run build`.
- [ ] **Step 4: Commit** `git add src/components/PhotoField.svelte src/screens/CardDetail.svelte && git commit -m "LoyaltyCards: card detail/edit (logo, photos, notes, delete)"`

---

# MILESTONE 11 — Checkout Screen

### Task 11.1: BarcodeView + Checkout (white bg, wake-lock, brightness tip)

**Files:** Create `src/components/BarcodeView.svelte`, replace stub `src/screens/Checkout.svelte`.

- [ ] **Step 1: `BarcodeView.svelte`**
```svelte
<script lang="ts">
  import { renderToCanvas } from '../lib/barcode/render';
  import type { BarcodeFormat } from '../lib/types';
  let { value, format }: { value: string; format: BarcodeFormat } = $props();
  let canvas: HTMLCanvasElement;
  $effect(() => { try { renderToCanvas(canvas, format, value); } catch {} });
</script>
<canvas bind:this={canvas}></canvas>
<style>canvas{max-width:90vw;height:auto}</style>
```

- [ ] **Step 2: `Checkout.svelte`** (fullscreen white; Wake Lock; one-time tip via localStorage)
```svelte
<script lang="ts">
  import BarcodeView from '../components/BarcodeView.svelte';
  import type { Card } from '../lib/types';
  let { card, onback, onedit }:
    { card: Card; onback: () => void; onedit: () => void } = $props();
  let showTip = $state(localStorage.getItem('brightnessTipSeen') !== '1');
  let wake: WakeLockSentinel | null = null;
  $effect(() => {
    // @ts-expect-error wakeLock may be missing
    navigator.wakeLock?.request('screen').then((w) => wake = w).catch(() => {});
    return () => wake?.release().catch(() => {});
  });
  function dismissTip() { showTip = false; localStorage.setItem('brightnessTipSeen', '1'); }
</script>
<div class="sheet" onclick={onback} role="button" tabindex="0"
     onkeydown={(e) => e.key === 'Escape' && onback()}>
  <div class="name">{card.storeName}</div>
  <BarcodeView value={card.barcodeValue} format={card.barcodeFormat} />
  <div class="num">{card.barcodeValue}</div>
  {#if showTip}
    <div class="tip" onclick={(e) => { e.stopPropagation(); dismissTip(); }} role="button" tabindex="0"
         onkeydown={() => {}}>☀️ Turn your screen brightness up for best scanning. (tap to dismiss)</div>
  {/if}
  <button class="edit" onclick={(e) => { e.stopPropagation(); onedit(); }}>Edit</button>
</div>
<style>
  .sheet{position:fixed;inset:0;background:#fff;color:#111;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:16px;padding:24px}
  .name{align-self:flex-start;font-weight:800;font-size:20px}
  .num{font-family:ui-monospace,monospace;letter-spacing:3px;font-size:18px}
  .tip{background:#fff3cd;color:#664d03;padding:10px 14px;border-radius:10px;font-size:14px;max-width:90vw}
  .edit{position:fixed;top:14px;right:14px;background:#eee;border:none;border-radius:10px;padding:8px 12px}
</style>
```
> Note: render the barcode black-on-white; do NOT auto-darken. The fullscreen white sheet maximizes contrast.

- [ ] **Step 3: Verify** `npm run check && npm run build`.
- [ ] **Step 4: Commit** `git add src/components/BarcodeView.svelte src/screens/Checkout.svelte && git commit -m "LoyaltyCards: checkout screen (barcode, wake-lock, brightness tip)"`

---

# MILESTONE 12 — Settings (export/import/reorder)

### Task 12.1: Settings screen

**Files:** Replace stub `src/screens/Settings.svelte`.

- [ ] **Step 1: Implement** (download export, upload import, simple up/down reorder)
```svelte
<script lang="ts">
  import { exportBackup, importBackup } from '../lib/backup';
  import { getAllCards, putCard } from '../lib/db';
  import { cards, loadCards } from '../lib/stores';
  import { get } from 'svelte/store';
  let { onback }: { onback: () => void } = $props();
  let msg = $state('');

  async function doExport() {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `loyaltycards-backup.json`;
    a.click();
  }
  async function doImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
    try { await importBackup(await file.text(), 'replace'); await loadCards(); msg = 'Imported ✓'; }
    catch (err) { msg = 'Import failed: ' + (err as Error).message; }
  }
  async function move(id: string, dir: -1 | 1) {
    const list = [...get(cards)];
    const i = list.findIndex(c => c.id === id); const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = { ...list[i], order: list[j].order }, b = { ...list[j], order: list[i].order };
    await putCard(a); await putCard(b); await loadCards();
  }
</script>
<header><button onclick={onback}>← Back</button><h2>Settings</h2></header>
<section>
  <button onclick={doExport}>⬇️ Export backup</button>
  <label class="imp">⬆️ Import backup<input type="file" accept="application/json" onchange={doImport} /></label>
  {#if msg}<p>{msg}</p>{/if}
</section>
<section>
  <h3>Reorder cards</h3>
  {#each $cards as c (c.id)}
    <div class="row"><span>{c.storeName}</span>
      <button onclick={() => move(c.id, -1)}>↑</button>
      <button onclick={() => move(c.id, 1)}>↓</button>
    </div>
  {/each}
</section>
<style>
  header{display:flex;gap:12px;align-items:center;padding:14px 16px}
  section{margin:12px 16px}button{cursor:pointer;margin-right:8px}
  .imp input{display:none}.imp{cursor:pointer;color:#6ea8fe}
  .row{display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #222}
</style>
```

- [ ] **Step 2: Verify + commit** `npm run check && npm run build && git add src/screens/Settings.svelte && git commit -m "LoyaltyCards: settings (export/import/reorder)"`

---

# MILESTONE 13 — PWA Polish & Icons

### Task 13.1: Icons + manifest verification + offline

**Files:** Create `public/icon-192.png`, `public/icon-512.png`, `public/favicon.svg`.

- [ ] **Step 1: Generate placeholder icons** (simple colored squares with 🪪 — replace with real art later)
```bash
cd /home/pi/Documents/development/LoyaltyCards
# Use ImageMagick if available, else any 192/512 png placeholder:
convert -size 192x192 xc:'#0b0b0d' -gravity center -pointsize 120 -fill white -annotate 0 '🪪' public/icon-192.png 2>/dev/null || \
  node -e "/* fallback: write a 1x1 png is not enough; create solid via canvas not available in node without deps */ console.log('Provide icons manually')"
convert -size 512x512 xc:'#0b0b0d' -gravity center -pointsize 320 -fill white -annotate 0 '🪪' public/icon-512.png 2>/dev/null || true
```
> If `convert` is unavailable, the engineer supplies two PNGs (192 & 512) by any means; the manifest references them. This is the only non-code asset.

- [ ] **Step 2: Build and confirm PWA artifacts**
```bash
npm run build
ls dist/ | grep -E 'manifest|sw\.js|workbox' && echo "PWA assets present"
```
Expected: `manifest.webmanifest`, `sw.js` (or `registerSW.js`) present.

- [ ] **Step 3: Manual offline check** (local preview)
```bash
npm run preview
```
Open the preview URL, install to home screen, toggle offline, reload → app shell loads. (Documented manual step.)

- [ ] **Step 4: Commit** `git add public && git commit -m "LoyaltyCards: PWA icons and manifest"`

---

# MILESTONE 14 — E2E Tests & Production Deploy

### Task 14.1: Playwright happy-path

**Files:** Create `e2e/smoke.spec.ts`, `playwright.config.ts`.

- [ ] **Step 1: `playwright.config.ts`**
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  webServer: { command: 'npm run build && npm run preview -- --port 4173', port: 4173, reuseExistingServer: false },
  use: { baseURL: 'http://localhost:4173' },
});
```

- [ ] **Step 2: `e2e/smoke.spec.ts`** (add a manual card → see it on home → open checkout)
```ts
import { test, expect } from '@playwright/test';
test('add a card manually and view its barcode', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('Migros');
  await page.locator('input').nth(1).fill('7612345678900');
  await page.getByText('Save').click();
  await expect(page.getByText('Migros')).toBeVisible();
  await page.getByText('Migros').first().click();
  await expect(page.locator('canvas')).toBeVisible();           // barcode rendered
  await expect(page.getByText('7612345678900')).toBeVisible();  // human-readable number
});
```

- [ ] **Step 3: Run** `npx playwright install --with-deps chromium && npm run e2e` → PASS.
- [ ] **Step 4: Commit** `git add e2e playwright.config.ts && git commit -m "LoyaltyCards: Playwright smoke test"`

### Task 14.2: Build, push real image, bump deploy

- [ ] **Step 1: Bump version + build the real image**
```bash
cd /home/pi/Documents/development/LoyaltyCards
docker build -t tomigorn/loyalty-cards:0.1.0 -t tomigorn/loyalty-cards:latest .
```
Expected: the multi-stage build runs `npm ci && npm run build`, nginx serves `dist/`.

- [ ] **Step 2: Push**
```bash
docker push tomigorn/loyalty-cards:0.1.0
docker push tomigorn/loyalty-cards:latest
```

- [ ] **Step 3: Point deploy at the real tag**

Edit `/home/pi/Projects/Docker/LoyaltyCards/.env`: set `IMAGE_TAG=0.1.0`. Then:
```bash
cd /home/pi/Projects/Docker/LoyaltyCards
docker compose pull && docker compose up -d
```

- [ ] **Step 4: Verify production**
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://loyalty-cards.holy-grail.ch/
```
Expected: `200`, and the page is now the real app (open it, add a card, open checkout).

- [ ] **Step 5: Tighten CSP** (now that the logo host is known): in `dynamic/loyalty-cards.yml`, narrow `connect-src 'self' https:` → `connect-src 'self' https://logo.clearbit.com`. Traefik auto-reloads. Re-verify the app + logo fetch still work.

- [ ] **Step 6: Tell the user** the app is live and ask them to do a real at-the-till test with one card, and to confirm whether to flip the `_global/checklist.md` Deployed/Reviewed marks (per rules, only the user sets ✅).

---

## Self-Review (author check)

**Spec coverage:** scan (M5,M9) ✓ · manual entry (M9) ✓ · show barcode at till (M11) ✓ · home grid A + search (M8) ✓ · on-device IndexedDB (M2) ✓ · export/import (M7,M12) ✓ · logos catalog→fetch→tile (M6) ✓ · front/back photos (M10) ✓ · notes (M10) ✓ · search + reorder/favorites (M8,M12) ✓ · PWA/offline (M1,M13) ✓ · barcode formats (M3) ✓ · brightness limitation mitigations: white bg + wake-lock + number + one-time tip (M11) ✓ · Docker Hub image + compose + Traefik route + camera-allowed CSP (M0,M14) ✓ · checklist row (M0) ✓ · growth-path interfaces: storage layer (M2), swappable LogoFetcher (M6) ✓ · testing Vitest+Playwright (M2–M8, M14) ✓.

**Open items now resolved in-plan:** logo service = Clearbit-style fetch behind `LogoFetcher` (M6); import = replace-default + merge option (M7); build/push = local `docker build && docker push` (M0,M14) — Jenkins not required for v1.

**Type consistency:** `Card`/`CatalogEntry`/`BarcodeFormat`/`Logo` defined once (M2) and used unchanged throughout. `validateBarcode`, `toBwipId`/`renderToCanvas`, `mapDetectedFormat`/`startScan`, `resolveLogoUrl`/`ResolveDeps`, `exportBackup`/`importBackup`, `cards`/`query`/`filtered`/`loadCards` names are consistent across tasks.

**Placeholder scan:** the only intentional stubs are the four empty screen components created in M8-Step3, each explicitly replaced in M9-M12; the icon asset in M13 is a documented non-code deliverable. No banned "TBD/handle edge cases/similar to Task N" placeholders remain.
