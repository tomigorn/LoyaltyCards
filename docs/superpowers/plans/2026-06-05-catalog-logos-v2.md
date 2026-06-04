# Catalog & Logos v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade LoyaltyCards from a 6-entry catalog to a ~400-600 shop multi-country database with fuzzy name-matching, an add-flow autocomplete, and real logos fetched once from logo.dev and cached on-device — rendered as logo-on-brand-color tiles (style B).

**Architecture:** All client-side (no backend). New IndexedDB stores cache fetched logos (by domain) and their extracted dominant colours. A pure `matchShop()` ranks catalog entries for the autocomplete. `resolveLogoUrl` gains a precedence chain (user upload → cached shop logo → auto-fetch → tile). logo.dev token is a build-time Vite env var injected as a Docker build-arg.

**Tech Stack:** Svelte 5 + Vite + TypeScript, `idb`, Vitest + `fake-indexeddb`, Playwright, logo.dev, Docker, Traefik.

**Spec:** `docs/superpowers/specs/2026-06-05-catalog-logos-design.md`. Branch: `catalog-logos-v2`.

**Conventions (unchanged from v1):** commit `LoyaltyCards: <desc>` (no AI co-author trailer); tests in `tests/*.test.ts` (jsdom default; use `// @vitest-environment node` first-line for tests that round-trip Blobs through fake-indexeddb); run a file with `npx vitest run tests/<f>.test.ts`; verify with `npm run test`, `npm run check`, `npm run build`.

---

## File Structure (new / changed)

```
src/lib/types.ts                 # +catalogId on Card; CatalogEntry gains domain/country, drops logoAsset
src/lib/db.ts                    # DB v2: +logos store, +logoColors store, +get/put/clear funcs
src/lib/catalog/types.ts         # (re-uses CatalogEntry from types.ts)
src/lib/catalog/data/ch.ts ...   # per-country CatalogEntry[] (ch,de,fr,it,at,us,ca)
src/lib/catalog/data.ts          # merges per-country arrays into CATALOG
src/lib/catalog/catalog.ts       # findCatalogEntry (by name/alias/id) — kept, updated
src/lib/catalog/match.ts         # normalize + similarity + matchShop()
src/lib/logo/fetch.ts            # logoDevFetcher (by domain) + buildLogoUrl
src/lib/logo/color.ts            # extractDominantColor(blob)
src/lib/logo/resolve.ts          # updated precedence chain
src/lib/settings.ts              # autoFetch toggle (localStorage)
src/components/CardTile.svelte    # style B (white chip on brand colour); catalog-linked logos
src/components/ShopSuggest.svelte # autocomplete suggestion list
src/screens/AddCard.svelte        # integrate ShopSuggest + catalogId linking
src/screens/CardDetail.svelte     # fetch-by-domain
src/screens/Settings.svelte       # auto-fetch toggle + clear logo cache
Dockerfile                        # ARG/ENV VITE_LOGODEV_TOKEN before npm run build
Projects/Docker/LoyaltyCards/...  # build-arg wiring (deploy)
Projects/Docker/Traefik/.../loyalty-cards.yml  # CSP → img.logo.dev
```

---

# MILESTONE 1 — Types & IndexedDB v2

### Task 1.1: Type changes

**Files:** Modify `src/lib/types.ts`.

- [ ] **Step 1: Edit types** — add `catalogId?` to `Card`; update `CatalogEntry`.
```ts
// in Card interface, add:
  catalogId?: string;        // links a card to a CatalogEntry.id
// replace CatalogEntry with:
export interface CatalogEntry {
  id: string;                // e.g. 'ch-migros'
  name: string;
  aliases: string[];
  domain: string;            // logo.dev key, e.g. 'migros.ch'
  country: string;           // ISO-2: CH, DE, FR, IT, AT, US, CA
  defaultFormat?: BarcodeFormat;
  brandColor?: string;
}
```
- [ ] **Step 2: Verify + commit**
```bash
npm run check   # expect errors in data.ts (old shape) — fixed in M2; if check fails ONLY there, proceed
git add src/lib/types.ts && git commit -m "LoyaltyCards: catalog v2 types (catalogId, domain, country)"
```
> Note: `npm run check` may fail until M2 replaces `data.ts`. That is expected; commit anyway (types come first).

### Task 1.2: IndexedDB v2 (logos + logoColors stores)

**Files:** Modify `src/lib/db.ts`, Test `tests/db-logos.test.ts`.

