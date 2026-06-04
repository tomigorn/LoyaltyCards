import { resolveLogoUrl } from './resolve';
import { getImage, getLogo, putLogo, putLogoColor } from '../db';
import { generateTile } from './tile';
import { logoDevFetcher } from './fetch';
import { extractDominantColor } from './color';
import { getAutoFetch } from '../settings';
import { findCatalogById } from '../catalog/catalog';
import type { Card } from '../types';

export function resolveCardLogo(card: Card): Promise<string> {
  return resolveLogoUrl(card, {
    getImage, getLogo, putLogo, putLogoColor,
    makeObjectUrl: URL.createObjectURL,
    generateTile,
    fetchLogo: (d) => logoDevFetcher.fetchLogo(d),
    extractColor: extractDominantColor,
    autoFetchEnabled: getAutoFetch,
    domainFor: (id) => findCatalogById(id)?.domain,
  });
}
