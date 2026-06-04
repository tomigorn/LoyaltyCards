import type { CatalogEntry } from '../types';
export const CATALOG: CatalogEntry[] = [
  { id: 'migros', name: 'Migros', aliases: ['cumulus'], brandColor: '#FF6600', logoAsset: 'migros.svg', defaultFormat: 'ean13' },
  { id: 'coop', name: 'Coop', aliases: ['coop city', 'supercard'], brandColor: '#E2001A', logoAsset: 'coop.svg', defaultFormat: 'ean13' },
  { id: 'ikea', name: 'IKEA', aliases: ['ikea family'], brandColor: '#0058A3', logoAsset: 'ikea.svg', defaultFormat: 'code128' },
  { id: 'manor', name: 'Manor', aliases: ['manor card'], brandColor: '#009640', logoAsset: 'manor.svg', defaultFormat: 'ean13' },
  { id: 'digitec', name: 'Digitec', aliases: ['digitec galaxus', 'galaxus'], brandColor: '#1A1A1A', logoAsset: 'digitec.svg', defaultFormat: 'code128' },
  { id: 'denner', name: 'Denner', aliases: [], brandColor: '#E2001A', logoAsset: 'denner.svg', defaultFormat: 'ean13' },
];
