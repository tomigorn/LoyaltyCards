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
