# Sync & Multi-User — Phase C (Sync Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** When logged in, the PWA backs up and syncs card *data* across devices: local changes push to Pocketbase, remote changes pull down, with last-write-wins conflict resolution, deletion tombstones, offline queueing, realtime updates, and first-login adoption of existing local cards. IndexedDB stays the source of truth; everything still works offline and logged-out.

**Architecture:** A `syncQueue` IndexedDB store records pending card writes/deletes. `db.putCard`/`db.deleteCard` notify a mutation hook that enqueues (suppressed while applying remote changes, to avoid echo loops). A sync engine flushes the queue to Pocketbase (`cards` collection, keyed by `cardId`), pulls changes since a server-time cursor, merges with last-write-wins by `clientUpdatedAt`, applies tombstones, subscribes to realtime, and on first login adopts existing local cards. Pure mapping + merge functions are unit-tested; the engine is tested against a mocked PocketBase.

**Tech Stack:** Svelte 5, idb, PocketBase JS SDK, Vitest (unit + mocked integration). Real two-device behaviour is verified against an ephemeral Pocketbase container (Task 7) or, if unavailable in the env, a documented manual check.

**Reference:** design `docs/superpowers/specs/2026-06-05-sync-multiuser-design.md` §3.4; Phase B auth store `src/lib/auth/store.ts` (`pb`, `isLoggedIn`, `account`). Backend `cards` fields: `owner, cardId, storeName, barcodeValue, barcodeFormat, brandColor, tileColor, logoSource, logoUrl, catalogId, notes, favorite, order, lastUsedAt, clientCreatedAt, clientUpdatedAt, deleted`; owner-scoped API rules; PB system field `updated` used as the pull cursor.

> **Scope guard:** card DATA only — never sync `frontPhotoRef`/`backPhotoRef` blobs or logo blobs (Phase-later). Conflict resolution is last-write-wins by `clientUpdatedAt`; no CRDT.

---

## File Structure
- `src/lib/sync/map.ts` — pure `toRemote(card)` / `fromRemote(rec)` field mapping.
- `src/lib/sync/merge.ts` — pure `mergeDecision(local, remote)` (LWW + tombstone).
- `src/lib/sync/map.test.ts`, `src/lib/sync/merge.test.ts` — unit tests.
- `src/lib/sync/queue.ts` — `syncQueue` IndexedDB ops (enqueue/list/remove/clear).
- `src/lib/sync/engine.ts` — `push`, `pull`, `subscribeRealtime`, `adoptLocalCards`, `startSync`, `stopSync`, applying-remote flag.
- `src/lib/sync/engine.test.ts` — engine tests with a mocked `pb` + fake-indexeddb.
- `src/lib/db.ts` — add a mutation hook (`setMutationHook`) fired by `putCard`/`deleteCard`; bump DB VERSION to 4 with the `syncQueue` store (modify).
- `src/App.svelte` — start/stop sync on login state + online events (modify).

---

## Task 1: DB v4 with `syncQueue` store + mutation hook

**Files:** Modify `src/lib/db.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/db.test.ts` (create)

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { putCard, deleteCard, setMutationHook } from './db';
import type { Card } from './types';

const card = (id: string): Card => ({
  id, storeName: 'S', barcodeValue: '1', barcodeFormat: 'code128', brandColor: '#000',
  logo: { source: 'generated' }, notes: '', favorite: false, order: 0,
  createdAt: 1, updatedAt: 1,
});

