# LoyaltyCards — Design (v1)

**Date:** 2026-06-04
**Status:** Approved design, pending spec review → implementation plan

## 1. Goal & Principles

A clean, ad-free, nag-free replacement for the old Stocard app (killed after Klarna's
acquisition). Store loyalty/rewards cards digitally and show their barcode at the
checkout till.

Guiding principles:

- **Local-first** — cards live on the user's device; no account required.
- **Private** — no tracking, no ads, no upsells, no automatic network calls.
- **Offline** — fully usable with no connectivity once installed.
- **Self-hosted** — served from the user's Raspberry Pi behind Traefik.
- **Grow-able** — built so multi-user/sync *could* be added later without a rewrite,
  but none of that complexity is built now (YAGNI).

## 2. Scope

### In scope (v1)

- Add a card by **scanning** its barcode with the camera.
- Add a card **manually** (type number + pick format).
- **Show the barcode** fullscreen at the till.
- A **home screen** listing all cards (logo grid).
- **Logos/branding** per card (catalog → on-demand fetch → generated tile).
- **Front/back photos** of the physical card.
- **Notes** per card.
- **Search** + **reorder/favorites**.
- **Export/import** backup (the only safety net for local-first data).
- Installable **PWA**, offline-capable.

### Non-goals (v1)

Accounts, sync, sharing, Apple/Google Wallet passes, offers/promotions,
geolocation store suggestions, an online catalog admin UI. A backend of any kind.

## 3. Architecture

