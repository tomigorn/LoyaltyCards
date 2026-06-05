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