describe('db mutation hook', () => {
  beforeEach(() => setMutationHook(null));
  it('putCard notifies the hook with the card', async () => {
    const hook = vi.fn();
    setMutationHook(hook);
    await putCard(card('a'));
    expect(hook).toHaveBeenCalledWith({ kind: 'put', card: expect.objectContaining({ id: 'a' }) });
  });
  it('deleteCard notifies the hook with the id', async () => {
    const hook = vi.fn();
    await putCard(card('b'));
    setMutationHook(hook);
    await deleteCard('b');
    expect(hook).toHaveBeenCalledWith({ kind: 'delete', id: 'b' });
  });
});
```

- [ ] **Step 2: Run; expect FAIL** — `npm test -- src/lib/db.test.ts` (setMutationHook undefined).

- [ ] **Step 3: Implement** in `src/lib/db.ts`:
  1. Change `const VERSION = 3;` → `const VERSION = 4;`.
  2. In the `upgrade(db, oldVersion)` callback add:
     ```ts
     if (!db.objectStoreNames.contains('syncQueue'))
       db.createObjectStore('syncQueue', { keyPath: 'cardId' });
     ```
  3. Add the hook plumbing near the top (after imports):
     ```ts
     export type Mutation = { kind: 'put'; card: Card } | { kind: 'delete'; id: string };
     let mutationHook: ((m: Mutation) => void) | null = null;
     export function setMutationHook(fn: ((m: Mutation) => void) | null) { mutationHook = fn; }
     ```
  4. Fire it from the mutators:
     ```ts
     export async function putCard(card: Card) { await (await open()).put('cards', card); mutationHook?.({ kind: 'put', card }); }
     export async function deleteCard(id: string) { await (await open()).delete('cards', id); mutationHook?.({ kind: 'delete', id }); }
     ```

- [ ] **Step 4: Run; expect PASS** — `npm test -- src/lib/db.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/lib/db.ts src/lib/db.test.ts
git commit -m "LoyaltyCards: db v4 syncQueue store + card mutation hook"
```

---

## Task 2: Field mapping (pure) — TDD

**Files:** Create `src/lib/sync/map.ts`, `src/lib/sync/map.test.ts`

- [ ] **Step 1: Failing test** (`map.test.ts`)
```ts
import { describe, it, expect } from 'vitest';
import { toRemote, fromRemote } from './map';
import type { Card } from '../types';

const card: Card = {
  id: 'uuid1', storeName: 'Migros', barcodeValue: '76', barcodeFormat: 'ean13',
  brandColor: '#E30613', logo: { source: 'catalog', url: 'migros.ch' }, notes: 'n',
  favorite: true, order: 3, createdAt: 100, updatedAt: 200, lastUsedAt: 150,
  catalogId: 'ch-migros', tileColor: '#fff',
};

describe('sync mapping', () => {
  it('toRemote maps fields + flattens logo, omits photos', () => {
    const r = toRemote(card, 'owner1');
    expect(r).toMatchObject({
      owner: 'owner1', cardId: 'uuid1', storeName: 'Migros', barcodeValue: '76',
      barcodeFormat: 'ean13', brandColor: '#E30613', tileColor: '#fff',
      logoSource: 'catalog', logoUrl: 'migros.ch', catalogId: 'ch-migros',
      notes: 'n', favorite: true, order: 3, lastUsedAt: 150,
      clientCreatedAt: 100, clientUpdatedAt: 200, deleted: false,
    });
    expect('frontPhotoRef' in r).toBe(false);
  });
  it('fromRemote round-trips back to a Card', () => {
    const back = fromRemote(toRemote(card, 'o'));
    expect(back).toEqual(card);
  });
  it('fromRemote tolerates empty optionals', () => {
    const back = fromRemote({ ...toRemote({ ...card, tileColor: undefined, catalogId: undefined,
      lastUsedAt: undefined, logo: { source: 'generated' } }, 'o') });
    expect(back.tileColor).toBeUndefined();
    expect(back.catalogId).toBeUndefined();
    expect(back.lastUsedAt).toBeUndefined();
    expect(back.logo).toEqual({ source: 'generated' });
  });
});
```

- [ ] **Step 2: Run; expect FAIL.** `npm test -- src/lib/sync/map.test.ts`

- [ ] **Step 3: Implement** (`map.ts`)
```ts
import type { Card, LogoSource } from '../types';

export interface RemoteCardData {
  owner: string; cardId: string; storeName: string; barcodeValue: string; barcodeFormat: string;
  brandColor: string; tileColor: string; logoSource: string; logoUrl: string; catalogId: string;
  notes: string; favorite: boolean; order: number; lastUsedAt: number;
  clientCreatedAt: number; clientUpdatedAt: number; deleted: boolean;
}

export function toRemote(card: Card, owner: string): RemoteCardData {
  return {
    owner, cardId: card.id, storeName: card.storeName, barcodeValue: card.barcodeValue,
    barcodeFormat: card.barcodeFormat, brandColor: card.brandColor, tileColor: card.tileColor ?? '',
    logoSource: card.logo.source, logoUrl: card.logo.url ?? '', catalogId: card.catalogId ?? '',
    notes: card.notes, favorite: card.favorite, order: card.order, lastUsedAt: card.lastUsedAt ?? 0,
    clientCreatedAt: card.createdAt, clientUpdatedAt: card.updatedAt, deleted: false,
  };
}

