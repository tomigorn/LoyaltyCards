# Barcode→Brand Detect & Camera OCR — Design

**Date:** 2026-06-05
**Status:** Approved (pre-authorised), → implementation
**Builds on:** catalog & logos v2.

Two independent "auto-identify the shop" features. Both feed the existing catalog
(`matchShop` / `catalogId`) so a card gets the right name, branding and logo with less typing.

---

## F5 — Barcode → brand auto-detect

### Goal
When a card's barcode is scanned or typed, try to infer which catalog shop it belongs to
from the number itself, and offer that as a suggestion.

### Honest constraint
There is **no free, bulk dataset** mapping loyalty-card barcode prefixes to retailers (GS1
company prefixes aren't freely resolvable offline). So this ships as an **extensible
mechanism with a small, curated seed** — it gets better as prefixes are added, and is a
no-op (no false positives) when nothing matches. We will **not invent** prefixes.

### Design
- New data file `src/lib/barcode/prefixes.ts`: `BARCODE_PREFIXES: { prefix: string; catalogId: string }[]`
  — seeded only with prefixes we can establish with reasonable confidence (start small, may be
  just a handful; document that it grows over time).
- New `src/lib/barcode/detect.ts`: `detectBrand(value: string): CatalogEntry | undefined`
  — longest-prefix match of the normalised digits against `BARCODE_PREFIXES`, returns the
  linked catalog entry via `findCatalogById`. Pure, unit-tested with a synthetic prefix table
  injected (so the test doesn't depend on the seed contents).
- **Integration (non-intrusive):** in `AddCard`, after a **scan** result arrives (and the user
  hasn't already picked a shop), call `detectBrand(value)`. If it matches, pre-fill the store
  name + `catalogId` + brand (same as picking from autocomplete), but leave everything editable.
  Never override a user's explicit pick. If no match → unchanged behaviour.
- No UI of its own beyond the auto-fill; it just makes scanning smarter where data exists.

### Testing
Unit: `detectBrand` longest-prefix matching + no-match returns undefined (synthetic table).

---

## F6 — Camera OCR shop detection

### Goal
Let the user **photograph a loyalty card**; OCR the text on it on-device, and suggest the
matching catalog shop (or pre-fill the name).

### Design
- **Library:** `tesseract.js` (WASM OCR), **lazy-loaded** only when the user invokes OCR, so it
  never bloats the normal app load.
- **Offline + CSP-clean:** self-host Tesseract's worker + core wasm + English traineddata under
  `public/tesseract/` and point Tesseract's `workerPath`/`corePath`/`langPath` at them (no CDN).
  The `eng` traineddata (~10-15 MB) is fetched on first OCR use and cached by the service worker.
- **New module `src/lib/ocr/ocr.ts`:** `recognizeText(blob: Blob): Promise<string>` — lazy
  `import('tesseract.js')`, run recognition, return raw text. And
  `suggestShopsFromText(text: string): CatalogEntry[]` — split text into candidate tokens/lines,
  run each through `matchShop`, return the best deduped matches (top ~5). The token→match logic
  is pure and unit-tested; the Tesseract call itself is integration (manual/E2E-lite, not unit).
- **UI:** add a third add-method to `AddCard` — **"🖼️ Photo of card"** — that opens a file/camera
  input (`accept="image/*" capture="environment"`), shows a spinner while OCR runs, then shows
  the suggested shops (reusing the `ShopSuggest`-style list). Picking one pre-fills name +
  `catalogId` + brand. If OCR finds nothing useful, fall back to manual entry with whatever text
  was read pre-filled into the name field.
- **CSP:** add `'wasm-unsafe-eval'` to `script-src` (WASM instantiation) in the Traefik route;
  `worker-src 'self' blob:` is already present. (Applied at deploy time with the build.)

### Testing
Unit: `suggestShopsFromText` (synthetic OCR text → expected shop matches; e.g. text containing
"MIGROS CUMULUS 9000..." → Migros). Tesseract itself verified manually on a real device.

### Non-goals
Logo image-recognition / ML classification; multi-language OCR (English model only for v1;
it still reads most Latin-script brand names fine).

---

## Rollout
Both land on branch `features-v0.3`, ship together as `0.3.0`. F5 is small; F6 carries the
Tesseract assets + CSP change. Commit in chunks (data, detect, ocr lib, UI, assets/CSP).
