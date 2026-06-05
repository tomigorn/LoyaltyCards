import type { CatalogEntry } from '../../types';
export const DE: CatalogEntry[] = [
  // Groceries / Supermarkets / Discounters
  { id: 'de-lidl', name: 'Lidl', program: 'Plus', aliases: ['lidl plus', 'lidl connect'], domain: 'lidl.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'de-aldi', name: 'Aldi', aliases: ['aldi sued', 'aldi nord', 'aldi suisse'], domain: 'aldi.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-rewe', name: 'Rewe', program: 'Payback', aliases: ['rewe payback', 'rewe card'], domain: 'rewe.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'de-edeka', name: 'Edeka', aliases: ['edeka card', 'netto'], domain: 'edeka.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#00539F' },
  { id: 'de-penny', name: 'Penny', aliases: ['penny markt'], domain: 'penny.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'de-netto', name: 'Netto', aliases: ['netto marken discount'], domain: 'netto-online.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-kaufland', name: 'Kaufland', program: 'Kaufland Card', aliases: ['kaufland card', 'kaufland k'], domain: 'kaufland.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'de-real', name: 'Real', aliases: ['real markt'], domain: 'real.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-globus', name: 'Globus', aliases: ['globus markthalle'], domain: 'globus.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-tegut', name: 'tegut', aliases: ['tegut markt'], domain: 'tegut.com', country: 'DE', defaultFormat: 'ean13' },

  // Pharmacy / Drugstore
  { id: 'de-dm', name: 'dm', program: 'Payback', aliases: ['dm drogerie', 'dm markt', 'dm aktiv plus'], domain: 'dm.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#EF7C00' },
  { id: 'de-rossmann', name: 'Rossmann', aliases: ['rossmann card'], domain: 'rossmann.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#C4003C' },
  { id: 'de-mueller', name: 'Müller', aliases: ['mueller drogerie', 'muellercard'], domain: 'mueller.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-budni', name: 'Budni', aliases: ['budnikowsky'], domain: 'budni.de', country: 'DE', defaultFormat: 'ean13' },

  // Fuel / Mobility
  { id: 'de-shell', name: 'Shell', program: 'ClubSmart', aliases: ['shell clubsmart', 'shell station'], domain: 'shell.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-aral', name: 'Aral', program: 'Payback', aliases: ['aral payback'], domain: 'aral.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'de-esso', name: 'Esso', aliases: ['esso card'], domain: 'esso.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-totalenergies', name: 'TotalEnergies', aliases: ['total station', 'total'], domain: 'totalenergies.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-jet', name: 'Jet', aliases: ['jet tankstelle'], domain: 'jet.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-star', name: 'Star', aliases: ['star tankstelle'], domain: 'star.de', country: 'DE', defaultFormat: 'ean13' },

  // Fashion / Clothing
  { id: 'de-h-m', name: 'H&M', program: 'Member', aliases: ['h and m', 'hm member', 'hm'], domain: 'hm.com', country: 'DE', defaultFormat: 'code128' },
  { id: 'de-zara', name: 'Zara', aliases: ['zara zclub'], domain: 'zara.com', country: 'DE', defaultFormat: 'code128' },
  { id: 'de-c-a', name: 'C&A', aliases: ['ca mode', 'c and a'], domain: 'c-and-a.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-deichmann', name: 'Deichmann', aliases: [], domain: 'deichmann.com', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-kik', name: 'KiK', aliases: [], domain: 'kik.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-peek-cloppenburg', name: 'Peek & Cloppenburg', aliases: ['peek cloppenburg', 'p&c'], domain: 'peek-cloppenburg.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-ernstings-family', name: "Ernsting's family", aliases: ['ernstings family'], domain: 'ernstings-family.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-snipes', name: 'Snipes', aliases: ['snipes sneaker'], domain: 'snipes.com', country: 'DE', defaultFormat: 'ean13' },

  // Electronics / Tech
  { id: 'de-mediamarkt', name: 'MediaMarkt', aliases: ['media markt', 'mediamarkt club'], domain: 'mediamarkt.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'de-saturn', name: 'Saturn', aliases: ['saturn mediamarkt'], domain: 'saturn.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#000000' },
  { id: 'de-amazon', name: 'Amazon', aliases: ['amazon prime', 'amazon de'], domain: 'amazon.de', country: 'DE', defaultFormat: 'code128', brandColor: '#FF9900' },

  // DIY / Home
  { id: 'de-ikea', name: 'IKEA', program: 'Family', aliases: ['ikea family', 'ikea deutschland'], domain: 'ikea.com', country: 'DE', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'de-hornbach', name: 'Hornbach', aliases: ['hornbach card'], domain: 'hornbach.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#F28C00' },
  { id: 'de-obi', name: 'OBI', aliases: ['obi baumarkt', 'obi club'], domain: 'obi.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'de-bauhaus', name: 'Bauhaus', aliases: [], domain: 'bauhaus.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-toom', name: 'Toom', aliases: ['toom baumarkt'], domain: 'toom.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-xxxlutz', name: 'XXXLutz', aliases: ['xxxlutz moebel'], domain: 'xxxlutz.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'de-hoeffner', name: 'Höffner', aliases: ['hoeffner moebel'], domain: 'hoeffner.de', country: 'DE', defaultFormat: 'ean13' },

  // Sports / Outdoor
  { id: 'de-intersport', name: 'Intersport', aliases: ['intersport deutschland'], domain: 'intersport.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-decathlon', name: 'Decathlon', aliases: ['decathlon club'], domain: 'decathlon.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#0082C3' },
  { id: 'de-sportscheck', name: 'SportScheck', aliases: ['sport scheck'], domain: 'sportscheck.com', country: 'DE', defaultFormat: 'ean13' },

  // Books / Stationery
  { id: 'de-thalia', name: 'Thalia', aliases: ['thalia buch'], domain: 'thalia.de', country: 'DE', defaultFormat: 'ean13' },
  { id: 'de-hugendubel', name: 'Hugendubel', aliases: ['hugendubel buch'], domain: 'hugendubel.de', country: 'DE', defaultFormat: 'ean13' },

  // Pet
  { id: 'de-fressnapf', name: 'Fressnapf', aliases: ['fressnapf tierbedarf'], domain: 'fressnapf.de', country: 'DE', defaultFormat: 'ean13' },

  // Telecom
  { id: 'de-telekom', name: 'Telekom', aliases: ['deutsche telekom', 't-mobile'], domain: 'telekom.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#E20074' },

  // Travel / Airlines
  { id: 'de-lufthansa', name: 'Lufthansa', program: 'Miles & More', aliases: ['miles and more', 'lh miles'], domain: 'lufthansa.com', country: 'DE', defaultFormat: 'aztec', brandColor: '#05164D' },
  { id: 'de-db', name: 'Deutsche Bahn', program: 'BahnBonus', aliases: ['db bahn', 'bahncard', 'bahn'], domain: 'bahn.de', country: 'DE', defaultFormat: 'aztec', brandColor: '#CC071E' },

  // Multi-retailer loyalty
  { id: 'de-payback', name: 'Payback', aliases: ['payback punkte', 'payback card'], domain: 'payback.de', country: 'DE', defaultFormat: 'ean13', brandColor: '#005EB8' },
  { id: 'de-miles-more', name: 'Miles & More', aliases: ['miles more', 'miles and more'], domain: 'miles-and-more.com', country: 'DE', defaultFormat: 'aztec' },

  // Food / Coffee
  { id: 'de-starbucks', name: 'Starbucks', program: 'Rewards', aliases: ['starbucks rewards'], domain: 'starbucks.com', country: 'DE', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'de-mcdonalds', name: "McDonald's", program: 'MyMcDonald\'s Rewards', aliases: ['mcdonald', 'mcdonalds rewards', 'mymarcos'], domain: 'mcdonalds.com', country: 'DE', defaultFormat: 'qr' },
];