export function fromRemote(r: Partial<RemoteCardData> & Record<string, unknown>): Card {
  return {
    id: String(r.cardId), storeName: String(r.storeName ?? ''), barcodeValue: String(r.barcodeValue ?? ''),
    barcodeFormat: (r.barcodeFormat as Card['barcodeFormat']) ?? 'code128',
    brandColor: String(r.brandColor ?? '#444'),
    logo: { source: (r.logoSource as LogoSource) || 'generated', url: r.logoUrl ? String(r.logoUrl) : undefined },
    notes: String(r.notes ?? ''), favorite: !!r.favorite, order: Number(r.order ?? 0),
    createdAt: Number(r.clientCreatedAt ?? 0), updatedAt: Number(r.clientUpdatedAt ?? 0),
    lastUsedAt: r.lastUsedAt ? Number(r.lastUsedAt) : undefined,
    catalogId: r.catalogId ? String(r.catalogId) : undefined,
    tileColor: r.tileColor ? String(r.tileColor) : undefined,
  };
}
```

- [ ] **Step 4: Run; expect PASS.**

- [ ] **Step 5: Commit**
```bash
git add src/lib/sync/map.ts src/lib/sync/map.test.ts
git commit -m "LoyaltyCards: sync field mapping (card↔remote, data-only)"
```

---

## Task 3: Merge decision (pure, last-write-wins) — TDD

**Files:** Create `src/lib/sync/merge.ts`, `src/lib/sync/merge.test.ts`

- [ ] **Step 1: Failing test** (`merge.test.ts`)
```ts
import { describe, it, expect } from 'vitest';
import { mergeDecision } from './merge';
import type { Card } from '../types';

const local = (updatedAt: number): Card => ({
  id: 'x', storeName: 'L', barcodeValue: '1', barcodeFormat: 'code128', brandColor: '#000',
  logo: { source: 'generated' }, notes: '', favorite: false, order: 0, createdAt: 0, updatedAt,
});

describe('mergeDecision (LWW + tombstones)', () => {
  it('new remote card → upsert', () => {
    expect(mergeDecision(undefined, { clientUpdatedAt: 5, deleted: false }).action).toBe('upsert');
  });
  it('remote newer than local → upsert', () => {
    expect(mergeDecision(local(3), { clientUpdatedAt: 9, deleted: false }).action).toBe('upsert');
  });
  it('remote older than local → skip', () => {
    expect(mergeDecision(local(9), { clientUpdatedAt: 3, deleted: false }).action).toBe('skip');
  });
  it('equal timestamps → skip (no thrash)', () => {
    expect(mergeDecision(local(5), { clientUpdatedAt: 5, deleted: false }).action).toBe('skip');
  });
  it('remote tombstone + local present → delete', () => {
    expect(mergeDecision(local(1), { clientUpdatedAt: 9, deleted: true }).action).toBe('delete');
  });
  it('remote tombstone + no local → skip', () => {
    expect(mergeDecision(undefined, { clientUpdatedAt: 9, deleted: true }).action).toBe('skip');
  });
});
```

- [ ] **Step 2: Run; expect FAIL.**

- [ ] **Step 3: Implement** (`merge.ts`)
```ts
import type { Card } from '../types';

export interface RemoteMeta { clientUpdatedAt: number; deleted: boolean; }
export type MergeAction = 'upsert' | 'delete' | 'skip';

/** Decide what to do with a remote record given the local card (if any). Last-write-wins
 *  by clientUpdatedAt; a remote tombstone removes a present local card. Equal timestamps
 *  are a no-op so repeated syncs don't thrash. */
