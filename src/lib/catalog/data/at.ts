import type { CatalogEntry } from '../../types';
export const AT: CatalogEntry[] = [
  // Groceries / Supermarkets / Discounters
  { id: 'at-billa', name: 'Billa', program: 'jö Bonus Club', aliases: ['billa plus', 'billa club', 'billa card'], domain: 'billa.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#FFD700' },
  { id: 'at-spar', name: 'Spar', aliases: ['spar austria', 'eurospar', 'interspar', 'spar my club'], domain: 'spar.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'at-hofer', name: 'Hofer', aliases: ['hofer aldi', 'hofer karte'], domain: 'hofer.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#004A97' },
  { id: 'at-lidl', name: 'Lidl Österreich', program: 'Plus', aliases: ['lidl', 'lidl plus', 'lidl at'], domain: 'lidl.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'at-merkur', name: 'Merkur', program: 'jö Bonus Club', aliases: ['merkur markt'], domain: 'merkurmarkt.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'at-penny', name: 'Penny Österreich', aliases: ['penny at', 'penny markt'], domain: 'penny.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'at-mpreis', name: 'MPreis', aliases: [], domain: 'mpreis.at', country: 'AT', defaultFormat: 'ean13' },
  { id: 'at-adeg', name: 'ADEG', aliases: ['adeg markt'], domain: 'adeg.at', country: 'AT', defaultFormat: 'ean13' },

  // Pharmacy / Drugstore / Health
  { id: 'at-dm', name: 'dm Österreich', program: 'Payback', aliases: ['dm drogerie', 'dm aktiv plus', 'dm austria'], domain: 'dm.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#EF7C00' },
  { id: 'at-bipa', name: 'Bipa', program: 'jö Bonus Club', aliases: ['bipa card', 'bipa drogerie'], domain: 'bipa.com', country: 'AT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'at-mueller', name: 'Müller', aliases: ['mueller drogerie', 'muellercard'], domain: 'mueller.at', country: 'AT', defaultFormat: 'ean13' },

  // Fuel
  { id: 'at-bp', name: 'BP Österreich', aliases: ['bp', 'bp station'], domain: 'bp.com', country: 'AT', defaultFormat: 'ean13' },
  { id: 'at-shell', name: 'Shell', program: 'ClubSmart', aliases: ['shell station', 'shell clubsmart'], domain: 'shell.com', country: 'AT', defaultFormat: 'ean13' },
  { id: 'at-avanti', name: 'Avanti', aliases: ['avanti tankstelle'], domain: 'avanti.at', country: 'AT', defaultFormat: 'ean13' },
  { id: 'at-eni', name: 'Eni', aliases: ['eni station', 'agip'], domain: 'eni.com', country: 'AT', defaultFormat: 'ean13', brandColor: '#FFCC00' },

  // Fashion / Clothing
  { id: 'at-h-m', name: 'H&M', program: 'Member', aliases: ['h and m', 'hm', 'hm member'], domain: 'hm.com', country: 'AT', defaultFormat: 'code128' },
  { id: 'at-zara', name: 'Zara', aliases: ['zara austria'], domain: 'zara.com', country: 'AT', defaultFormat: 'code128' },
  { id: 'at-c-a', name: 'C&A', aliases: ['ca mode', 'c and a'], domain: 'c-and-a.com', country: 'AT', defaultFormat: 'ean13' },
  { id: 'at-deichmann', name: 'Deichmann', aliases: ['deichmann schuhe'], domain: 'deichmann.com', country: 'AT', defaultFormat: 'ean13' },

  // Electronics / Tech
  { id: 'at-mediamarkt', name: 'MediaMarkt', aliases: ['media markt', 'mediamarkt club'], domain: 'mediamarkt.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'at-saturn', name: 'Saturn', aliases: [], domain: 'saturn.at', country: 'AT', defaultFormat: 'ean13' },

  // DIY / Home
  { id: 'at-ikea', name: 'IKEA', program: 'Family', aliases: ['ikea family', 'ikea oesterreich'], domain: 'ikea.com', country: 'AT', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'at-bauhaus', name: 'Bauhaus', aliases: ['bauhaus austria'], domain: 'bauhaus.at', country: 'AT', defaultFormat: 'ean13' },
  { id: 'at-obi', name: 'OBI', aliases: ['obi baumarkt'], domain: 'obi.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'at-hornbach', name: 'Hornbach', aliases: [], domain: 'hornbach.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#F28C00' },

  // Travel / Airlines
  { id: 'at-austrian', name: 'Austrian Airlines', program: 'Miles & More', aliases: ['austrian', 'miles and more', 'aua'], domain: 'austrian.com', country: 'AT', defaultFormat: 'aztec', brandColor: '#CC071E' },
  { id: 'at-oebb', name: 'ÖBB', program: 'Vorteilscard', aliases: ['obb', 'oebb', 'vorteilscard'], domain: 'oebb.at', country: 'AT', defaultFormat: 'aztec', brandColor: '#CC071E' },

  // Multi-retailer loyalty
  { id: 'at-payback', name: 'Payback', aliases: ['payback punkte', 'payback karte'], domain: 'payback.at', country: 'AT', defaultFormat: 'ean13', brandColor: '#005EB8' },

  // Coffee / Food
  { id: 'at-starbucks', name: 'Starbucks', program: 'Rewards', aliases: ['starbucks rewards'], domain: 'starbucks.com', country: 'AT', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'at-mcdonalds', name: "McDonald's", program: 'MyMcDonald\'s Rewards', aliases: ['mcdonald', 'mcdonalds rewards'], domain: 'mcdonalds.com', country: 'AT', defaultFormat: 'qr' },
];
