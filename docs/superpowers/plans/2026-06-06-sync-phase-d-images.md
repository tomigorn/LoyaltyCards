# Sync — Phase D (Image / Blob Sync) Implementation Plan

> Execute with superpowers:subagent-driven-development where noted; the controller does backend + verification.

**Goal:** Sync the per-card user images — front photo, back photo, and hand-picked logo — across devices, so a logged-in account sees identical cards everywhere (data already syncs; this adds the binary blobs). Downscale photos at capture so payloads stay small.

**Architecture:** PocketBase file fields on `cards` (`frontPhoto`, `backPhoto`, `logoImage`). The local IndexedDB image keys (random UUIDs in `frontPhotoRef`/`backPhotoRef`/`logo.blobRef`) are synced as card fields; the engine uploads a blob when the server lacks a file for the current ref, and downloads when the server has a file for a ref the device lacks locally. A shared `storeImage()` util downscales + stores at capture.

**Tech:** Svelte 5, idb, PocketBase JS SDK (file upload via `File` in the update payload; download via `pb.files.getURL` + a file token), canvas downscaling.

**Reference:** Phase C engine (`src/lib/sync/{engine,map,queue,start}.ts`), backend `LoyaltyCards-Sync`. The logo.dev cache (`logos` store) is intentionally NOT synced (re-fetchable).

---

## File structure
- `src/lib/image.ts` (new) — `downscaleImage(blob)` + `storeImage(blob)` (downscale → putImage → return key).
- `src/components/PhotoField.svelte`, `src/screens/CardDetail.svelte` (modify) — use `storeImage` instead of raw `putImage`.
- `src/lib/sync/map.ts` (modify) — add `frontPhotoRef`, `backPhotoRef`, `logoBlobRef` to the remote mapping.
- `src/lib/sync/images.ts` (new) — `pushImages(localCard, remoteRecord)` (upload changed blobs, return file payload) and `pullImages(remoteRecord, localCard)` (download missing blobs → IndexedDB, return ref patch).
- `src/lib/sync/engine.ts` (modify) — call image push during `push`, image pull during `pull`.
- `LoyaltyCards-Sync/migrations/3_card_images.go` (new) — add the three file fields.
- Tests: `image.test.ts`, `map.test.ts` (refs), `images.test.ts` (mocked pb).

---

## Task 1 (controller): backend file fields migration
Add `migrations/3_card_images.go` adding `frontPhoto`, `backPhoto`, `logoImage` `core.FileField`s to `cards` (MaxSelect 1, MaxSize ~8MB, image mime types). Additive; rebuild + `docker compose up -d --build` (NO `-v`); verify fields exist and data intact.

## Task 2 (controller): image downscale + store util
`src/lib/image.ts`:
- `downscaleImage(blob, maxDim=1600, quality=0.85): Promise<Blob>` — draw to a canvas scaled so the longest side ≤ maxDim, export `image/jpeg`; if the source isn't a raster image or is already small, return as-is.
- `storeImage(blob): Promise<string>` — `const small = await downscaleImage(blob); const key = crypto.randomUUID(); await putImage(key, small); return key;`
Unit test: a large canvas blob downscales to ≤ maxDim; `storeImage` returns a key that `getImage` resolves.
Then swap `putImage(key, file)`/manual UUID in `PhotoField.svelte` and the three logo handlers in `CardDetail.svelte` to `const key = await storeImage(file)` (keep the delete-old-key logic).

## Task 3 (controller): sync the image refs (mapping)
`map.ts`: add to `RemoteCardData` and `toRemote`/`fromRemote`:
- `frontPhotoRef: string` ← `card.frontPhotoRef ?? ''` / back to `frontPhotoRef: r.frontPhotoRef || undefined`
- `backPhotoRef: string` likewise
- `logoBlobRef: string` ← `card.logo.blobRef ?? ''`; on `fromRemote`, set `logo.blobRef` from it (merge into the existing `logo` object).
Update `map.test.ts` accordingly.

## Task 4 (subagent): image push/pull engine (`src/lib/sync/images.ts`) — TDD
Implement with a mocked `pb` (file upload + download):