export function mergeDecision(local: Card | undefined, remote: RemoteMeta): { action: MergeAction } {
  if (remote.deleted) return { action: local ? 'delete' : 'skip' };
  if (!local) return { action: 'upsert' };
  return { action: remote.clientUpdatedAt > local.updatedAt ? 'upsert' : 'skip' };
}
```

- [ ] **Step 4: Run; expect PASS.**

- [ ] **Step 5: Commit**
```bash
git add src/lib/sync/merge.ts src/lib/sync/merge.test.ts
git commit -m "LoyaltyCards: sync merge decision (last-write-wins + tombstones)"
```

---

## Task 4: Sync queue store ops — TDD

**Files:** Create `src/lib/sync/queue.ts`, `src/lib/sync/queue.test.ts`

- [ ] **Step 1: Failing test** (`queue.test.ts`)
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { enqueue, listQueue, removeFromQueue, clearQueue } from './queue';

describe('sync queue', () => {
  beforeEach(async () => { await clearQueue(); });
  it('enqueue then list returns the op', async () => {
    await enqueue({ cardId: 'a', kind: 'put' });
    const q = await listQueue();
    expect(q).toEqual([{ cardId: 'a', kind: 'put' }]);
  });
  it('enqueue same cardId collapses to the latest op', async () => {
    await enqueue({ cardId: 'a', kind: 'put' });
    await enqueue({ cardId: 'a', kind: 'delete' });
    expect(await listQueue()).toEqual([{ cardId: 'a', kind: 'delete' }]);
  });
  it('removeFromQueue removes one', async () => {
    await enqueue({ cardId: 'a', kind: 'put' });
    await enqueue({ cardId: 'b', kind: 'put' });
    await removeFromQueue('a');
    expect((await listQueue()).map((o) => o.cardId)).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run; expect FAIL.**

- [ ] **Step 3: Implement** (`queue.ts`) — reuse the db connection by importing the shared opener. Add an exported `openDb()` to `db.ts` if not present, OR open the same DB name/version here. To avoid a second connection with a different version, add to `db.ts`:
  ```ts
  export async function dbConn() { return open(); }
  ```
  Then `queue.ts`:
```ts
import { dbConn } from '../db';

export interface QueueOp { cardId: string; kind: 'put' | 'delete'; }