- **Installable PWA** built with **Svelte + Vite** + `vite-plugin-pwa`.
- **100% client-side. No backend in v1.**
- Data stored **on-device in IndexedDB** (via `idb`). Images stored as Blobs.
- Service worker precaches the app shell → works offline after first load.
- Served as **static files** from a small **nginx** container, behind **Traefik**
  (HTTPS + secure-headers, consistent with the user's other routes).

### Barcode handling

- **Scanning:** try the native `BarcodeDetector` API first (Android Chrome supports the
  common formats); fall back to `@zxing/browser` where unavailable.
- **Rendering:** `bwip-js` (renders every needed format: EAN, UPC, Code128, Code39,
  ITF, Codabar, QR, Aztec, PDF417, Data Matrix).
- **Supported formats (the standard loyalty set):**
  `ean13, ean8, upca, upce, code128, code39, itf, codabar, qr, aztec, pdf417, datamatrix`.

### At-checkout screen — known limitation

PWAs **cannot programmatically set screen brightness** (no web API exists; native-only).
Mitigations, all decided:

- Render the barcode **black on a pure-white fullscreen** background (max scanner contrast).
- **Keep the screen awake** while shown (Wake Lock API).
- Show the **human-readable number** below the barcode as a cashier fallback.
- Show a **one-time tip** ("turn your brightness up for best scanning") on first barcode open.

## 4. Data Model

```
Card {
  id: string (uuid)
  storeName: string
  barcodeValue: string
  barcodeFormat: enum (see supported formats)
  brandColor: string (hex)
  logo: { source: 'catalog' | 'fetched' | 'uploaded' | 'generated', blobRef?: string }
  notes: string
  frontPhotoRef?: string   // Blob in IndexedDB
  backPhotoRef?: string
  favorite: boolean
  order: number
  createdAt: number
  updatedAt: number
}

CatalogEntry {              // bundled static data, ships with the app
  id: string
  name: string
  aliases: string[]
  brandColor: string (hex)
  logoAsset: string         // path to a bundled logo image
  defaultFormat?: enum
}
```

### Logo resolution chain

When a card needs a logo: **bundled catalog match → on-demand online fetch → generated
color+initials tile**. The user can override with an uploaded/snapped image at any time.

- The online fetch is **never automatic** — only when the user taps "fetch logo" (preserves
  privacy: no passive leak of which stores they use).
- The catalog starts **small** (the user's actual stores; Swiss/DE retailers) and grows over
  time. It is plain data, easy to extend.

**Parked sub-decision:** which online logo service to use (e.g. favicon-of-domain,
logo.dev, Brandfetch). Decided during implementation; the fetch is behind an interface so
the choice is swappable.

**v1 shipped behavior (honest note):** the bundled catalog supplies each store's
**brand color + name + default barcode format**. Catalog **logo images** load from
`public/catalog-logos/<logoAsset>` and degrade gracefully to a generated colored-initials
tile when the file is absent. **No third-party logos are bundled by default** (trademark);
the user drops their own logo files into `public/catalog-logos/`, or uses the on-demand
online fetch, or uploads an image per card. So the effective logo chain is:
uploaded/fetched blob → catalog asset (if present) → generated tile.

## 5. Screens & Flows

1. **Home** — logo grid (layout A): big color tiles, 2 per row. 🔍 search icon + ⚙️ settings.
   Tap a card → Checkout. "+" tile → Add card.
2. **Checkout** — fullscreen, white bg, large rendered barcode, store name top,
   human-readable number bottom, wake-lock on, one-time brightness tip. Tap = back.
3. **Add card** — choose **Scan** (camera) or **Manual** (number + format). Then pick a store
   from the catalog (auto-fills logo + color + maybe default format) or type a free name.
4. **Card detail / edit** — name, brand color, logo (catalog/fetch/upload/tile), notes,
   front/back photos, favorite toggle, delete.
5. **Settings** — export backup, import backup, manage card order, (brightness tip reset).

## 6. Backup / Data Safety

- **Export:** a single downloadable **JSON** file containing all cards and images
  (images base64-encoded inline). Self-contained and human-inspectable.
- **Import:** restore from such a file (replace or merge — decided in plan).
- This is the **only** safety net for local-first data, so it is a first-class feature,
  not an afterthought. Encourage periodic export.

## 7. Deployment

### Source vs deploy split (per user decision)

- **Source code** lives in the existing git repo at
  `/home/pi/Documents/development/LoyaltyCards` (preserving its 245-commit history).
  Contains the Svelte app + a multi-stage **Dockerfile** (node build → nginx static).
- **Deployment** is a **separate Docker Compose project** at
  `/home/pi/Projects/Docker/LoyaltyCards`, following the user's mandated sample structure
  (`docker-compose.yaml`, `.env.example`, `.env`, `.gitignore`).

### Build → Docker Hub → pull (decided)

- The **source repo** builds a Docker image and **pushes it to Docker Hub** as
  **`tomigorn/loyalty-cards`** (the existing "loyalty cards backend" Docker Hub repo is
  renamed/repurposed to this image name).
- The **deploy compose project** at `/home/pi/Projects/Docker/LoyaltyCards` **pulls**
  `tomigorn/loyalty-cards` and runs it (no build on the Pi). `COMPOSE_PROJECT_NAME=LoyaltyCards`.
- **Image tag** pinned via an `.env` var (e.g. `IMAGE_TAG`) so updates are explicit.

### Traefik route (to be set up)

- Public hostname **`loyalty-cards.holy-grail.ch`** is already created at Cloudflare
  (tunnel ingress). The **Traefik router still needs to be wired** via container labels on
  the LoyaltyCards service: `Host(\`loyalty-cards.holy-grail.ch\`)`, HTTPS entrypoint, TLS,
  plus **secure-headers** (and optionally rate-limiting) middleware — matching the
  conventions of an existing project (e.g. BackdropCarousel) and joining the Traefik network.

### Build/push pipeline

- A repo job exists in Jenkins ("LoyaltyCards Multibranch Pipeline" →
  `github.com/tomigorn/LoyaltyCards`). v1 may reuse Jenkins to build+push the image, or use a
  simple local Taskfile/`docker build && docker push`. Chosen in the implementation plan.

### Checklist

- A new **all-❌ row** will be added to `/home/pi/Projects/Docker/_global/checklist.md`
  when the Docker project is created (per the user's checklist rules; checkmarks/versions
  remain the user's to fill).

## 8. Testing (TDD)

- **Vitest** (unit): barcode format validation, logo-resolution chain, IndexedDB storage
  layer, export/import round-trip, generated-tile rendering.
- **Playwright** (E2E): add → list → checkout flow; export then re-import; offline load
  after install.

## 9. Growth Path (avoid painting into a corner)

- Storage sits behind a **small interface**, so a future sync backend can slot in without
  touching UI code.
- Card schema kept **stable** and serializable (the export format doubles as a sync payload
  later).
- Catalog stays **data-driven** (no logic coupling), so it can later move server-side.

## 10. Open Items (resolved during implementation, not blockers)

- Which online logo-fetch service.
- Import semantics: replace vs merge.
- Build/push mechanism: reuse the Jenkins multibranch pipeline vs a simple
  Taskfile/`docker build && docker push`.