- [ ] **Step 1: Failing test** `tests/db-logos.test.ts`
```ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { getLogo, putLogo, getLogoColor, putLogoColor, clearLogoCache, resetDB } from '../src/lib/db';

describe('logo cache', () => {
  beforeEach(async () => { await resetDB(); await clearLogoCache(); });
  it('stores and reads a logo blob by domain', async () => {
    await putLogo('migros.ch', new Blob(['PNG'], { type: 'image/png' }));
    expect((await getLogo('migros.ch'))?.size).toBe(3);
  });
  it('stores and reads a logo colour by domain', async () => {
    await putLogoColor('migros.ch', '#FF6600');
    expect(await getLogoColor('migros.ch')).toBe('#FF6600');
  });
  it('clearLogoCache empties logos and colours', async () => {
    await putLogo('a.com', new Blob(['x'])); await putLogoColor('a.com', '#111');
    await clearLogoCache();
    expect(await getLogo('a.com')).toBeUndefined();
    expect(await getLogoColor('a.com')).toBeUndefined();
  });
});
```
- [ ] **Step 2: Run — expect FAIL** (`getLogo` undefined).
- [ ] **Step 3: Implement** — bump version to 2, add stores + functions in `src/lib/db.ts`.
```ts
const VERSION = 2;
// in openDB upgrade(db, oldVersion):
//   (keep existing cards/images creation guarded by contains())
//   if (!db.objectStoreNames.contains('logos')) db.createObjectStore('logos');
//   if (!db.objectStoreNames.contains('logoColors')) db.createObjectStore('logoColors');
// add exported functions:
export async function getLogo(domain: string): Promise<Blob | undefined> {
  return (await open()).get('logos', domain);
}
export async function putLogo(domain: string, blob: Blob) { await (await open()).put('logos', blob, domain); }
export async function getLogoColor(domain: string): Promise<string | undefined> {
  return (await open()).get('logoColors', domain);
}
export async function putLogoColor(domain: string, hex: string) { await (await open()).put('logoColors', hex, domain); }
export async function clearLogoCache() {
  const db = await open();
  await db.clear('logos'); await db.clear('logoColors');
}
```
Update the `upgrade` callback signature to `upgrade(db, oldVersion)` and create the two new stores (guarded). Existing `cards`/`images` stores remain untouched (additive migration).
- [ ] **Step 4: Run — expect PASS.** Also `npx vitest run tests/db.test.ts` (v1 db tests still pass).
- [ ] **Step 5: Commit**
```bash
git add src/lib/db.ts tests/db-logos.test.ts
git commit -m "LoyaltyCards: IndexedDB v2 logo + colour cache"
```

---

# MILESTONE 2 — Catalog data + fuzzy matching

### Task 2.1: Per-country data scaffolding + merge

**Files:** Create `src/lib/catalog/data/{ch,de,fr,it,at,us,ca}.ts`, rewrite `src/lib/catalog/data.ts`, update `src/lib/catalog/catalog.ts`.

- [ ] **Step 1: Create the seven country files** with this exact shape (seed set shown for CH; each file exports `const <CC>: CatalogEntry[]`). Start each country with the seed entries below, then **expand in Task 2.3**.

`src/lib/catalog/data/ch.ts` (seed — expand later):
```ts
import type { CatalogEntry } from '../../types';
export const CH: CatalogEntry[] = [
  { id: 'ch-migros', name: 'Migros', aliases: ['cumulus'], domain: 'migros.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#FF6600' },
  { id: 'ch-coop', name: 'Coop', aliases: ['supercard', 'coop city'], domain: 'coop.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'ch-denner', name: 'Denner', aliases: [], domain: 'denner.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'ch-manor', name: 'Manor', aliases: ['manor card'], domain: 'manor.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'ch-digitec', name: 'Digitec', aliases: ['digitec galaxus', 'galaxus'], domain: 'digitec.ch', country: 'CH', defaultFormat: 'code128' },
  { id: 'ch-ikea', name: 'IKEA', aliases: ['ikea family'], domain: 'ikea.com', country: 'CH', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'ch-sbb', name: 'SBB', aliases: ['cff', 'ffs', 'swisspass'], domain: 'sbb.ch', country: 'CH', defaultFormat: 'aztec' },
];
```
`de.ts`, `fr.ts`, `it.ts`, `at.ts`, `us.ts`, `ca.ts`: same shape, export `DE`/`FR`/`IT`/`AT`/`US`/`CA`. Seed each with 5-8 obvious chains (e.g. DE: Lidl `lidl.de`, Aldi `aldi.de`, Rewe `rewe.de`, dm `dm.de`, Rossmann `rossmann.de`, Edeka `edeka.de`, Payback `payback.de`; FR: Carrefour `carrefour.fr`, Fnac `fnac.com`, Decathlon `decathlon.fr`, Auchan `auchan.fr`, E.Leclerc `leclerc.com`; IT: Esselunga `esselunga.it`, Conad `conad.it`, Coop Italia `coop.it`, Carrefour `carrefour.it`; AT: Billa `billa.at`, Spar `spar.at`, Hofer `hofer.at`, dm `dm.at`; US: Walmart `walmart.com`, Target `target.com`, Costco `costco.com`, CVS `cvs.com`, Walgreens `walgreens.com`, Starbucks `starbucks.com`, Kroger `kroger.com`; CA: Loblaws `loblaws.ca`, Shoppers Drug Mart `shoppersdrugmart.ca`, Canadian Tire `canadiantire.ca`, Tim Hortons `timhortons.ca`). Use lowercase ISO-2 var names matching the export (`DE`, etc.).

