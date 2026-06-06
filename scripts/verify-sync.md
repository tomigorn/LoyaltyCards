# Sync Verification — Result (image sync two-context, 2026-06-06)

**Outcome: GREEN — photo tile visible on Context B after image upload on Context A.**

---

## Image Sync Verification

### Bug Found and Fixed

**Root cause:** Migration 3 (`3_card_images.go`) added `frontPhoto`, `backPhoto`, and `logoImage` as file fields, but never added the companion text fields `frontPhotoRef`, `backPhotoRef`, and `logoBlobRef`. These UUID fields are written by `toRemote()` and are essential: `pullImages()` in `engine.ts` reads `remote['frontPhotoRef']` as the IndexedDB key for each downloaded blob. Without the fields in PocketBase, the value was `undefined`, the early-exit guard `if (!ref || !file) continue` fired, and no images were ever downloaded on B.

**Fix (backend):** Added migration `4_image_ref_fields.go` in `LoyaltyCards-Sync/migrations/` — adds all three text ref fields. Rebuilt `loyaltycards-sync:local` image.

**No changes to PWA sync engine code were required.** The engine already correctly sends and reads these fields; the schema gap was the only defect.

### Verification Run (2026-06-06)

**Environment:**
- Backend image: `loyaltycards-sync:local` (rebuilt with migration 4)
- PWA: `VITE_SYNC_URL=http://localhost:8091 npm run build` + `npx vite preview --port 4173`
- Playwright spec: `e2e-live/photo-sync.spec.ts` (two isolated browser contexts)

**Commands:**
```bash
# 1. Ephemeral backend (rebuilt image)
docker rm -f pb-e2e 2>/dev/null
docker run -d --name pb-e2e -p 8091:8090 \
  -e PB_ADMIN_EMAIL=a@b.c -e PB_ADMIN_PASSWORD=password123456 \
  loyaltycards-sync:local
sleep 6
# health check → 200

# 2. Build + preview
VITE_SYNC_URL=http://localhost:8091 npm run build
npx vite preview --port 4173 &
# preview check → 200

# 3. Two-context photo sync test
npx playwright test e2e-live/photo-sync.spec.ts --config e2e-live/playwright.config.ts

# 4. Tear down
docker rm -f pb-e2e
pkill -f "vite preview"
```

**Test result:**
```
Running 1 test using 1 worker

signUp done for photo...@example.com
addCard done: PhotoStore
Front photo set via file input
Context A: photo tile visible — upload succeeded
Waiting for A to push to PocketBase...
PB cards after A push: {"items":[{...,"frontPhoto":"front_photo_v79ueeu3vn.jpg",...}],"totalItems":1}
PB record frontPhoto field: front_photo_v79ueeu3vn.jpg
logIn done for photo...@example.com
Waiting for B to pull from PocketBase...
Context B: img.cardimg is visible — image sync confirmed   ← PRIMARY ASSERTION PASSED

1 passed (24.8s)
```

**Assertions verified:**

| # | Assertion | Result |
|---|-----------|--------|
| 1 | Context A: `img.cardimg` visible after setting front photo and saving | PASS |
| 2 | PocketBase record has `frontPhoto` file field populated | PASS |
| 3 | Context B (fresh storage, same account): `img.cardimg` visible after login + pull | PASS (primary assertion) |

---

# Sync Verification — Result (autodate fix, 2026-06-05)

**Outcome: GREEN — all assertions passed.**

---

## Environment

- Backend image: `loyaltycards-sync:local` (includes `created`/`updated` autodate fields on `cards` collection)
- PWA: Phase C sync engine (`src/lib/sync/engine.ts`)
- Playwright: two isolated browser contexts on `http://localhost:4173`

---

## Commands Run

```bash
# 1. Ephemeral backend
docker rm -f pb-e2e 2>/dev/null
docker run -d --name pb-e2e -p 8091:8090 \
  -e PB_ADMIN_EMAIL=a@b.c -e PB_ADMIN_PASSWORD=password123456 \
  loyaltycards-sync:local
sleep 6
# health check       → 200
# sort=updated check → 200  (fix confirmed; was 400 before)

# 2. Build + preview
cd /home/pi/Documents/development/LoyaltyCards
VITE_SYNC_URL=http://localhost:8091 npm run build
npx vite preview --port 4173 &
# preview check      → 200

# 3. Two-context Playwright test
npx playwright test e2e-live/sync.spec.ts --config e2e-live/playwright.config.ts

# 4. Tear down
docker rm -f pb-e2e
pkill -f "vite preview"
```

---

## Test Result

```
Running 1 test using 1 worker

signUp done for sync...@example.com
addCard done: SyncTestShop
Waiting for push...
PB cards after A push: {"totalItems":1, ...}   ← card confirmed in PocketBase
logIn done for sync...@example.com
Context B sees the card — pull worked           ← ASSERTION 1 PASSED
Context B deleted the card
Context A no longer shows the card — tombstone applied  ← ASSERTIONS 2+3 PASSED

1 passed (27.9s)
```

---

## Assertions Verified

| # | Assertion | Result |
|---|-----------|--------|
| 1 | Card appears in PocketBase after Context A push (`totalItems > 0`) | PASS |
| 2 | Context B (fresh storage, same account) sees the card after login — pull works | PASS |
| 3 | Context B deletes the card; card disappears from B's view | PASS |
| 4 | Context A reloads; card is gone — tombstone propagated from B to A | PASS |

---

## Fix Applied to Test Harness

The navigation flow in `e2e-live/sync.spec.ts` was corrected:

- **Before:** `pageB.getByText(STORE_NAME).click()` — clicked the text span inside the tile div, which did not reliably trigger navigation
- **After:** `pageB.getByRole('button', { name: STORE_NAME }).click()` — clicks the `role="button"` div directly
- Also added explicit waits: wait for the "Edit" button to be visible before clicking it (Checkout screen), and increased timeout for "Delete card" button

These were test-harness fixes only; no sync engine code was changed.

---

## Previous Blocker (resolved)

In the prior run (`loyaltycards-sync:local` without autodate):

- `GET /api/collections/cards/records?sort=updated` returned **HTTP 400**
- `pull()` in `engine.ts` always threw and no cards were ever pulled
- The fix (adding `created`/`updated` autodate fields to the `cards` schema) resolved this

Now both `sort=updated` and `filter=updated>...` return **200** on the image used for this run.

---

## Unit / Integration Test Coverage (safety net)

All 101 unit/integration tests remain green (25 test files), covering every sync code path against a mocked PocketBase. The live e2e test above proves the full stack with the real backend.
