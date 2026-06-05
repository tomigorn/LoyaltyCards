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
