import type { CatalogEntry } from '../../types';
export const FR: CatalogEntry[] = [
  // Groceries / Hypermarkets / Supermarkets
  { id: 'fr-carrefour', name: 'Carrefour', aliases: ['carrefour drive', 'carte carrefour', 'carrefour market'], domain: 'carrefour.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#004A97' },
  { id: 'fr-leclerc', name: 'E.Leclerc', aliases: ['leclerc', 'carte e leclerc', 'mouvement leclerc'], domain: 'leclerc.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#003DA5' },
  { id: 'fr-auchan', name: 'Auchan', aliases: ['auchan drive', 'waaoh', 'auchan retail'], domain: 'auchan.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'fr-intermarche', name: 'Intermarché', aliases: ['intermarche', 'carte intermarche'], domain: 'intermarche.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'fr-casino', name: 'Casino', aliases: ['geant casino', 'casino max'], domain: 'groupe-casino.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-monoprix', name: 'Monoprix', aliases: ['monoprix club'], domain: 'monoprix.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-franprix', name: 'Franprix', aliases: [], domain: 'franprix.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-lidl', name: 'Lidl', aliases: ['lidl plus', 'lidl france'], domain: 'lidl.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'fr-aldi', name: 'Aldi', aliases: ['aldi france'], domain: 'aldi.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-super-u', name: 'Super U', aliases: ['systeme u', 'systeme-u', 'u'], domain: 'magasins-u.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'fr-simply', name: 'Simply Market', aliases: ['simply'], domain: 'simply-market.fr', country: 'FR', defaultFormat: 'ean13' },

  // Pharmacy / Beauty / Health
  { id: 'fr-pharmacie-lafayette', name: 'Pharmacie Lafayette', aliases: ['grande pharmacie lafayette'], domain: 'pharmacies-lafayette.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-sephora', name: 'Sephora', aliases: ['sephora beauty pass'], domain: 'sephora.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#000000' },
  { id: 'fr-yves-rocher', name: 'Yves Rocher', aliases: ['yves rocher club'], domain: 'yves-rocher.fr', country: 'FR', defaultFormat: 'ean13' },

  // Fuel
  { id: 'fr-totalenergies', name: 'TotalEnergies', aliases: ['total', 'total station', 'total club'], domain: 'totalenergies.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-shell', name: 'Shell', aliases: ['shell france', 'shell clubsmart'], domain: 'shell.fr', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-bp', name: 'BP', aliases: ['bp station'], domain: 'bp.com', country: 'FR', defaultFormat: 'ean13' },

  // Fashion / Clothing / Shoes
  { id: 'fr-h-m', name: 'H&M', aliases: ['h and m', 'hm', 'hm member'], domain: 'hm.com', country: 'FR', defaultFormat: 'code128' },
  { id: 'fr-zara', name: 'Zara', aliases: ['zara france'], domain: 'zara.com', country: 'FR', defaultFormat: 'code128' },
  { id: 'fr-kiabi', name: 'Kiabi', aliases: ['kiabi club'], domain: 'kiabi.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'fr-jules', name: 'Jules', aliases: ['jules fidelite'], domain: 'jules.com', country: 'FR', defaultFormat: 'ean13' },
  { id: 'fr-lacoste', name: 'Lacoste', aliases: ['lacoste club'], domain: 'lacoste.com', country: 'FR', defaultFormat: 'code128' },

  // Electronics / Tech
  { id: 'fr-fnac', name: 'Fnac', aliases: ['fnac darty', 'fnac plus', 'carte fnac'], domain: 'fnac.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#F7A600' },
  { id: 'fr-darty', name: 'Darty', aliases: ['darty max', 'fnac darty'], domain: 'darty.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'fr-boulanger', name: 'Boulanger', aliases: ['boulanger fidelite'], domain: 'boulanger.com', country: 'FR', defaultFormat: 'ean13', brandColor: '#009EE2' },

  // Sports / Outdoor
  { id: 'fr-decathlon', name: 'Decathlon', aliases: ['decathlon club'], domain: 'decathlon.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#0082C3' },
  { id: 'fr-go-sport', name: 'Go Sport', aliases: ['gosport club'], domain: 'go-sport.com', country: 'FR', defaultFormat: 'ean13' },

  // DIY / Home
  { id: 'fr-ikea', name: 'IKEA', aliases: ['ikea family', 'ikea france'], domain: 'ikea.com', country: 'FR', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'fr-leroy-merlin', name: 'Leroy Merlin', aliases: ['leroy merlin carte'], domain: 'leroymerlin.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'fr-castorama', name: 'Castorama', aliases: ['casto'], domain: 'castorama.fr', country: 'FR', defaultFormat: 'ean13', brandColor: '#0050AA' },

  // Travel / Airlines
  { id: 'fr-air-france', name: 'Air France', aliases: ['flying blue', 'air france klm'], domain: 'airfrance.fr', country: 'FR', defaultFormat: 'aztec', brandColor: '#003E87' },
  { id: 'fr-sncf', name: 'SNCF', aliases: ['sncf connect', 'voyageur', 'carte sncf'], domain: 'sncf.com', country: 'FR', defaultFormat: 'aztec', brandColor: '#E2001A' },

  // Coffee / Food
  { id: 'fr-starbucks', name: 'Starbucks', aliases: ['starbucks rewards'], domain: 'starbucks.fr', country: 'FR', defaultFormat: 'qr', brandColor: '#006241' },
];
