import type { CatalogEntry } from '../../types';
export const CH: CatalogEntry[] = [
  // Groceries / Supermarkets
  { id: 'ch-migros', name: 'Migros', program: 'Cumulus', programColor: '#7AB51D', programDomain: 'cumulus.ch', aliases: ['cumulus', 'cumulus card'], domain: 'migros.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#FF6600' },
  { id: 'ch-coop', name: 'Coop', program: 'Supercard', programColor: '#EB690B', programDomain: 'supercard.ch', aliases: ['supercard', 'coop city', 'coop supercard'], domain: 'coop.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'ch-denner', name: 'Denner', aliases: ['denner karte'], domain: 'denner.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'ch-aldi', name: 'Aldi Suisse', aliases: ['aldi', 'aldi ch'], domain: 'aldi.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-lidl', name: 'Lidl Schweiz', program: 'Plus', programColor: '#0050AA', aliases: ['lidl', 'lidl ch', 'lidl plus'], domain: 'lidl.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'ch-volg', name: 'Volg', program: 'TopCard', aliases: ['topcard volg'], domain: 'volg.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-leshop', name: 'LeShop', aliases: ['migros leshop'], domain: 'leshop.ch', country: 'CH', defaultFormat: 'ean13' },

  // Pharmacy / Drugstore / Health
  { id: 'ch-amavita', name: 'Amavita', aliases: ['amavita apotheke'], domain: 'amavita.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-toppharm', name: 'TopPharm', aliases: ['toppharm apotheke'], domain: 'toppharm.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-vitacost', name: 'Vitacost', aliases: [], domain: 'vitacost.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-zur-rose', name: 'Zur Rose', aliases: ['zur rose apotheke'], domain: 'zurrose.ch', country: 'CH', defaultFormat: 'ean13' },

  // Fuel / Mobility
  { id: 'ch-shell', name: 'Shell', program: 'ClubSmart', aliases: ['shell clubsmart'], domain: 'shell.com', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-avia', name: 'AVIA', aliases: [], domain: 'avia.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-agrola', name: 'Agrola', aliases: [], domain: 'agrola.ch', country: 'CH', defaultFormat: 'ean13' },

  // Fashion / Department
  { id: 'ch-manor', name: 'Manor', aliases: ['manor card', 'manor shopping'], domain: 'manor.ch', country: 'CH', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'ch-h-m', name: 'H&M', program: 'Member', aliases: ['h and m', 'hm member'], domain: 'hm.com', country: 'CH', defaultFormat: 'code128' },
  { id: 'ch-zara', name: 'Zara', aliases: [], domain: 'zara.com', country: 'CH', defaultFormat: 'code128' },
  { id: 'ch-calida', name: 'Calida', aliases: ['calida club'], domain: 'calida.com', country: 'CH', defaultFormat: 'code128' },

  // Electronics / Tech
  { id: 'ch-digitec', name: 'Digitec', aliases: ['digitec galaxus', 'galaxus'], domain: 'digitec.ch', country: 'CH', defaultFormat: 'code128' },
  { id: 'ch-microspot', name: 'Microspot', aliases: [], domain: 'microspot.ch', country: 'CH', defaultFormat: 'code128' },

  // DIY / Home
  { id: 'ch-ikea', name: 'IKEA', program: 'Family', programColor: '#0058A3', aliases: ['ikea family', 'ikea schweiz'], domain: 'ikea.com', country: 'CH', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'ch-bauhaus', name: 'Bauhaus', aliases: [], domain: 'bauhaus.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-jumbo', name: 'Jumbo', aliases: ['jumbo baumarkt', 'jumbo card'], domain: 'jumbo.ch', country: 'CH', defaultFormat: 'ean13' },
  { id: 'ch-obi', name: 'OBI', aliases: [], domain: 'obi.ch', country: 'CH', defaultFormat: 'ean13' },

  // Travel / Transport
  { id: 'ch-sbb', name: 'SBB', program: 'SwissPass', aliases: ['cff', 'ffs', 'swisspass', 'swiss pass'], domain: 'sbb.ch', country: 'CH', defaultFormat: 'aztec' },
  { id: 'ch-swiss', name: 'SWISS', program: 'Miles & More', programColor: '#05164D', programDomain: 'miles-and-more.com', aliases: ['swiss airlines', 'swiss miles more', 'miles and more'], domain: 'swiss.com', country: 'CH', defaultFormat: 'aztec', brandColor: '#B41E21' },
  { id: 'ch-mobility', name: 'Mobility', aliases: ['mobility carsharing'], domain: 'mobility.ch', country: 'CH', defaultFormat: 'code128' },

  // Other notable loyalty programs
  { id: 'ch-starbucks', name: 'Starbucks', program: 'Rewards', aliases: ['starbucks rewards'], domain: 'starbucks.com', country: 'CH', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'ch-mcdonalds', name: "McDonald's", program: 'MyMcDonald\'s Rewards', aliases: ['mcdonald', 'mymarcos', 'mcdonalds'], domain: 'mcdonalds.com', country: 'CH', defaultFormat: 'qr' },
  { id: 'ch-galaxus', name: 'Galaxus', aliases: ['digitec galaxus'], domain: 'galaxus.ch', country: 'CH', defaultFormat: 'code128' },
];