export async function enqueue(op: QueueOp) { await (await dbConn()).put('syncQueue', op); }
export async function listQueue(): Promise<QueueOp[]> { return (await (await dbConn()).getAll('syncQueue')) as QueueOp[]; }
export async function removeFromQueue(cardId: string) { await (await dbConn()).delete('syncQueue', cardId); }
export async function clearQueue() { await (await dbConn()).clear('syncQueue'); }
```
  (`syncQueue` keyPath is `cardId`, so a second enqueue for the same card overwrites → "collapse to latest".)

- [ ] **Step 4: Run; expect PASS.**

- [ ] **Step 5: Commit**
```bash
git add src/lib/db.ts src/lib/sync/queue.ts src/lib/sync/queue.test.ts
git commit -m "LoyaltyCards: sync outbound queue (collapse per card)"
```

---

## Task 5: Sync engine — push / pull / adopt / realtime (TDD with mocked pb)

**Files:** Create `src/lib/sync/engine.ts`, `src/lib/sync/engine.test.ts`

- [ ] **Step 1: Failing test** (`engine.test.ts`) — mock the auth client + db; assert push upserts, pull merges, adopt enqueues.
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

const records: any[] = []; // fake remote store
const collection = {
  getFullList: vi.fn(async () => records.slice()),
  getFirstListItem: vi.fn(async (filter: string) => {
    const m = filter.match(/cardId\s*=\s*"([^"]+)"/); const id = m?.[1];
    const found = records.find((r) => r.cardId === id);
    if (!found) throw { status: 404 }; return found;
  }),
  create: vi.fn(async (data: any) => { const rec = { id: 'r' + records.length, updated: '2026-01-01 00:00:00.000Z', ...data }; records.push(rec); return rec; }),
  update: vi.fn(async (id: string, data: any) => { const r = records.find((x) => x.id === id); Object.assign(r, data); return r; }),
  subscribe: vi.fn(async () => () => {}),
};
vi.mock('../auth/client', () => ({ USERS: 'users', pb: { collection: () => collection, authStore: { record: { id: 'owner1' } } } }));

import { putCard, getAllCards, getCard, setMutationHook } from '../db';
import { enqueue, listQueue } from './queue';
import { push, pull, adoptLocalCards } from './engine';
import type { Card } from '../types';

const card = (id: string, updatedAt = 1): Card => ({ id, storeName: 'S' + id, barcodeValue: '1',
  barcodeFormat: 'code128', brandColor: '#000', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt });

beforeEach(async () => { records.length = 0; setMutationHook(null);
  for (const c of await getAllCards()) await (await import('../db')).deleteCard(c.id);
  const { clearQueue } = await import('./queue'); await clearQueue();
});

describe('sync engine', () => {
  it('push creates a remote record for a queued put', async () => {
    await putCard(card('a'));
    await enqueue({ cardId: 'a', kind: 'put' });
    await push();
    expect(collection.create).toHaveBeenCalled();
    expect(records[0]).toMatchObject({ cardId: 'a', owner: 'owner1' });
    expect(await listQueue()).toEqual([]); // drained on success
  });

  it('pull upserts a newer remote card into local', async () => {
    records.push({ id: 'r0', cardId: 'z', storeName: 'Z', barcodeValue: '9', barcodeFormat: 'qr',
      brandColor: '#111', logoSource: 'generated', logoUrl: '', catalogId: '', notes: '', favorite: false,
      order: 0, lastUsedAt: 0, tileColor: '', clientCreatedAt: 1, clientUpdatedAt: 99, deleted: false,
      updated: '2026-02-02 00:00:00.000Z' });
    await pull();
    expect((await getCard('z'))?.storeName).toBe('Z');
  });

  it('pull applies a tombstone by deleting local', async () => {
    await putCard(card('d'));
    records.push({ id: 'r1', cardId: 'd', clientUpdatedAt: 999, deleted: true, updated: '2026-03-03 00:00:00.000Z',
      storeName: '', barcodeValue: '', barcodeFormat: 'code128', brandColor: '', logoSource: 'generated',
      logoUrl: '', catalogId: '', notes: '', favorite: false, order: 0, lastUsedAt: 0, tileColor: '', clientCreatedAt: 0 });
    await pull();
    expect(await getCard('d')).toBeUndefined();
  });

  it('adoptLocalCards enqueues every local card', async () => {
    await putCard(card('a')); await putCard(card('b'));
    await adoptLocalCards();
    expect((await listQueue()).map((o) => o.cardId).sort()).toEqual(['a', 'b']);
  });

  it('applying remote does not re-enqueue (no echo loop)', async () => {
    setMutationHook(() => { throw new Error('hook should be suppressed during pull'); });
    records.push({ id: 'r2', cardId: 'q', storeName: 'Q', barcodeValue: '1', barcodeFormat: 'qr',
      brandColor: '#111', logoSource: 'generated', logoUrl: '', catalogId: '', notes: '', favorite: false,
      order: 0, lastUsedAt: 0, tileColor: '', clientCreatedAt: 1, clientUpdatedAt: 5, deleted: false,
      updated: '2026-02-02 00:00:00.000Z' });
    await expect(pull()).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run; expect FAIL.**

- [ ] **Step 3: Implement** (`engine.ts`)
```ts
import { pb, USERS } from '../auth/client';
import { getAllCards, getCard, putCard, deleteCard } from '../db';
import { listQueue, removeFromQueue, enqueue } from './queue';
import { toRemote, fromRemote } from './map';
import { mergeDecision } from './merge';

const CARDS = 'cards';
const CURSOR_KEY = 'syncCursor';

// When true, local writes come FROM the server — don't re-enqueue them (avoids echo loops).
let applyingRemote = false;
export function isApplyingRemote() { return applyingRemote; }

function ownerId(): string | null { return (pb.authStore.record as { id?: string })?.id ?? null; }

async function findRemote(cardId: string): Promise<{ id: string } | null> {
  try { return await pb.collection(CARDS).getFirstListItem(`cardId="${cardId}"`); }
  catch (e: any) { if (e?.status === 404) return null; throw e; }
}

/** Flush the outbound queue to Pocketbase. Drains an op only on success. */
export async function push(): Promise<void> {
  const owner = ownerId(); if (!owner) return;
  for (const op of await listQueue()) {
    try {
      const remote = await findRemote(op.cardId);
      if (op.kind === 'delete') {
        if (remote) await pb.collection(CARDS).update(remote.id, { deleted: true, clientUpdatedAt: Date.now() });
        // no remote → nothing to tombstone; other devices never had it
      } else {
        const card = await getCard(op.cardId);
        if (!card) { await removeFromQueue(op.cardId); continue; } // deleted locally before flush
        const data = toRemote(card, owner);
        if (remote) await pb.collection(CARDS).update(remote.id, data);
        else await pb.collection(CARDS).create(data);
      }
      await removeFromQueue(op.cardId);
    } catch {
      // leave the op queued; retry on next flush (offline/5xx)
    }
  }
}

