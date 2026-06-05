import { pb } from '../auth/client';
import { getAllCards, getCard, putCard, deleteCard, setMutationHook, getMutationHook } from '../db';
import { listQueue, removeFromQueue, enqueue } from './queue';
import { toRemote, fromRemote } from './map';
import { mergeDecision } from './merge';

const CARDS = 'cards';
const CURSOR_KEY = 'syncCursor';

// When true, local writes come FROM the server — don't re-enqueue them (avoids echo loops).
let applyingRemote = false;
export function isApplyingRemote() { return applyingRemote; }

function ownerId(): string | null { return (pb.authStore.record as { id?: string } | null)?.id ?? null; }

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
  const records = await pb.collection(CARDS).getFullList({ filter, sort: 'updated' } as any);
  const savedHook = getMutationHook();
  applyingRemote = true;
  setMutationHook(null);
  try {
    for (const rec of records) {
      const local = await getCard(String((rec as any).cardId));
      const { action } = mergeDecision(local, { clientUpdatedAt: Number((rec as any).clientUpdatedAt), deleted: !!(rec as any).deleted });
      if (action === 'upsert') await putCard(fromRemote(rec as any));
      else if (action === 'delete') await deleteCard(String((rec as any).cardId));
      const upd = String((rec as any).updated || '');
      if (upd > (localStorage.getItem(CURSOR_KEY) ?? '')) localStorage.setItem(CURSOR_KEY, upd);
    }
  } finally { applyingRemote = false; setMutationHook(savedHook); }
}

/** First-login adoption: queue every existing local card so it backs up. */
export async function adoptLocalCards(): Promise<void> {
  for (const c of await getAllCards()) await enqueue({ cardId: c.id, kind: 'put' });
}

let unsub: (() => void) | null = null;
export async function subscribeRealtime(): Promise<void> {
  if (unsub || !ownerId()) return;
  const fn = await pb.collection(CARDS).subscribe('*', async (e: any) => {
    const rec = e.record; const local = await getCard(String(rec.cardId));
    const { action } = mergeDecision(local, { clientUpdatedAt: Number(rec.clientUpdatedAt), deleted: !!rec.deleted });
    const savedHook = getMutationHook();
    applyingRemote = true;
    setMutationHook(null);
    try {
      if (action === 'upsert') await putCard(fromRemote(rec));
      else if (action === 'delete') await deleteCard(String(rec.cardId));
    } finally { applyingRemote = false; setMutationHook(savedHook); }
  });
  unsub = fn as unknown as () => void;
}
export function unsubscribeRealtime() { if (unsub) { unsub(); unsub = null; } }
