import { describe, it, expect } from 'vitest';
import { resolveLogoUrl, type ResolveDeps } from '../src/lib/logo/resolve';
import type { Card } from '../src/lib/types';

const base: Card = {
  id: 'c1', storeName: 'Migros', barcodeValue: '1', barcodeFormat: 'ean13',
  brandColor: '#FF6600', logo: { source: 'generated' }, notes: '',
  favorite: false, order: 0, createdAt: 1, updatedAt: 1,
};
const deps = (over: Partial<ResolveDeps> = {}): ResolveDeps => ({
  getImage: async () => undefined,
  getLogo: async () => undefined,
  putLogo: async () => {},
  putLogoColor: async () => {},
  makeObjectUrl: () => 'blob://x',
  generateTile: () => 'data:tile',
  fetchLogo: async () => null,
  extractColor: async () => '#000000',
  autoFetchEnabled: () => true,
  domainsFor: () => [],
  ...over,
});

describe('resolveLogoUrl', () => {
  it('1) uses the user-uploaded blob first', async () => {
    const card = { ...base, logo: { source: 'uploaded' as const, blobRef: 'i' } };
    const url = await resolveLogoUrl(card, deps({ getImage: async () => new Blob(['x']), makeObjectUrl: () => 'blob://up' }));
    expect(url).toBe('blob://up');
  });
  it('2) uses a cached shop logo when catalog-linked', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    const url = await resolveLogoUrl(card, deps({
      domainsFor: () => ['migros.ch'],
      getLogo: async (d) => d === 'migros.ch' ? new Blob(['x']) : undefined,
      makeObjectUrl: () => 'blob://cached',
    }));
    expect(url).toBe('blob://cached');
  });
  it('3) auto-fetches when enabled and uncached', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    let put = '';
    const url = await resolveLogoUrl(card, deps({
      domainsFor: () => ['migros.ch'],
      fetchLogo: async () => new Blob(['x']),
      putLogo: async (d) => { put = d; },
      makeObjectUrl: () => 'blob://fetched',
    }));
    expect(url).toBe('blob://fetched');
    expect(put).toBe('migros.ch');
  });
  it('prefers the program domain, falling back to the store domain', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    const tried: string[] = [];
    let put = '';
    const url = await resolveLogoUrl(card, deps({
      domainsFor: () => ['cumulus.ch', 'migros.ch'],   // program first, then store
      fetchLogo: async (d) => { tried.push(d); return d === 'migros.ch' ? new Blob(['x']) : null; },
      putLogo: async (d) => { put = d; },
      makeObjectUrl: () => 'blob://store',
    }));
    expect(tried).toEqual(['cumulus.ch', 'migros.ch']); // program tried first
    expect(put).toBe('migros.ch');                      // cached under the one that worked
    expect(url).toBe('blob://store');
  });
  it('4) falls back to a generated tile', async () => {
    const url = await resolveLogoUrl(base, deps({ autoFetchEnabled: () => false }));
    expect(url).toBe('data:tile');
  });
  it('does not fetch when auto-fetch disabled', async () => {
    const card = { ...base, catalogId: 'ch-migros' };
    let fetched = false;
    const url = await resolveLogoUrl(card, deps({
      domainsFor: () => ['migros.ch'],
      autoFetchEnabled: () => false,
      fetchLogo: async () => { fetched = true; return new Blob(['x']); },
    }));
    expect(fetched).toBe(false);
    expect(url).toBe('data:tile');
  });
});