/** Pull remote changes since the cursor and merge with last-write-wins. */
export async function pull(): Promise<void> {
  if (!ownerId()) return;
  const cursor = localStorage.getItem(CURSOR_KEY) ?? '';
  const filter = cursor ? `updated > "${cursor}"` : '';
  const records = await pb.collection(CARDS).getFullList({ filter, sort: 'updated' });
  applyingRemote = true;
  try {
    for (const rec of records) {
      const local = await getCard(String((rec as any).cardId));
      const { action } = mergeDecision(local, { clientUpdatedAt: Number((rec as any).clientUpdatedAt), deleted: !!(rec as any).deleted });
      if (action === 'upsert') await putCard(fromRemote(rec as any));
      else if (action === 'delete') await deleteCard(String((rec as any).cardId));
      const upd = String((rec as any).updated || '');
      if (upd > (localStorage.getItem(CURSOR_KEY) ?? '')) localStorage.setItem(CURSOR_KEY, upd);
    }
  } finally { applyingRemote = false; }
}

/** First-login adoption: queue every existing local card so it backs up. */
export async function adoptLocalCards(): Promise<void> {
  for (const c of await getAllCards()) await enqueue({ cardId: c.id, kind: 'put' });
}

let unsub: (() => void) | null = null;
export async function subscribeRealtime(): Promise<void> {
  if (unsub || !ownerId()) return;
  unsub = await pb.collection(CARDS).subscribe('*', async (e: any) => {
    const rec = e.record; const local = await getCard(String(rec.cardId));
    const { action } = mergeDecision(local, { clientUpdatedAt: Number(rec.clientUpdatedAt), deleted: !!rec.deleted });
    applyingRemote = true;
    try {
      if (action === 'upsert') await putCard(fromRemote(rec));
      else if (action === 'delete') await deleteCard(String(rec.cardId));
    } finally { applyingRemote = false; }
  });
}
export function unsubscribeRealtime() { if (unsub) { unsub(); unsub = null; } }
```

- [ ] **Step 4: Run; expect PASS** — `npm test -- src/lib/sync/engine.test.ts`. Iterate until all pass (the mock's `getFirstListItem` filter regex matches the engine's `cardId="X"` query — keep them consistent).

- [ ] **Step 5: Commit**
```bash
git add src/lib/sync/engine.ts src/lib/sync/engine.test.ts
git commit -m "LoyaltyCards: sync engine (push/pull/adopt/realtime, LWW)"
```

---

## Task 6: Wire sync to auth state, mutations, and connectivity

**Files:** Create `src/lib/sync/start.ts`; modify `src/App.svelte`

- [ ] **Step 1: Implement the orchestrator** (`src/lib/sync/start.ts`) — no new test logic (it wires tested pieces; covered by the e2e in Task 7). Subscribe to `isLoggedIn`; register the mutation hook; run sync on login/online.
```ts
import { get } from 'svelte/store';
import { isLoggedIn } from '../auth/store';
import { setMutationHook } from '../db';
import { loadCards } from '../stores';
import { enqueue } from './queue';
import { push, pull, adoptLocalCards, subscribeRealtime, unsubscribeRealtime, isApplyingRemote } from './engine';

let started = false;
let syncing = false;

async function fullSync() {
  if (syncing || !get(isLoggedIn)) return;
  syncing = true;
  try { await push(); await pull(); await loadCards(); } finally { syncing = false; }
}

/** Call once at app startup. Idempotent. */
export function startSync() {
  if (started) return; started = true;

  // Local mutations enqueue (unless they are us applying a remote change).
  setMutationHook((m) => {
    if (isApplyingRemote() || !get(isLoggedIn)) return;
    enqueue({ cardId: m.kind === 'put' ? m.card.id : m.id, kind: m.kind === 'put' ? 'put' : 'delete' })
      .then(() => { if (navigator.onLine) push(); });
  });

  // React to login/logout.
  isLoggedIn.subscribe(async (in_) => {
    if (in_) { await adoptLocalCards(); await fullSync(); await subscribeRealtime(); }
    else { unsubscribeRealtime(); }
  });

  // Flush + pull when connectivity returns or the app regains focus.
  window.addEventListener('online', fullSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fullSync(); });
}
```

- [ ] **Step 2: Call it from `src/App.svelte`** — add to the `<script>` (after the `refreshSession()` line from Phase B):
```ts
  import { startSync } from './lib/sync/start';
  startSync();
