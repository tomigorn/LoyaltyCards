import { describe, it, expect } from 'vitest';
import { resolveLogoUrl } from '../src/lib/logo/resolve';
import type { Card } from '../src/lib/types';

const base: Card = {
  id: 'c1', storeName: 'Migros', barcodeValue: '7612345678900', barcodeFormat: 'ean13',
  brandColor: '#FF6600', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt: 1,
};

describe('resolveLogoUrl', () => {
  it('returns an uploaded blob URL when source=uploaded', async () => {
    const card = { ...base, logo: { source: 'uploaded' as const, blobRef: 'img1' } };
    const url = await resolveLogoUrl(card, {
      getImage: async () => new Blob(['x']),
      makeObjectUrl: () => 'blob://img1',
      generateTile: () => 'data:tile',
    });
    expect(url).toBe('blob://img1');
  });
  it('falls back to a generated tile when source=generated', async () => {
    const url = await resolveLogoUrl(base, {
      getImage: async () => undefined,
      makeObjectUrl: () => 'blob://x',
      generateTile: () => 'data:tile',
    });
    expect(url).toBe('data:tile');
  });
  it('falls back to tile if the stored blob is missing', async () => {
    const card = { ...base, logo: { source: 'uploaded' as const, blobRef: 'missing' } };
    const url = await resolveLogoUrl(card, {
      getImage: async () => undefined,
      makeObjectUrl: () => 'blob://x',
      generateTile: () => 'data:tile',
    });
    expect(url).toBe('data:tile');
  });
});
