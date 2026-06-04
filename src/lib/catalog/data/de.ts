import type { CatalogEntry } from '../../types';
export const DE: CatalogEntry[] = [
  // Groceries / Supermarkets / Discounters
  { id: 'de-lidl', name: 'Lidl', aliases: ['lidl plus', 'lidl connect'], domain: 'lidl.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'de-aldi', name: 'Aldi', aliases: ['aldi sued', 'aldi nord', 'aldi suisse'], domain: 'aldi.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-rewe', name: 'Rewe', aliases: ['rewe payback', 'rewe card'], domain: 'rewe.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'de-edeka', name: 'Edeka', aliases: ['edeka card', 'netto'], domain: 'edeka.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#00539F' },
  { id: 'de-penny', name: 'Penny', aliases: ['penny markt'], domain: 'penny.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'de-netto', name: 'Netto', aliases: ['netto marken discount'], domain: 'netto-online.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-kaufland', name: 'Kaufland', aliases: ['kaufland card', 'kaufland k'], domain: 'kaufland.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'de-real', name: 'Real', aliases: ['real markt'], domain: 'real.de', country: 'DE', defaultFormat: 'ean13' },

  // Pharmacy / Drugstore
  { id: 'de-dm', name: 'dm', aliases: ['dm drogerie', 'dm markt', 'dm aktiv plus'], domain: 'dm.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#EF7C00' },
  { id: 'de-rossmann', name: 'Rossmann', aliases: ['rossmann card'], domain: 'rossmann.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#C4003C' },
  { id: 'de-mueller', name: 'Müller', aliases: ['mueller drogerie', 'muellercard'], domain: 'mueller.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-budni', name: 'Budni', aliases: ['budnikowsky'], domain: 'budni.de', country: 'DE', defaultFormat: 'ean13' },

  // Fuel / Mobility
  { id: 'de-shell', name: 'Shell', aliases: ['shell clubsmart', 'shell station'], domain: 'shell.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-aral', name: 'Aral', aliases: ['aral payback'], domain: 'aral.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'de-esso', name: 'Esso', aliases: ['esso card'], domain: 'esso.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-totalenergies', name: 'TotalEnergies', aliases: ['total station', 'total'], domain: 'totalenergies.de', country: 'DE', defaultFormat: 'ean13' },

  // Fashion / Clothing
  { id: 'de-h-m', name: 'H&M', aliases: ['h and m', 'hm member', 'hm'], domain: 'hm.com', country: 'DE', defaultFormat: 'code128' },
  { id: 'de-zara', name: 'Zara', aliases: ['zara zclub'], domain: 'zara.com', country: 'DE', defaultFormat: 'code128' },
  { id: 'de-c-a', name: 'C&A', aliases: ['ca mode', 'c and a'], domain: 'c-and-a.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-deichmann', name: 'Deichmann', aliases: [], domain: 'deichmann.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-kik', name: 'KiK', aliases: [], domain: 'kik.de', country: 'DE', defaultFormat: 'ean13' },

  // Electronics / Tech
  { id: 'de-mediamarkt', name: 'MediaMarkt', aliases: ['media markt', 'mediamarkt club'], domain: 'mediamarkt.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'de-saturn', name: 'Saturn', aliases: ['saturn mediamarkt'], domain: 'saturn.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#000000' },
  { id: 'de-amazon', name: 'Amazon', aliases: ['amazon prime', 'amazon de'], domain: 'amazon.de', country: 'DE', defaultFormat: 'code128', brandColor: '#FF9900' },

  // DIY / Home
  { id: 'de-ikea', name: 'IKEA', aliases: ['ikea family', 'ikea deutschland'], domain: 'ikea.com', country: 'DE', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'de-hornbach', name: 'Hornbach', aliases: ['hornbach card'], domain: 'hornbach.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#F28C00' },
  { id: 'de-obi', name: 'OBI', aliases: ['obi baumarkt', 'obi club'], domain: 'obi.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'de-bauhaus', name: 'Bauhaus', aliases: [], domain: 'bauhaus.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-toom', name: 'Toom', aliases: ['toom baumarkt'], domain: 'toom.de', country: 'DE', defaultFormat: 'ean13' },

  // Travel / Airlines
  { id: 'de-lufthansa', name: 'Lufthansa', aliases: ['miles and more', 'lh miles'], domain: 'lufthansa.com', country: 'DE', defaultFormat: 'aztec', brandColor: '#05164D' },
  { id: 'de-db', name: 'Deutsche Bahn', aliases: ['db bahn', 'bahncard', 'bahn'], domain: 'bahn.de', country: 'DE', defaultFormat: 'aztec', brandColor: '#CC071E' },

  // Multi-retailer loyalty
  { id: 'de-payback', name: 'Payback', aliases: ['payback punkte', 'payback card'], domain: 'payback.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#005EB8' },
  { id: 'de-miles-more', name: 'Miles & More', aliases: ['miles more', 'miles and more'], domain: 'miles-and-more.com', country: 'DE', defaultFormat: 'aztec' },

  // Food / Coffee
  { id: 'de-starbucks', name: 'Starbucks', aliases: ['starbucks rewards'], domain: 'starbucks.de', country: 'DE', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'de-mcdonalds', name: "McDonald's", aliases: ['mcdonald', 'mcdonalds rewards', 'mymarcos'], domain: 'mcdonalds.de', country: 'DE', defaultFormat: 'qr' },
];
