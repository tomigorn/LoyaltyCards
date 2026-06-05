import { resolveLogoUrl } from './resolve';
import { getImage, getLogo, putLogo, putLogoColor, getLogoColor } from '../db';
import { generateTile } from './tile';
import { logoDevFetcher } from './fetch';
import { extractDominantColor } from './color';
import { getAutoFetch } from '../settings';
import { findCatalogById } from '../catalog/catalog';
import type { Card, CatalogEntry } from '../types';

/** Logo domains to try, program first then store. */
function domainsFor(id: string): string[] {
  const e = findCatalogById(id);
  if (!e) return [];
  return [e.programDomain, e.domain].filter((d): d is string => !!d);
}

export function resolveCardLogo(card: Card): Promise<string> {
  return resolveLogoUrl(card, {
    getImage, getLogo, putLogo, putLogoColor,
    makeObjectUrl: URL.createObjectURL,
    generateTile,
    fetchLogo: (d) => logoDevFetcher.fetchLogo(d),
    extractColor: extractDominantColor,
    autoFetchEnabled: getAutoFetch,
    domainsFor,
  });
}

const NEUTRAL = '#2a2a30';

/** Tile background colour, preferring the loyalty PROGRAM's branding:
 *  program colour → program-logo colour → store colour → store-logo colour → neutral.
 *  Non-catalog cards use their own brandColor. */
export async function resolveCardColor(card: Card): Promise<string> {
  const e: CatalogEntry | undefined = card.catalogId ? findCatalogById(card.catalogId) : undefined;
  if (!e) return card.brandColor || NEUTRAL;
  if (e.programColor) return e.programColor;
  if (e.programDomain) { const c = await getLogoColor(e.programDomain); if (c) return c; }
  if (e.brandColor) return e.brandColor;
  const c = await getLogoColor(e.domain); if (c) return c;
  return NEUTRAL;
}
