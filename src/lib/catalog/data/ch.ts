import type { CatalogEntry } from '../../types';
export const CH: CatalogEntry[] = [
  { id: 'ch-migros', name: 'Migros', aliases: ['cumulus'], domain: 'migros.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#FF6600' },
  { id: 'ch-coop', name: 'Coop', aliases: ['supercard', 'coop city'], domain: 'coop.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'ch-denner', name: 'Denner', aliases: [], domain: 'denner.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'ch-manor', name: 'Manor', aliases: ['manor card'], domain: 'manor.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'ch-digitec', name: 'Digitec', aliases: ['digitec galaxus', 'galaxus'], domain: 'digitec.ch', country: 'CH', defaultFormat: 'code128' },
  { id: 'ch-ikea', name: 'IKEA', aliases: ['ikea family'], domain: 'ikea.com', country: 'CH', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'ch-sbb', name: 'SBB', aliases: ['cff', 'ffs', 'swisspass'], domain: 'sbb.ch', country: 'CH', defaultFormat: 'aztec' },
];