- [ ] **Step 2: Rewrite `src/lib/catalog/data.ts`** to merge:
```ts
import type { CatalogEntry } from '../types';
import { CH } from './data/ch';
import { DE } from './data/de';
import { FR } from './data/fr';
import { IT } from './data/it';
import { AT } from './data/at';
import { US } from './data/us';
import { CA } from './data/ca';
export const CATALOG: CatalogEntry[] = [...CH, ...DE, ...FR, ...IT, ...AT, ...US, ...CA];
```
- [ ] **Step 3: Update `src/lib/catalog/catalog.ts`** — keep `findCatalogEntry` but match on new fields (note: `logoAsset` is gone):
```ts
import { CATALOG } from './data';
import type { CatalogEntry } from '../types';
export function findCatalogEntry(query: string): CatalogEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return CATALOG.find(e =>
    e.id === q ||
    e.name.toLowerCase() === q ||
    e.aliases.some(a => a.toLowerCase() === q) ||
    e.name.toLowerCase().includes(q));
}
export function findCatalogById(id: string): CatalogEntry | undefined {
  return CATALOG.find(e => e.id === id);
}
export { CATALOG };
```
- [ ] **Step 4: Update `tests/catalog.test.ts`** if needed so it still passes (the existing assertions — Migros by name, Coop by alias 'coop city', undefined for unknown — still hold with the seed). Run `npx vitest run tests/catalog.test.ts` → PASS, and `npm run check` → 0 errors (types now satisfied).
- [ ] **Step 5: Commit**
```bash
git add src/lib/catalog tests/catalog.test.ts && git commit -m "LoyaltyCards: multi-country catalog data structure"
```

### Task 2.2: Fuzzy matching `matchShop` (TDD)

**Files:** Create `src/lib/catalog/match.ts`, Test `tests/match.test.ts`.

- [ ] **Step 1: Failing test** `tests/match.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { normalize, matchShop } from '../src/lib/catalog/match';

describe('normalize', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalize('  Décathlon! ')).toBe('decathlon');
    expect(normalize('E.Leclerc')).toBe('eleclerc');
  });
});

describe('matchShop', () => {
  it('returns exact name match first', () => {
    expect(matchShop('migros')[0].name).toBe('Migros');
  });
  it('matches a prefix', () => {
    expect(matchShop('mig').some(e => e.name === 'Migros')).toBe(true);
  });
  it('matches an alias', () => {
    expect(matchShop('cumulus')[0].name).toBe('Migros');
  });
  it('tolerates a typo via similarity', () => {
    expect(matchShop('migors').some(e => e.name === 'Migros')).toBe(true);
  });
  it('returns at most `limit` results', () => {
    expect(matchShop('co', 3).length).toBeLessThanOrEqual(3);
  });
  it('returns [] for empty query', () => {
    expect(matchShop('')).toEqual([]);
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/catalog/match.ts`**
```ts
import { CATALOG } from './data';
import type { CatalogEntry } from '../types';

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase().replace(/[^a-z0-9]/g, '');                // drop punctuation/space
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}
// Sørensen–Dice coefficient on bigrams (0..1)
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a), B = bigrams(b);
  const bMap = new Map<string, number>();
  for (const g of B) bMap.set(g, (bMap.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of A) { const c = bMap.get(g) ?? 0; if (c > 0) { inter++; bMap.set(g, c - 1); } }
  return (2 * inter) / (A.length + B.length);
}

function score(qn: string, e: CatalogEntry): number {
  const names = [e.name, ...e.aliases].map(normalize);
  let best = 0;
  for (const n of names) {
    if (n === qn) return 1;                 // exact
    if (n.startsWith(qn)) best = Math.max(best, 0.9);
    else if (n.includes(qn)) best = Math.max(best, 0.75);
    best = Math.max(best, dice(qn, n) * 0.7); // fuzzy, capped below substring
  }
  return best;
}

export function matchShop(query: string, limit = 5): CatalogEntry[] {
  const qn = normalize(query);
  if (!qn) return [];
  return CATALOG
    .map(e => ({ e, s: score(qn, e) }))
    .filter(x => x.s >= 0.3)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.e);
}
```
- [ ] **Step 4: Run — expect PASS.** Then `npm run test` (whole suite green).
- [ ] **Step 5: Commit**
```bash
git add src/lib/catalog/match.ts tests/match.test.ts && git commit -m "LoyaltyCards: fuzzy shop name matching"
```

### Task 2.3: Expand the catalog (one commit per country)

**Files:** Modify each `src/lib/catalog/data/<cc>.ts`.

For **each** country file, expand the seed to a fuller list of that country's common
loyalty-program chains (groceries, pharmacies/drugstores, fuel, fashion, electronics, DIY,
airlines/travel). Aim for breadth of *real, well-known* chains (roughly 30-100; do not invent
shops to pad). For every entry: set a correct `domain` (the brand's primary site — this is the
logo.dev key; **verify it resolves to the real brand**, e.g. `lidl.de` not `lidl.com` if the
DE site differs), sensible `aliases` (loyalty-program name, common abbreviations), `country`,
and `defaultFormat` if known. Leave `brandColor` unset unless you are confident of the hex.

- [ ] **Step 1 (×7):** Expand `ch.ts`, then commit `LoyaltyCards: expand CH catalog`. Repeat for `de`, `fr`, `it`, `at`, `us`, `ca` (one commit each: `LoyaltyCards: expand <CC> catalog`).
- [ ] **Step 2:** After each file, run `npm run check` (0 errors) and `npx vitest run tests/match.test.ts` (still green).
> Domain accuracy matters but is non-fatal: a wrong domain degrades to a tile. Do NOT block on uncertainty — use the best-known primary domain and move on.

---

# MILESTONE 3 — Logo fetch, colour extraction, resolution

### Task 3.1: logo.dev fetcher + URL builder (TDD)

**Files:** Rewrite `src/lib/logo/fetch.ts`, Test `tests/logo-fetch.test.ts`.

