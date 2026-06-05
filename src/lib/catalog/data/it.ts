import type { CatalogEntry } from '../../types';
export const IT: CatalogEntry[] = [
  // Groceries / Supermarkets
  { id: 'it-esselunga', name: 'Esselunga', program: 'Fidelity', aliases: ['fidelity esselunga', 'carta fidelity'], domain: 'esselunga.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'it-conad', name: 'Conad', program: 'Conad Card', aliases: ['conad card', 'conad societa cooperativa'], domain: 'conad.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'it-coop', name: 'Coop Italia', aliases: ['coop socio', 'coop card', 'coop'], domain: 'coop.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'it-carrefour', name: 'Carrefour Italia', aliases: ['carrefour', 'carrefour market'], domain: 'carrefour.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#004A97' },
  { id: 'it-lidl', name: 'Lidl Italia', program: 'Plus', programColor: '#0050AA', aliases: ['lidl', 'lidl plus', 'lidl it'], domain: 'lidl.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#0050AA' },
  { id: 'it-aldi', name: 'Aldi Italia', aliases: ['aldi', 'aldi it'], domain: 'aldi.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-pam', name: 'Pam', aliases: ['pam panorama', 'carta pam'], domain: 'pampanorama.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-simply', name: 'Simply', aliases: ['simply market', 'auchan simply'], domain: 'simplymarket.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-eurospin', name: 'Eurospin', aliases: [], domain: 'eurospin.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-despar', name: 'Despar', aliases: ['despar italia', 'interspar'], domain: 'despar.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'it-iper', name: 'Iper', aliases: ['iper montebello', 'iper lombardo'], domain: 'iper.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-bennet', name: 'Bennet', aliases: ['bennet card'], domain: 'bennet.it', country: 'IT', defaultFormat: 'ean13' },

  // Pharmacy / Health / Beauty
  { id: 'it-lloyds', name: 'Lloyd Farmacia', aliases: ['lloyds farmacia', 'lloyds pharmacy'], domain: 'lloydfarma.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-acqua-sapone', name: 'Acqua & Sapone', aliases: ['acqua sapone card'], domain: 'acquaesapone.it', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-dm', name: 'dm Italia', aliases: ['dm drogerie', 'dm italia'], domain: 'dm.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#EF7C00' },
  { id: 'it-sephora', name: 'Sephora', program: 'Beauty Insider', programColor: '#000000', aliases: ['sephora beauty pass'], domain: 'sephora.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#000000' },

  // Fuel
  { id: 'it-eni', name: 'Eni', program: 'Enilive Rewards', aliases: ['eni station', 'eni rewards', 'enilive'], domain: 'eni.com', country: 'IT', defaultFormat: 'ean13', brandColor: '#FFCC00' },
  { id: 'it-totalenergies', name: 'TotalEnergies', aliases: ['total', 'total station'], domain: 'totalenergies.com', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-shell', name: 'Shell', program: 'ClubSmart', aliases: ['shell station', 'shell clubsmart'], domain: 'shell.com', country: 'IT', defaultFormat: 'ean13' },
  { id: 'it-ip', name: 'IP', aliases: ['ip energie', 'ip stazione'], domain: 'ip-energia.it', country: 'IT', defaultFormat: 'ean13' },

  // Fashion / Clothing
  { id: 'it-h-m', name: 'H&M', program: 'Member', aliases: ['h and m', 'hm', 'hm member'], domain: 'hm.com', country: 'IT', defaultFormat: 'code128' },
  { id: 'it-zara', name: 'Zara', aliases: ['zara italia'], domain: 'zara.com', country: 'IT', defaultFormat: 'code128' },
  { id: 'it-ovs', name: 'OVS', program: 'OVS Club', aliases: ['ovs club', 'oviesse'], domain: 'ovs.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'it-coin', name: 'Coin', aliases: ['coin excelsior', 'coincard'], domain: 'coin.it', country: 'IT', defaultFormat: 'ean13' },

  // Electronics / Tech
  { id: 'it-mediaworld', name: 'MediaWorld', aliases: ['media world', 'mediamarkt italia'], domain: 'mediaworld.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#CC071E' },
  { id: 'it-unieuro', name: 'Unieuro', aliases: ['unieuro card'], domain: 'unieuro.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#E2001A' },
  { id: 'it-euronics', name: 'Euronics', aliases: ['euronics card'], domain: 'euronics.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#009EE2' },

  // DIY / Home
  { id: 'it-ikea', name: 'IKEA', program: 'Family', programColor: '#0058A3', aliases: ['ikea family', 'ikea italia'], domain: 'ikea.com', country: 'IT', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'it-leroy-merlin', name: 'Leroy Merlin', aliases: ['leroy merlin italia'], domain: 'leroymerlin.it', country: 'IT', defaultFormat: 'ean13', brandColor: '#009640' },
  { id: 'it-bricocenter', name: 'Bricocenter', aliases: [], domain: 'bricocenter.it', country: 'IT', defaultFormat: 'ean13' },

  // Travel / Airlines
  { id: 'it-ita-airways', name: 'ITA Airways', program: 'Volare', aliases: ['ita', 'volare', 'alitalia'], domain: 'ita-airways.com', country: 'IT', defaultFormat: 'aztec', brandColor: '#002E5D' },
  { id: 'it-trenitalia', name: 'Trenitalia', program: 'CartaFRECCIA', aliases: ['trenitalia cartafreccia', 'cartafreccia'], domain: 'trenitalia.com', country: 'IT', defaultFormat: 'aztec', brandColor: '#CC071E' },

  // Coffee / Food
  { id: 'it-starbucks', name: 'Starbucks', program: 'Rewards', aliases: ['starbucks rewards'], domain: 'starbucks.com', country: 'IT', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'it-mcdonalds', name: "McDonald's", program: 'MyMcDonald\'s Rewards', aliases: ['mcdonald', 'mcdonalds rewards'], domain: 'mcdonalds.com', country: 'IT', defaultFormat: 'qr' },
];
