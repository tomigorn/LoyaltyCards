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
