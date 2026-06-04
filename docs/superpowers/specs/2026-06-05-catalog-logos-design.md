# Catalog & Logos v2 — Design

**Date:** 2026-06-05
**Status:** Approved design, pending spec review → implementation plan
**Builds on:** `2026-06-04-loyaltycards-design.md` (v1)

## 1. Goal

Upgrade the loyalty-card catalog from 6 hand-entered shops to a real **~400–600 shop
database** covering Switzerland, its neighbours (DE/FR/IT/AT) and North America (US/CA), so
that adding a card auto-suggests the shop, applies its branding, and shows a real **logo
fetched once from logo.dev and cached on-device**. No logo binaries are bundled in the repo
or image (trademark-clean); data only.

## 2. Scope

### In scope
- A bundled multi-country **shop catalog** (data only: name, aliases, domain, country, …).
- **Fuzzy name matching** (`matchShop`) powering an autocomplete in the Add flow.
- **On-demand logo fetch** from logo.dev, **cached on-device** (IndexedDB), shared per domain.
- **Auto-fetch on catalog match** (with a Settings toggle), dominant-colour extraction for tiles.
- **Logo-on-brand-color tile style** (style B) on the home grid.

### Non-goals (separate future specs)
- #4 barcode → brand inference (GS1 prefixes / loyalty patterns).
- #5 camera OCR / logo image-recognition.
- Any backend. Editing the catalog in-app.

## 3. Catalog data

Bundled static data, **split per country** for maintainability and merged into one array:
`src/lib/catalog/data/{ch,de,fr,it,at,us,ca}.ts` → `src/lib/catalog/data.ts` re-exports
`CATALOG: CatalogEntry[]`.

```
CatalogEntry {
  id: string            // stable slug, e.g. 'ch-migros'
  name: string          // display name
  aliases: string[]     // alternate spellings / sub-brands
  domain: string        // logo.dev key, e.g. 'migros.ch'  (verified during impl)
  country: string       // ISO-2: CH, DE, FR, IT, AT, US, CA
  defaultFormat?: BarcodeFormat
  brandColor?: string   // optional; only set for a few majors, else derived from logo
}
```

- Target the **common loyalty-program chains** per country (groceries, pharmacies, fuel,
  fashion, electronics, DIY, travel/airline). Quality over hitting exactly 100; a wrong
  `domain` only means a graceful tile fallback, not a crash.
- Domains are **verified during implementation** (a wrong domain = no logo).

## 4. Fuzzy name matching

Pure, fully-tested module `src/lib/catalog/match.ts`:

```
matchShop(query: string, limit = 5): CatalogEntry[]
```

Ranking pipeline on a normalised query (lowercase, strip accents/diacritics, drop
punctuation, collapse whitespace):
1. Exact name or alias match (highest).
2. Prefix match on name/alias.
3. Substring match.
4. Trigram / Levenshtein similarity above a threshold, ranked by score.

Returns the top `limit` entries, de-duplicated by `id`. No external dependency — a small
hand-rolled normaliser + similarity score, unit-tested against a fixture of tricky inputs.

## 5. Logo fetch + cache

### Fetch
`src/lib/logo/fetch.ts` replaces the Clearbit fetcher with a logo.dev one behind the
existing `LogoFetcher` interface (swappable):

```
https://img.logo.dev/{domain}?token={VITE_LOGODEV_TOKEN}&size=128&format=png
```

- **Token:** a *publishable* logo.dev key, provided at build time via `VITE_LOGODEV_TOKEN`
  (Vite inlines `import.meta.env.VITE_LOGODEV_TOKEN`). Injected as a Docker `--build-arg`
  → `ENV` before `npm run build`. Kept out of git (build-time secret, though publishable).
- Failures (offline / 404 / missing token) are non-fatal → fall through to tile.

### Cache
- New IndexedDB object store **`logos`**, keyed by `domain` → `Blob`. Fetched **once per
  domain, ever**, and shared across every card of that shop.
- A small **`logoColors`** map (domain → hex) stores the dominant colour extracted at fetch
  time (see §6). Lives in the same DB (a keyed store or a row in a meta store).