- [ ] **Step 1: Failing test** `tests/logo-fetch.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { buildLogoUrl } from '../src/lib/logo/fetch';

describe('buildLogoUrl', () => {
  it('builds a logo.dev url with the domain and token', () => {
    const url = buildLogoUrl('migros.ch', 'pk_test123');
    expect(url).toContain('https://img.logo.dev/migros.ch');
    expect(url).toContain('token=pk_test123');
  });
  it('returns null when no token', () => {
    expect(buildLogoUrl('migros.ch', '')).toBeNull();
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/logo/fetch.ts`**
```ts
export interface LogoFetcher { fetchLogo(domain: string): Promise<Blob | null>; }

const TOKEN = (import.meta as any).env?.VITE_LOGODEV_TOKEN ?? '';

export function buildLogoUrl(domain: string, token: string = TOKEN): string | null {
  if (!token) return null;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128&format=png`;
}

/** Fetch a logo by domain from logo.dev. On-demand only; failure is non-fatal. */
export const logoDevFetcher: LogoFetcher = {
  async fetchLogo(domain) {
    const url = buildLogoUrl(domain);
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch { return null; }
  },
};
```
- [ ] **Step 4: Run — expect PASS.** `npm run check` → 0 errors.
- [ ] **Step 5: Commit**
```bash
git add src/lib/logo/fetch.ts tests/logo-fetch.test.ts && git commit -m "LoyaltyCards: logo.dev fetcher"
```

### Task 3.2: Dominant colour extraction (TDD)

**Files:** Create `src/lib/logo/color.ts`, Test `tests/logo-color.test.ts`.

- [ ] **Step 1: Failing test** (test the pure pixel-reducer; canvas decoding is covered by E2E/manual)
```ts
import { describe, it, expect } from 'vitest';
import { dominantHexFromPixels } from '../src/lib/logo/color';