```

- [ ] **Step 3: Verify** — `npm run check && npm test` (0 errors; all unit tests pass, including the engine/map/merge/queue suites).

- [ ] **Step 4: Commit**
```bash
git add src/lib/sync/start.ts src/App.svelte
git commit -m "LoyaltyCards: orchestrate sync on login, mutation, and reconnect"
```

---

## Task 7: End-to-end sync verification

**Files:** Create `e2e-live/sync.spec.ts` (throwaway, not part of `npm run e2e`) OR `scripts/verify-sync.md`

> Real cross-device sync needs a running backend the browser can reach. The committed `npm run e2e` suite stays backend-free (mocked). This task proves real sync once against the ephemeral backend image built in Phase A.

- [ ] **Step 1: Bring up an ephemeral backend on a host port**
```bash
cd /home/pi/Projects/Docker/LoyaltyCards-Sync
docker run -d --rm --name pb-e2e -p 8091:8090 -e PB_ADMIN_EMAIL=a@b.c -e PB_ADMIN_PASSWORD=password123456 loyaltycards-sync:local
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8091/api/health   # expect 200
```

- [ ] **Step 2: Build + preview the PWA pointed at it**
```bash
cd /home/pi/Documents/development/LoyaltyCards
VITE_SYNC_URL=http://localhost:8091 npm run build
npx vite preview --port 4173 &
sleep 3
```

- [ ] **Step 3: Manual/script two-context check** — in a Playwright script (`e2e-live/sync.spec.ts`) or by hand:
  1. Context A: open `http://localhost:4173`, sign up `me@example.com` / `password123456`, add a card "Migros / 7613269001234 (Code 128)".
  2. Context B (fresh storage): open the app, log in as the same account → the "Migros" card appears (pulled).
  3. In B, delete the card → in A (after focus/online), it disappears (tombstone).
  Assert each via the card tiles.

- [ ] **Step 4: Tear down**
```bash
docker stop pb-e2e
# stop the vite preview process
```

- [ ] **Step 5: Document the result** in `scripts/verify-sync.md` (what was run, the outcome). Commit:
```bash
git add e2e-live/sync.spec.ts scripts/verify-sync.md 2>/dev/null; git add -A -- e2e-live scripts 2>/dev/null
git commit -m "LoyaltyCards: ephemeral-backend sync verification (throwaway e2e + notes)"
```
> If the env cannot run the ephemeral container + preview together, SKIP the live run, write `scripts/verify-sync.md` describing the exact manual steps for the user to run after the backend is public, and report that the automated unit/integration coverage (Tasks 1–5) is the safety net. Do not fake a passing live test.

---

## Self-Review

**Spec coverage (design §3.4 → task):** local writes enqueue (T1 hook + T6) ✓; outbound queue (T4) ✓; push upsert + delete-tombstone (T5) ✓; pull + LWW merge + tombstone apply (T3 merge, T5 pull) ✓; cursor by server `updated` (T5) ✓; first-login adoption (T5 adopt + T6) ✓; realtime (T5 subscribe + T6) ✓; offline flush on reconnect (T6 online/visibility) ✓; echo-loop suppression (T1 hook + T5 applyingRemote + T6) ✓; data-only, no photos (T2 mapping) ✓; LWW not CRDT (T3) ✓. Real end-to-end (T7) ✓ (or documented manual).

**Placeholder scan:** none. The only conditional is T7's env fallback, which is an explicit, honest branch (not a stubbed test).

**Type/name consistency:** `toRemote(card, owner)`/`fromRemote(rec)`, `mergeDecision(local, remote)→{action}`, `QueueOp{cardId,kind}`, `enqueue/listQueue/removeFromQueue/clearQueue`, `push/pull/adoptLocalCards/subscribeRealtime/unsubscribeRealtime/isApplyingRemote`, `setMutationHook`/`Mutation`, `CURSOR_KEY`/`syncCursor` — all defined once and used consistently across tasks. `RemoteCardData` field names match the Phase-A backend `cards` schema exactly.

---

## After Phase C
Login → full backup + cross-device sync works (data only). Remaining (later): photo/logo blob sync; card sharing/family; deploy the updated PWA (new image) once the backend is public (user's Cloudflare hostname step) and this is verified end-to-end.
