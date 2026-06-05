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