- `src/lib/db.ts` gains: `getLogo(domain)`, `putLogo(domain, blob)`, `getLogoColor(domain)`,
  `putLogoColor(domain, hex)`, `clearLogoCache()`.

## 6. Brand colour

Most catalog entries have no hand-set `brandColor`. When a logo is fetched, sample its
**dominant colour** via a small offscreen `<canvas>` (downscale to ~16×16, average/most-common
non-transparent pixel) and store it in `logoColors[domain]`. Used as the tile/accent colour
and the generated-tile fallback colour. Hand-set `brandColor` (when present in the catalog)
always wins. No new dependency.

## 7. Resolution chain (updated)

`resolveLogoUrl(card, deps)` precedence:
1. **User upload** — `card.logo.blobRef` present → that blob.
2. **Cached shop logo** — card linked to a catalog shop (`card.catalogId` → `domain`) and
   `logos[domain]` exists → that blob.
3. **Auto-fetch** — if auto-fetch enabled and a domain is known but uncached → fetch, cache,
   use it (and extract colour).
4. **Generated tile** — colour from `logoColors[domain]` ?? `brandColor` ?? neutral.

`deps` stays injected (for tests): `getImage`, `getLogo`, `putLogo`, `makeObjectUrl`,
`generateTile`, `fetchLogo`, `extractColor`, `autoFetchEnabled`.

## 8. Add-flow integration

`src/screens/AddCard.svelte`: as the user types the store name, show a **live suggestion
list** (`matchShop`) of up to 5 shops, each with cached/placeholder logo + name + country
chip. Selecting one:
- fills `storeName`,
- sets `defaultFormat` (unless the user already touched format),
- links the card via **`catalogId`**,
- on save, if auto-fetch is on, fetches + caches the logo.

Free-text (no selection) still works → generated tile.

## 9. Tile style

**Style B — logo on brand colour** (selected): home-grid tiles keep the **brand-colour
background** (the colour from §6 — hand-set `brandColor`, else the dominant colour extracted
from the fetched logo, else neutral) and render the fetched logo on a small **white chip**
centred on the tile, with the store name beneath. This keeps the vivid v1 look while adding
real logos; the white chip guarantees logo legibility on any background. Cards with no logo
fall back to the coloured initials tile (unchanged). `CardTile.svelte` is updated to draw the
white-chip-on-colour variant when a logo URL resolves.

## 10. Data-model & storage changes

- `Card`: add optional **`catalogId?: string`**.
- `CatalogEntry`: add `domain`, `country`; `brandColor` optional; `logoAsset` retired
  (the `public/catalog-logos/` mechanism from v1 is removed — fetch replaces it).
- IndexedDB: add `logos` store (domain→Blob) and logo-colour storage; bump DB version with a
  migration that creates the new store(s) without touching `cards`/`images`.
- **Backup:** the `logos` cache and `logoColors` are **excluded** from export (re-fetchable);
  user-uploaded images and all card fields (incl. `catalogId`) are still included.

## 11. Settings

- **"Auto-fetch logos"** toggle (default **on**), persisted in localStorage.
- **"Clear logo cache"** action → `clearLogoCache()`.

## 12. Migration / compatibility

- Drop-in replace of `data.ts`. Existing v1 cards still match by name via the catalog;
  `catalogId` populates on next match/edit. No data loss.
- DB upgrade is additive (new stores only).
- CSP (Traefik `dynamic/loyalty-cards.yml`): replace `connect-src ... logo.clearbit.com`
  and `img-src` with `https://img.logo.dev` (and drop clearbit).

## 13. Testing

- **Unit:** `matchShop` ranking + normalisation (fixture of tricky/accented/partial inputs);
  logo.dev URL builder; `logos` cache get/put; dominant-colour extractor (canvas, in jsdom or
  node env); resolution chain precedence with an injected fake fetcher.
- **E2E (Playwright):** type a partial name → suggestion appears → select → card saved with
  branding; (logo fetch mocked/stubbed so the test is offline-deterministic).

## 14. Open items (resolved in implementation)

- The exact per-country shop lists + domain verification (the bulk of the work; compiled and
  spot-checked during implementation).
- Dominant-colour algorithm details (average vs modal pixel) — pick during implementation.
- Where the `logoColors` data lives (dedicated store vs meta rows) — implementation detail.
