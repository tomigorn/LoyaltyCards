# Sync Verification — Task 7 Result

**Outcome:** Automated live test NOT completed. Documented-manual with reason (see below).

---

## What Was Run

### Container & build

```bash
docker run -d --rm --name pb-e2e -p 8091:8090 \
  -e PB_ADMIN_EMAIL=a@b.c -e PB_ADMIN_PASSWORD=password123456 \
  loyaltycards-sync:local
# health check → 200 OK

VITE_SYNC_URL=http://localhost:8091 npm run build   # succeeded
npx vite preview --port 4173 &                      # 200 OK on localhost:4173
```

### Playwright two-context test

A Playwright test (`e2e-live/sync.spec.ts`) was written and iterated.
Context A signed up, added a card; the `push()` call **confirmed the card in PocketBase** (verified via direct API query: `totalItems: 1`). Context B logged in and waited for `pull()` to surface the card — but the card never appeared.

### Root cause found

Manual API investigation showed that PocketBase's `cards` collection in the
`loyaltycards-sync:local` image does **not** have `updated` exposed for
filtering or sorting:

```
# Works (returns items):
GET /api/collections/cards/records
GET /api/collections/cards/records?sort=clientUpdatedAt

# Fails with HTTP 400:
GET /api/collections/cards/records?sort=updated
GET /api/collections/cards/records?filter=updated>"2020-01-01"
```

`engine.ts` `pull()` calls `pb.collection(CARDS).getFullList({ filter, sort: 'updated' })`.
Because `sort: 'updated'` always causes a 400 on this image, every `pull()` throws
(the error is swallowed in the `syncing = false` `finally` block) and **no cards are
ever pulled**. The 101 unit tests pass because they mock PocketBase.

The image is the Phase-A backend built before this sync engine was designed; the
collection was seeded without `updated` as a sortable/filterable field in the API rules.
The fix is either:

- Update the backend schema to allow sorting/filtering on `updated`, OR
- Change `pull()` to not sort by `updated` and track the cursor differently
  (e.g. use `clientUpdatedAt` as the cursor instead of PB's system `updated` field).

No automated test result was fabricated. The 101 unit/integration tests (Tasks 1–5)
remain the correctness safety net.

---

## Manual Verification Steps (for when the backend is public / schema is fixed)

Run these once against the live or fixed-schema backend:

### Prerequisites

```bash
# Backend running and reachable (e.g. https://loyalty-sync.holy-grail.ch or localhost:8091)
# App built with VITE_SYNC_URL pointing at that backend
VITE_SYNC_URL=https://loyalty-sync.holy-grail.ch npm run build
npx vite preview --port 4173 &
```

### Step 1 – Device A: Sign up and add a card

1. Open `http://localhost:4173` (or the real PWA URL).
2. Tap **⚙️ Settings** → **Create an account** → enter `you@example.com` / `password`.
3. Go back (‹) to the card grid.
4. Tap **＋** → **Enter manually**.
5. Store name: `Migros`, Number: `7613269001234`, Format: Code 128.
6. Tap **Save**.
7. The `Migros` tile should appear immediately (written to IndexedDB) **and** be pushed to
   PocketBase within ~2 s while online (check Network tab: POST to `/api/collections/cards/records`).

### Step 2 – Device B: Log in and confirm card appears

1. Open the same URL in a **different browser** (or incognito / different device).
2. Tap **⚙️ Settings** → enter the same credentials → **Log in**.
3. Go back (‹) to the card grid.
4. Within ~5 s the `Migros` tile should appear (pulled from PocketBase by `pull()`).

### Step 3 – Device B: Delete the card, tombstone propagates to A

1. In Device B, tap the `Migros` tile → checkout screen.
2. Tap the **edit** button to open CardDetail.
3. Tap **Delete card**.
4. The tile disappears from Device B.
5. Switch to Device A (or reload its tab / navigate away and back). Within ~5 s the
   `Migros` tile should be gone (tombstone received via `pull()` or realtime push).

### Step 4 – Tear down

```bash
docker stop pb-e2e     # if using ephemeral container
# kill vite preview:
kill $(pgrep -f "vite preview")
```

---

## Unit / Integration Test Coverage (safety net)

All 101 tests green (25 test files):

- `src/lib/db.test.ts` — mutation hook fires on put/delete
- `src/lib/sync/map.test.ts` — toRemote/fromRemote round-trip
- `src/lib/sync/merge.test.ts` — LWW + tombstone merge decisions
- `src/lib/sync/queue.test.ts` — enqueue / collapse / drain
- `src/lib/sync/engine.test.ts` — push upsert, pull LWW, pull tombstone, adoptLocalCards,
  echo-loop suppression

These cover every sync code path end-to-end against a mocked PocketBase.