```ts
import { pb } from '../auth/client';
import { getImage, putImage } from '../db';
import type { Card } from '../types';

const CARDS = 'cards';
type Slot = { ref?: string; remoteRefField: string; fileField: string; apply: (c: Card, key: string) => void };

function slots(card: Card): Slot[] {
  return [
    { ref: card.frontPhotoRef, remoteRefField: 'frontPhotoRef', fileField: 'frontPhoto', apply: (c, k) => (c.frontPhotoRef = k) },
    { ref: card.backPhotoRef,  remoteRefField: 'backPhotoRef',  fileField: 'backPhoto',  apply: (c, k) => (c.backPhotoRef = k) },
    { ref: card.logo.blobRef,  remoteRefField: 'logoBlobRef',   fileField: 'logoImage',  apply: (c, k) => (c.logo = { ...c.logo, blobRef: k }) },
  ];
}

/** Build a file payload for fields whose local blob isn't yet on the server for the current ref. */
export async function buildImageUploads(card: Card, remote: Record<string, unknown> | null): Promise<Record<string, File>> {
  const payload: Record<string, File> = {};
  for (const s of slots(card)) {
    if (!s.ref) continue;
    const remoteHasForRef = remote && remote[s.remoteRefField] === s.ref && !!remote[s.fileField];
    if (remoteHasForRef) continue;
    const blob = await getImage(s.ref);
    if (blob) payload[s.fileField] = new File([blob], `${s.fileField}.jpg`, { type: blob.type || 'image/jpeg' });
  }
  return payload;
}

/** After pulling a remote card, download any file whose ref the device lacks locally. Returns a
 *  patch of refs to apply to the local card (caller persists). */
export async function pullImages(remote: Record<string, any>, token: string): Promise<Partial<Card>> {
  const patch: Partial<Card> = {};
  const map: Array<[string, string, (k: string) => void]> = [
    ['frontPhotoRef', 'frontPhoto', (k) => (patch.frontPhotoRef = k)],
    ['backPhotoRef', 'backPhoto', (k) => (patch.backPhotoRef = k)],
  ];
  for (const [refField, fileField, set] of map) {
    const ref = remote[refField]; const file = remote[fileField];
    if (!ref || !file) continue;
    if (await getImage(ref)) { set(ref); continue; } // already have it
    const url = pb.files.getURL(remote, file, { token });
    const resp = await fetch(url);
    if (resp.ok) { await putImage(ref, await resp.blob()); set(ref); }
  }
  // logo blob (nested)
  const lref = remote['logoBlobRef']; const lfile = remote['logoImage'];
  if (lref && lfile && !(await getImage(lref))) {
    const url = pb.files.getURL(remote, lfile, { token });
    const resp = await fetch(url);
    if (resp.ok) { await putImage(lref, await resp.blob()); patch.logo = { source: 'uploaded', blobRef: lref }; }
  }
  return patch;
}
```
> Verify `pb.files.getURL(record, filename, { token })` and the file-token call (`pb.files.getToken()`) against the installed SDK; older SDKs use `pb.files.getUrl`. Tests mock `pb.files.getURL`, `fetch` (global), and `getImage`/`putImage` (fake-indexeddb).

Tests: (a) `buildImageUploads` includes a slot when remote lacks the file for that ref, skips when remote already has it; (b) `pullImages` downloads + `putImage`s when the local blob is missing, skips when present.

## Task 5 (controller): wire into the engine
- `engine.ts` `push()`: after computing `data = toRemote(card, owner)`, `const files = await buildImageUploads(card, remote)` and include them: for create `pb.collection(CARDS).create({ ...data, ...files })`; for update `pb.collection(CARDS).update(remote.id, { ...data, ...files })`. (The SDK sends multipart when File values are present.)
- `engine.ts` `pull()`: after the `upsert` branch writes the card, get a file token once (`const token = await pb.files.getToken()`), call `pullImages(rec, token)`, and if the patch is non-empty merge it into the local card and `putCard` (within the `applyingRemote` guard so it doesn't re-enqueue). Reuse one token per `pull()` run.

## Task 6 (controller): live two-context verification
Extend `e2e-live/sync.spec.ts` (throwaway): context A signs up + adds a card **with a front photo** (`setInputFiles` a small fixture image); context B logs in → the card's photo appears (tile shows the photo / the image downloads). Assert via the tile rendering as a photo tile or the `images` store. Run against an ephemeral backend built from `loyaltycards-sync:local`. Tear down. If the harness can't assert the rendered photo reliably, assert the IndexedDB `images` store gained the ref on B.

## Task 7 (controller): release 0.10.0
Bump `package.json` → `0.10.0` (minor — notable feature) with a `bump version` commit + tag `v0.10.0`; build/push image; deploy; verify. Commit the backend migration in the infra repo.

---

## Notes / decisions
- **Re-fetchable logos** (logo.dev cache) are not synced — each device re-fetches; only user-provided blobs sync.
- **Photo removal** propagation is best-effort: clearing a ref locally + pushing sends empty ref; downstream a device keeps its copy until its own ref clears. Full delete-propagation can be hardened later.
- **Downscaling** only affects *new* captures; existing full-size photos sync as-is (within the 8 MB limit).
- Storage lives in the `pb_data` volume — already part of backups.
