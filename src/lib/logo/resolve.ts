import type { Card } from '../types';

export interface ResolveDeps {
  getImage: (key: string) => Promise<Blob | undefined>;
  getLogo: (domain: string) => Promise<Blob | undefined>;
  putLogo: (domain: string, blob: Blob) => Promise<void>;
  putLogoColor: (domain: string, hex: string) => Promise<void>;
  makeObjectUrl: (blob: Blob) => string;
  generateTile: (name: string, color: string) => string;
  fetchLogo: (domain: string) => Promise<Blob | null>;
  extractColor: (blob: Blob) => Promise<string>;
  autoFetchEnabled: () => boolean;
  domainFor: (catalogId: string) => string | undefined;
}

export async function resolveLogoUrl(card: Card, d: ResolveDeps): Promise<string> {
  // 1) user upload
  if (card.logo.blobRef) {
    const b = await d.getImage(card.logo.blobRef);
    if (b) return d.makeObjectUrl(b);
  }
  // catalog-linked domain
  const domain = card.catalogId ? d.domainFor(card.catalogId) : undefined;
  if (domain) {
    // 2) cached shop logo
    const cached = await d.getLogo(domain);
    if (cached) return d.makeObjectUrl(cached);
    // 3) auto-fetch
    if (d.autoFetchEnabled()) {
      const fetched = await d.fetchLogo(domain);
      if (fetched) {
        await d.putLogo(domain, fetched);
        try { await d.putLogoColor(domain, await d.extractColor(fetched)); } catch { /* ignore */ }
        return d.makeObjectUrl(fetched);
      }
    }
  }
  // 4) tile
  return d.generateTile(card.storeName, card.brandColor);
}