describe('dominantHexFromPixels', () => {
  it('ignores transparent pixels and returns the most common opaque colour', () => {
    // 3 pixels: red opaque, red opaque, transparent
    const px = new Uint8ClampedArray([255,0,0,255, 255,0,0,255, 0,0,0,0]);
    expect(dominantHexFromPixels(px)).toBe('#ff0000');
  });
  it('falls back to a neutral when all transparent', () => {
    expect(dominantHexFromPixels(new Uint8ClampedArray([0,0,0,0]))).toBe('#444444');
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/logo/color.ts`**
```ts
const FALLBACK = '#444444';

/** Reduce RGBA pixels to the most frequent opaque colour (quantised), as hex. */
export function dominantHexFromPixels(px: Uint8ClampedArray): string {
  const counts = new Map<string, number>();
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 200) continue;                       // skip transparent/near-transparent
    // quantise to 5 bits/channel to group similar shades, but report the exact bucket centre
    const r = px[i] & 0xf8, g = px[i + 1] & 0xf8, b = px[i + 2] & 0xf8;
    // skip near-white and near-black (logos on white bg / outlines)
    if (r > 240 && g > 240 && b > 240) continue;
    if (r < 16 && g < 16 && b < 16) continue;
    const key = `${r},${g},${b}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = '', bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k; }
  if (!best) return FALLBACK;
  const [r, g, b] = best.split(',').map(Number);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Decode a logo Blob and extract its dominant colour (browser only). */
export async function extractDominantColor(blob: Blob): Promise<string> {
  try {
    const bmp = await createImageBitmap(blob);
    const size = 24;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0, size, size);
    return dominantHexFromPixels(ctx.getImageData(0, 0, size, size).data);
  } catch { return FALLBACK; }
}
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit**
```bash
git add src/lib/logo/color.ts tests/logo-color.test.ts && git commit -m "LoyaltyCards: dominant colour extraction"
```

### Task 3.3: Resolution chain (TDD)

**Files:** Rewrite `src/lib/logo/resolve.ts`, Test `tests/resolve.test.ts` (replace v1 test).

- [ ] **Step 1: Replace `tests/resolve.test.ts`**
```ts
import { describe, it, expect } from 'vitest';
import { resolveLogoUrl, type ResolveDeps } from '../src/lib/logo/resolve';
import type { Card } from '../src/lib/types';

const base: Card = {
  id: 'c1', storeName: 'Migros', barcodeValue: '1', barcodeFormat: 'ean13',
  brandColor: '#FF6600', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt: 1,
};
const deps = (over: Partial<ResolveDeps> = {}): ResolveDeps => ({
  getImage: async () => undefined,
  getLogo: async () => undefined,
  putLogo: async () => {},
  putLogoColor: async () => {},
  makeObjectUrl: () => 'blob://x',
  generateTile: () => 'data:tile',
  fetchLogo: async () => null,
  extractColor: async () => '#000000',
  autoFetchEnabled: () => true,
  domainFor: () => undefined,
  ...over,
});

describe('resolveLogoUrl', () => {
  it('1) uses the user-uploaded blob first', async () => {
    const card = { ...base, logo: { source: 'uploaded' as const, blobRef: 'i' } };
    const url = await resolveLogoUrl(card, deps({ getImage: async () => new Blob(['x']), makeObjectUrl: () => 'blob://up' }));
    expect(url).toBe('blob://up');
  });
  it('2) uses a cached shop logo when catalog-linked', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    const url = await resolveLogoUrl(card, deps({
      domainFor: () => 'migros.ch',
      getLogo: async (d) => d === 'migros.ch' ? new Blob(['x']) : undefined,
      makeObjectUrl: () => 'blob://cached',
    }));
    expect(url).toBe('blob://cached');
  });
  it('3) auto-fetches when enabled and uncached', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    let put = '';
    const url = await resolveLogoUrl(card, deps({
      domainFor: () => 'migros.ch',
      fetchLogo: async () => new Blob(['x']),
      putLogo: async (d) => { put = d; },
      makeObjectUrl: () => 'blob://fetched',
    }));
    expect(url).toBe('blob://fetched');
    expect(put).toBe('migros.ch');
  });
  it('4) falls back to a generated tile', async () => {
    const url = await resolveLogoUrl(base, deps({ autoFetchEnabled: () => false }));
    expect(url).toBe('data:tile');
  });
  it('does not fetch when auto-fetch disabled', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    let fetched = false;
    const url = await resolveLogoUrl(card, deps({
      domainFor: () => 'migros.ch',
      autoFetchEnabled: () => false,
      fetchLogo: async () => { fetched = true; return new Blob(['x']); },
    }));
    expect(fetched).toBe(false);
    expect(url).toBe('data:tile');
  });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/logo/resolve.ts`**
```ts
import type { Card } from '../types';

export interface ResolveDeps {
  getImage: (key: string) => Promise<Blob | undefined>;
  getLogo: (domain: string) => Promise<Blob | undefined>;
  putLogo: (domain: string, blob: Blob) => Promise<void>;
  putLogoColor: (domain: string, hex: string) => Promise<void>;
  makeObjectUrl: (blob: Blob) => string;
  generateTile: (name: string, color: string) => string;
  fetchLogo: (domain: string) => Promise<Blob | null>;
  extractColor: (blob: Blob) => Promise<string>;
  autoFetchEnabled: () => boolean;
  domainFor: (catalogId: string) => string | undefined;
}

export async function resolveLogoUrl(card: Card, d: ResolveDeps): Promise<string> {
  // 1) user upload
  if (card.logo.blobRef) {
    const b = await d.getImage(card.logo.blobRef);
    if (b) return d.makeObjectUrl(b);
  }
  // catalog-linked domain
  const domain = card.catalogId ? d.domainFor(card.catalogId) : undefined;
  if (domain) {
    // 2) cached shop logo
    const cached = await d.getLogo(domain);
    if (cached) return d.makeObjectUrl(cached);
    // 3) auto-fetch
    if (d.autoFetchEnabled()) {
      const fetched = await d.fetchLogo(domain);
      if (fetched) {
        await d.putLogo(domain, fetched);
        try { await d.putLogoColor(domain, await d.extractColor(fetched)); } catch { /* ignore */ }
        return d.makeObjectUrl(fetched);
      }
    }
  }
  // 4) tile
  return d.generateTile(card.storeName, card.brandColor);
}
```
- [ ] **Step 4: Run — expect PASS.** `npm run test` (whole suite). `npm run check`.
- [ ] **Step 5: Commit**
```bash
git add src/lib/logo/resolve.ts tests/resolve.test.ts && git commit -m "LoyaltyCards: logo resolution precedence chain"
```

---

# MILESTONE 4 — Settings (auto-fetch) + wiring helper

### Task 4.1: Settings module (TDD)

**Files:** Create `src/lib/settings.ts`, Test `tests/settings.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getAutoFetch, setAutoFetch } from '../src/lib/settings';

describe('settings', () => {
  beforeEach(() => localStorage.clear());
  it('defaults auto-fetch to true', () => { expect(getAutoFetch()).toBe(true); });
  it('persists a false value', () => { setAutoFetch(false); expect(getAutoFetch()).toBe(false); });
});
```
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `src/lib/settings.ts`**
```ts
const KEY = 'autoFetchLogos';
export function getAutoFetch(): boolean { return localStorage.getItem(KEY) !== '0'; }
export function setAutoFetch(on: boolean): void { localStorage.setItem(KEY, on ? '1' : '0'); }
```
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `git add src/lib/settings.ts tests/settings.test.ts && git commit -m "LoyaltyCards: auto-fetch setting"`

### Task 4.2: Central logo-resolution helper

**Files:** Create `src/lib/logo/resolveCard.ts`.

- [ ] **Step 1: Implement a single place that wires `resolveLogoUrl` to the real deps** (used by CardTile so the dependency wiring isn't duplicated):
```ts
import { resolveLogoUrl } from './resolve';
import { getImage, getLogo, putLogo, putLogoColor } from '../db';
import { generateTile } from './tile';
import { logoDevFetcher } from './fetch';
import { extractDominantColor } from './color';
import { getAutoFetch } from '../settings';
import { findCatalogById } from '../catalog/catalog';
import type { Card } from '../types';

export function resolveCardLogo(card: Card): Promise<string> {
  return resolveLogoUrl(card, {
    getImage, getLogo, putLogo, putLogoColor,
    makeObjectUrl: URL.createObjectURL,
    generateTile,
    fetchLogo: (d) => logoDevFetcher.fetchLogo(d),
    extractColor: extractDominantColor,
    autoFetchEnabled: getAutoFetch,
    domainFor: (id) => findCatalogById(id)?.domain,
  });
}
```
- [ ] **Step 2: Verify** `npm run check`. Commit `git add src/lib/logo/resolveCard.ts && git commit -m "LoyaltyCards: card logo resolution helper"`

---

# MILESTONE 5 — UI: tiles (style B), autocomplete, settings

### Task 5.1: CardTile — style B (white chip on brand colour)

**Files:** Modify `src/components/CardTile.svelte`.

- [ ] **Step 1: Rewrite CardTile** to use `resolveCardLogo`, the brand/extracted colour as the tile background, and a white chip around the logo. Revoke object URLs on cleanup. Catalog colour: prefer `card.brandColor`, else the cached `logoColors[domain]`, else neutral.
```svelte
<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveCardLogo } from '../lib/logo/resolveCard';
  import { getLogoColor } from '../lib/db';
  import { findCatalogById } from '../lib/catalog/catalog';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let url = $state('');
  let bg = $state(card.brandColor || '#2a2a30');
  $effect(() => {
    let made = '';
    resolveCardLogo(card).then(u => { url = u; made = u; });
    // resolve tile background colour: brandColor wins, else extracted colour for the shop
    if (!card.brandColor && card.catalogId) {
      const dom = findCatalogById(card.catalogId)?.domain;
      if (dom) getLogoColor(dom).then(c => { if (c) bg = c; });
    }
    return () => { if (made.startsWith('blob:')) URL.revokeObjectURL(made); };
  });
  const isTile = $derived(url.startsWith('data:')); // generated tile → no white chip
</script>
<button class="tile" style="background:{bg}" onclick={() => onopen(card)}>
  {#if url && !isTile}
    <span class="chip"><img src={url} alt={card.storeName} /></span>
  {/if}
  <span class="nm">{card.storeName}</span>
</button>
<style>
  .tile{border:none;border-radius:14px;aspect-ratio:1.4;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:7px;color:#fff;cursor:pointer;padding:8px;overflow:hidden}
  .chip{background:#fff;border-radius:9px;padding:6px;display:flex;align-items:center;justify-content:center}
  .chip img{width:42px;height:42px;object-fit:contain;display:block}
  .nm{font-size:13px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.35)}
</style>
```
> Note: when the resolved URL is a generated tile (`data:`), it already encodes the initials+colour, so we show only the name on the coloured background (no white chip). When it's a real logo (`blob:`), we show the white chip.
- [ ] **Step 2: Verify** `npm run check`, `npm run build`, `npm run test`. Commit `git add src/components/CardTile.svelte && git commit -m "LoyaltyCards: tile style B (logo on brand colour)"`

### Task 5.2: ShopSuggest autocomplete component

**Files:** Create `src/components/ShopSuggest.svelte`.

- [ ] **Step 1: Implement** — given a query, list `matchShop` results; emit the chosen entry.
```svelte
<script lang="ts">
  import { matchShop } from '../lib/catalog/match';
  import type { CatalogEntry } from '../lib/types';
  let { query, onpick }: { query: string; onpick: (e: CatalogEntry) => void } = $props();
  const results = $derived(matchShop(query, 5));
</script>
{#if query.trim() && results.length}
  <div class="menu">
    {#each results as e (e.id)}
      <button class="opt" onclick={() => onpick(e)}>
        <span class="nm">{e.name}</span><span class="cc">{e.country}</span>
      </button>
    {/each}
  </div>
{/if}
<style>
  .menu{background:#1b1b20;border:1px solid #33333a;border-radius:10px;overflow:hidden;margin:4px 16px 0}
  .opt{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;background:none;border:none;
    border-bottom:1px solid #26262c;color:#eee;cursor:pointer;text-align:left}
  .opt:last-child{border-bottom:none}
  .nm{font-size:14px}.cc{margin-left:auto;color:#8a8a94;font-size:11px;border:1px solid #3a3a42;border-radius:5px;padding:1px 5px}
</style>
```
- [ ] **Step 2: Verify** `npm run check`. Commit `git add src/components/ShopSuggest.svelte && git commit -m "LoyaltyCards: shop autocomplete component"`

### Task 5.3: AddCard — integrate autocomplete + catalogId

**Files:** Modify `src/screens/AddCard.svelte`.

- [ ] **Step 1: Wire ShopSuggest** under the store-name field; on pick, set name, defaultFormat (if not touched), and `catalogId`; clear suggestions after pick. Update `save()` to persist `catalogId` and the chosen brandColor.
```svelte
<!-- in <script>: -->
import ShopSuggest from '../components/ShopSuggest.svelte';
import type { CatalogEntry } from '../lib/types';
let catalogId = $state<string | undefined>(undefined);
let brandColor = $state<string | undefined>(undefined);
let picked = $state(false);
function pick(e: CatalogEntry) {
  storeName = e.name; catalogId = e.id; brandColor = e.brandColor;
  if (!formatTouched && e.defaultFormat) format = e.defaultFormat;
  picked = true;
}
// when the user edits the name again, unlink:
$effect(() => { if (picked && storeName !== '') { /* keep */ } });
<!-- in the manual block, under the store-name input: -->
<ShopSuggest query={storeName} onpick={pick} />
<!-- in save(), set on the card object: -->
//   brandColor: brandColor ?? '#444',
//   catalogId,
//   logo: { source: catalogId ? 'catalog' : 'generated' },
```
Concretely, replace the card-construction in `save()` so it uses `catalogId` and `brandColor` state (remove the old `findCatalogEntry(storeName)` lookup — selection now drives it; but KEEP a fallback: if the user typed a name without picking, still try `findCatalogEntry(storeName)` to auto-link an exact match). Final `save()`:
```ts
async function save() {
  const v = validateBarcode(format, value);
  if (!v.ok) { err = v.error ?? 'Invalid barcode'; return; }
  if (!storeName.trim()) { err = 'Enter a store name'; return; }
  const cat = catalogId ? findCatalogById(catalogId) : findCatalogEntry(storeName);
  const now = Date.now();
  const all = await getAllCards();
  const order = all.reduce((m, c) => Math.max(m, c.order), 0) + 1;
  const card: Card = {
    id: crypto.randomUUID(), storeName: storeName.trim(), barcodeValue: value,
    barcodeFormat: format, brandColor: cat?.brandColor ?? '#444',
    logo: { source: cat ? 'catalog' : 'generated' }, catalogId: cat?.id, notes: '',
    favorite: false, order, createdAt: now, updatedAt: now,
  };
  await putCard(card); await loadCards(); ondone();
}
```
Add imports: `findCatalogById` from `../lib/catalog/catalog`.
- [ ] **Step 2: Verify** `npm run check`, `npm run build`, `npm run test`. Commit `git add src/screens/AddCard.svelte && git commit -m "LoyaltyCards: add-flow autocomplete + catalog linking"`

### Task 5.4: Settings — auto-fetch toggle + clear cache

**Files:** Modify `src/screens/Settings.svelte`.

- [ ] **Step 1: Add a "Logos" section** with the toggle and a clear-cache button.
```svelte
<!-- script additions -->
import { getAutoFetch, setAutoFetch } from '../lib/settings';
import { clearLogoCache } from '../lib/db';
let autoFetch = $state(getAutoFetch());
function toggleAuto() { autoFetch = !autoFetch; setAutoFetch(autoFetch); }
async function clearLogos() { await clearLogoCache(); msg = 'Logo cache cleared ✓'; }
<!-- template, new section -->
<section>
  <h3>Logos</h3>
  <label class="row"><input type="checkbox" checked={autoFetch} onchange={toggleAuto} /> Auto-fetch logos</label>
  <button onclick={clearLogos}>Clear logo cache</button>
</section>
```
- [ ] **Step 2: Verify** `npm run check`, `npm run build`, `npm run test`. Commit `git add src/screens/Settings.svelte && git commit -m "LoyaltyCards: settings auto-fetch toggle + clear logo cache"`

### Task 5.5: CardDetail — fetch logo by domain

**Files:** Modify `src/screens/CardDetail.svelte`.

- [ ] **Step 1: Update `fetchLogo`** to use the catalog domain (via `catalogId`) through logo.dev; if no domain, guess from name. Store the fetched blob in the shared logo cache AND set the card's uploaded blobRef is NOT needed — instead, since the card is catalog-linked, a manual fetch should populate the shared cache. Simplest: keep manual fetch writing a per-card uploaded blob (overrides), using logo.dev by domain:
```ts
import { logoDevFetcher } from '../lib/logo/fetch';
import { findCatalogById } from '../lib/catalog/catalog';
async function fetchLogo() {
  const domain = draft.catalogId ? findCatalogById(draft.catalogId)?.domain
    : draft.storeName.trim().toLowerCase().replace(/\s+/g, '') + '.com';
  if (!domain) { alert('No domain to fetch from.'); return; }
  const blob = await logoDevFetcher.fetchLogo(domain);
  if (!blob) { alert('No logo found online.'); return; }
  if (draft.logo.blobRef) await deleteImage(draft.logo.blobRef);
  const key = crypto.randomUUID(); await putImage(key, blob);
  draft.logo = { source: 'fetched', blobRef: key };
}
```
- [ ] **Step 2: Verify** `npm run check`, `npm run build`, `npm run test`. Commit `git add src/screens/CardDetail.svelte && git commit -m "LoyaltyCards: fetch card logo by domain via logo.dev"`

---

# MILESTONE 6 — Build wiring, CSP, deploy

### Task 6.1: Dockerfile build-arg for the token

**Files:** Modify `Dockerfile`.

- [ ] **Step 1: Add ARG/ENV before the build**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_LOGODEV_TOKEN=""
ENV VITE_LOGODEV_TOKEN=$VITE_LOGODEV_TOKEN
RUN npm run build
```
- [ ] **Step 2: Commit** `git add Dockerfile && git commit -m "LoyaltyCards: pass logo.dev token as build arg"`

### Task 6.2: Deploy compose build-arg (deploy repo)

**Files:** Modify `/home/pi/Projects/Docker/LoyaltyCards/docker-compose.yaml`, `.env`, `.env.example`.
> This lives in the infra repo `/home/pi/Projects` — the human handles committing it per their conventions.

- [ ] **Step 1:** Since the deploy compose currently *pulls* a prebuilt image, the token must be baked at image-build time (done on the source side: `docker build --build-arg VITE_LOGODEV_TOKEN=<pk> -t tomigorn/loyalty-cards:<tag> .`). Document this in the deploy `.env.example`:
```bash
# .env.example additions (the token is used at image BUILD time, not runtime):
# LOGODEV_TOKEN=         # publishable logo.dev key; pass via: docker build --build-arg VITE_LOGODEV_TOKEN=$LOGODEV_TOKEN
```
No compose service change is required (the image is prebuilt with the token). Record the build command in the deploy README/notes.
- [ ] **Step 2:** (human) set the real token where they keep build secrets.

### Task 6.3: CSP → logo.dev (Traefik)

**Files:** Modify `/home/pi/Projects/Docker/Traefik/traefik/dynamic/loyalty-cards.yml`.

- [ ] **Step 1:** Change `img-src` and `connect-src` to allow logo.dev; drop clearbit:
```
img-src 'self' data: blob: https://img.logo.dev;
connect-src 'self' https://img.logo.dev;
```
Traefik auto-reloads the dynamic file. (Human commits this infra change.)

---

# MILESTONE 7 — E2E, build, deploy

### Task 7.1: E2E for autocomplete (offline-deterministic)

**Files:** Modify `e2e/smoke.spec.ts` or add `e2e/catalog.spec.ts`.

- [ ] **Step 1: Add a test** that types a partial name, sees a suggestion, picks it, saves, and verifies the card appears. Stub the network so logo.dev is not actually called (route abort), keeping it deterministic:
```ts
import { test, expect } from '@playwright/test';
test('autocomplete suggests and links a catalog shop', async ({ page }) => {
  await page.route('https://img.logo.dev/**', r => r.abort());   // offline-deterministic
  await page.goto('/');
  await page.getByLabel('Add card').click();
  await page.getByText('Enter manually').click();
  await page.getByPlaceholder('e.g. Migros').fill('mig');
  await expect(page.getByText('Migros')).toBeVisible();          // suggestion
  await page.getByText('Migros').first().click();                // pick
  await page.locator('input').nth(1).fill('7613269001234');
  await page.locator('select').selectOption({ label: 'Code 128' });
  await page.getByText('Save').click();
  await expect(page.getByText('Migros')).toBeVisible();          // tile on home
});
```
- [ ] **Step 2: Run** `npm run e2e` → all pass (this + the original smoke). Commit `git add e2e && git commit -m "LoyaltyCards: e2e for catalog autocomplete"`

### Task 7.2: Full verification, build & deploy

- [ ] **Step 1:** `npm run check` (0 errors), `npm run test` (all green), `npm run build` (ok), `npm run e2e` (all pass).
- [ ] **Step 2:** Build & push the new image WITH the token (human provides `$LOGODEV_TOKEN`):
```bash
cd /home/pi/Documents/development/LoyaltyCards
docker build --build-arg VITE_LOGODEV_TOKEN="$LOGODEV_TOKEN" -t tomigorn/loyalty-cards:0.2.0 -t tomigorn/loyalty-cards:latest .
docker push tomigorn/loyalty-cards:0.2.0 && docker push tomigorn/loyalty-cards:latest
```
- [ ] **Step 3:** Bump deploy tag + redeploy:
```bash
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=0.2.0/' /home/pi/Projects/Docker/LoyaltyCards/.env
cd /home/pi/Projects/Docker/LoyaltyCards && docker compose pull && docker compose up -d
curl -sS -o /dev/null -w "%{http_code}\n" https://loyalty-cards.holy-grail.ch/   # expect 200
```
- [ ] **Step 4:** Manual check on a real device: add a card via autocomplete, confirm the logo appears (needs the token); confirm Settings auto-fetch toggle + clear-cache work.

---

## Self-Review (author check)

**Spec coverage:** multi-country catalog data (M2.1, 2.3) ✓ · fuzzy `matchShop` (M2.2) ✓ · logo.dev fetch by domain + token via build-arg (M3.1, M6.1) ✓ · on-device logo cache `logos`+`logoColors` (M1.2) ✓ · auto-fetch on catalog match + Settings toggle (M3.3, M4.1, M5.4) ✓ · dominant-colour extraction (M3.2) ✓ · resolution precedence chain (M3.3) ✓ · add-flow autocomplete + `catalogId` (M5.2, 5.3) ✓ · tile style B (M5.1) ✓ · `Card.catalogId` + CatalogEntry domain/country, logoAsset retired (M1.1) ✓ · backup excludes logo cache (no change needed — `exportBackup` only walks card-referenced images; the `logos`/`logoColors` stores are never read by it — **verify in M7.1 that an export after a fetch contains no logo-cache data**) ✓ · CSP → img.logo.dev (M6.3) ✓ · migration additive (M1.2) ✓ · tests unit+e2e (throughout, M7.1) ✓.

**Backup note:** v1 `exportBackup` only serialises `cards` + their referenced `images`. The new `logos`/`logoColors` stores are NOT referenced, so they are already excluded — no code change. (Confirm by inspection during M7.)

**Placeholder scan:** the only deferred work is the *content* of the per-country catalogs (M2.3), which is data-entry with explicit format + seed examples + domain-verification guidance, not a code placeholder. No banned "TBD/handle edge cases/similar to Task N".

**Type consistency:** `CatalogEntry` (id/name/aliases/domain/country/defaultFormat?/brandColor?), `Card.catalogId?`, `ResolveDeps` (getImage/getLogo/putLogo/putLogoColor/makeObjectUrl/generateTile/fetchLogo/extractColor/autoFetchEnabled/domainFor), `matchShop(query,limit)`, `buildLogoUrl(domain,token)`, `logoDevFetcher.fetchLogo(domain)`, `extractDominantColor`/`dominantHexFromPixels`, `getLogo/putLogo/getLogoColor/putLogoColor/clearLogoCache`, `getAutoFetch/setAutoFetch`, `findCatalogById` — names are used consistently across tasks.
