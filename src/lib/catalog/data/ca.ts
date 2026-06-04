import type { CatalogEntry } from '../../types';
export const CA: CatalogEntry[] = [
  // Groceries / Supermarkets / Wholesale
  { id: 'ca-loblaws', name: 'Loblaws', aliases: ['pc optimum', 'pc points', 'president choice'], domain: 'loblaws.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'ca-shoppers', name: 'Shoppers Drug Mart', aliases: ['shoppers', 'optimum', 'pc optimum shoppers'], domain: 'shoppersdrugmart.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'ca-canadian-tire', name: 'Canadian Tire', aliases: ['canadian tire money', 'triangle rewards', 'ctm'], domain: 'canadiantire.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'ca-tim-hortons', name: 'Tim Hortons', aliases: ['timmies', 'tims rewards', 'tim rewards'], domain: 'timhortons.ca', country: 'CA', defaultFormat: 'qr', brandColor: '#C8102E' },
  { id: 'ca-sobeys', name: 'Sobeys', aliases: ['air miles sobeys', 'scene+ sobeys'], domain: 'sobeys.com', country: 'CA', defaultFormat: 'code128', brandColor: '#E2001A' },
  { id: 'ca-metro', name: 'Metro', aliases: ['metro inc', 'metro rewards'], domain: 'metro.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#E2001A' },
  { id: 'ca-real-canadian-superstore', name: 'Real Canadian Superstore', aliases: ['superstore', 'rcs', 'pc optimum superstore'], domain: 'realcanadiansuperstore.ca', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-iga', name: 'IGA', aliases: ['iga canada'], domain: 'iga.net', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'ca-costco', name: 'Costco Canada', aliases: ['costco', 'costco membership'], domain: 'costco.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#005DAA' },
  { id: 'ca-food-basics', name: 'Food Basics', aliases: ['food basics canada'], domain: 'foodbasics.ca', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-no-frills', name: 'No Frills', aliases: ['nofrills', 'pc optimum no frills'], domain: 'nofrills.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#FFCC00' },
  { id: 'ca-walmart', name: 'Walmart Canada', aliases: ['walmart ca'], domain: 'walmart.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#0071CE' },

  // Pharmacy / Health
  { id: 'ca-rexall', name: 'Rexall', aliases: ['be well rexall', 'bewell'], domain: 'rexall.ca', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-jean-coutu', name: 'Jean Coutu', aliases: ['jean coutu pcpoints', 'pcpoints jean coutu'], domain: 'jeancoutu.com', country: 'CA', defaultFormat: 'code128', brandColor: '#E2001A' },

  // Fuel / Gas
  { id: 'ca-petro-canada', name: 'Petro-Canada', aliases: ['petropoints', 'petro canada'], domain: 'petro-canada.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'ca-esso', name: 'Esso', aliases: ['esso canada', 'esso extra'], domain: 'esso.com', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-shell', name: 'Shell Canada', aliases: ['shell rewards ca'], domain: 'shell.ca', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-husky', name: 'Husky', aliases: ['husky energy', 'husky rewards'], domain: 'huskyenergy.com', country: 'CA', defaultFormat: 'code128' },

  // Fashion / Clothing
  { id: 'ca-h-m', name: 'H&M', aliases: ['h and m', 'hm', 'hm member'], domain: 'hm.com', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-winners', name: 'Winners', aliases: ['winners loyalty'], domain: 'winners.ca', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-reitmans', name: 'Reitmans', aliases: ['reitmans rewards'], domain: 'reitmans.com', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-sport-chek', name: 'Sport Chek', aliases: ['sportchek', 'triangle rewards sport chek'], domain: 'sportchek.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'ca-marks', name: "Mark's", aliases: ['marks work warehouse', 'triangle rewards marks'], domain: 'marks.com', country: 'CA', defaultFormat: 'code128' },

  // Electronics / Tech
  { id: 'ca-best-buy', name: 'Best Buy Canada', aliases: ['best buy ca', 'bestbuy canada'], domain: 'bestbuy.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#0046BE' },
  { id: 'ca-staples', name: 'Staples', aliases: ['staples canada rewards'], domain: 'staples.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },

  // DIY / Home
  { id: 'ca-home-depot', name: 'The Home Depot Canada', aliases: ['home depot canada', 'home depot ca'], domain: 'homedepot.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#F96302' },
  { id: 'ca-ikea', name: 'IKEA Canada', aliases: ['ikea family', 'ikea ca'], domain: 'ikea.com', country: 'CA', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'ca-rona', name: 'RONA', aliases: ['rona rewards'], domain: 'rona.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },

  // Travel / Airlines
  { id: 'ca-air-canada', name: 'Air Canada', aliases: ['aeroplan', 'air canada aeroplan'], domain: 'aircanada.com', country: 'CA', defaultFormat: 'aztec', brandColor: '#CC0000' },
  { id: 'ca-westjet', name: 'WestJet', aliases: ['westjet rewards'], domain: 'westjet.com', country: 'CA', defaultFormat: 'aztec', brandColor: '#009EE2' },
  { id: 'ca-via-rail', name: 'VIA Rail', aliases: ['via rail loyalty', 'preference via'], domain: 'viarail.ca', country: 'CA', defaultFormat: 'aztec', brandColor: '#E2001A' },

  // Multi-retailer / Points programs
  { id: 'ca-scene-plus', name: 'Scene+', aliases: ['scene plus', 'sceneplus', 'scene rewards'], domain: 'scene.ca', country: 'CA', defaultFormat: 'code128' },
  { id: 'ca-air-miles', name: 'AIR MILES', aliases: ['airmiles', 'air miles reward'], domain: 'airmiles.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#003DA5' },

  // Coffee / Food
  { id: 'ca-starbucks', name: 'Starbucks', aliases: ['starbucks rewards', 'starbucks canada'], domain: 'starbucks.ca', country: 'CA', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'ca-mcdonalds', name: "McDonald's", aliases: ['mcdonald', 'mcdonalds rewards canada'], domain: 'mcdonalds.ca', country: 'CA', defaultFormat: 'qr' },
  { id: 'ca-a-w', name: 'A&W', aliases: ['aw canada', 'a and w', 'a w rewards'], domain: 'aw.ca', country: 'CA', defaultFormat: 'qr', brandColor: '#F7A600' },
];
