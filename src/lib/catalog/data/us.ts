import type { CatalogEntry } from '../../types';
export const US: CatalogEntry[] = [
  // Groceries / Supermarkets / Wholesale
  { id: 'us-walmart', name: 'Walmart', aliases: ['walmart rewards', 'walmart+', 'walmart plus'], domain: 'walmart.com', country: 'US', defaultFormat: 'code128', brandColor: '#0071CE' },
  { id: 'us-target', name: 'Target', aliases: ['target circle', 'redcard'], domain: 'target.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-costco', name: 'Costco', aliases: ['costco membership', 'costco warehouse'], domain: 'costco.com', country: 'US', defaultFormat: 'code128', brandColor: '#005DAA' },
  { id: 'us-kroger', name: 'Kroger', aliases: ['kroger plus', 'kroger rewards'], domain: 'kroger.com', country: 'US', defaultFormat: 'code128', brandColor: '#004990' },
  { id: 'us-safeway', name: 'Safeway', aliases: ['safeway for u', 'safeway rewards'], domain: 'safeway.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-publix', name: 'Publix', aliases: ['publix savings'], domain: 'publix.com', country: 'US', defaultFormat: 'code128', brandColor: '#1B7E2D' },
  { id: 'us-whole-foods', name: 'Whole Foods Market', aliases: ['whole foods', 'amazon whole foods'], domain: 'wholefoodsmarket.com', country: 'US', defaultFormat: 'code128', brandColor: '#009640' },
  { id: 'us-albertsons', name: 'Albertsons', aliases: ['albertsons for u', 'albertsons rewards'], domain: 'albertsons.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-wegmans', name: 'Wegmans', aliases: ['wegmans shopper'], domain: 'wegmans.com', country: 'US', defaultFormat: 'code128', brandColor: '#AA0000' },
  { id: 'us-aldi', name: 'ALDI', aliases: ['aldi us'], domain: 'aldi.us', country: 'US', defaultFormat: 'code128' },
  { id: 'us-trader-joes', name: "Trader Joe's", aliases: ['trader joes'], domain: 'traderjoes.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-harris-teeter', name: 'Harris Teeter', aliases: ['vip card harris teeter'], domain: 'harristeeter.com', country: 'US', defaultFormat: 'code128' },

  // Pharmacy / Drug Stores
  { id: 'us-cvs', name: 'CVS', aliases: ['cvs pharmacy', 'cvs extracare', 'cvs caremark'], domain: 'cvs.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-walgreens', name: 'Walgreens', aliases: ['walgreens balance rewards', 'mywalgreens'], domain: 'walgreens.com', country: 'US', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'us-rite-aid', name: 'Rite Aid', aliases: ['rite aid wellness plus'], domain: 'riteaid.com', country: 'US', defaultFormat: 'code128', brandColor: '#003087' },

  // Fuel / Convenience
  { id: 'us-shell', name: 'Shell', aliases: ['shell us', 'shell rewards', 'shell drive for five'], domain: 'shell.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-exxon', name: 'Exxon', aliases: ['exxon mobil', 'mobil', 'speedpass+'], domain: 'exxon.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-bp', name: 'BP', aliases: ['bp rewards', 'ampm'], domain: 'bp.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-chevron', name: 'Chevron', aliases: ['chevron techron', 'texaco'], domain: 'chevron.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-7-eleven', name: '7-Eleven', aliases: ['7eleven', '7rewards'], domain: '7-eleven.com', country: 'US', defaultFormat: 'qr' },

  // Fashion / Clothing
  { id: 'us-h-m', name: 'H&M', aliases: ['h and m', 'hm member'], domain: 'hm.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-gap', name: 'Gap', aliases: ['gap good rewards', 'gap card'], domain: 'gap.com', country: 'US', defaultFormat: 'code128', brandColor: '#1C1C1C' },
  { id: 'us-old-navy', name: 'Old Navy', aliases: ['old navy rewards'], domain: 'oldnavy.com', country: 'US', defaultFormat: 'code128', brandColor: '#004A97' },
  { id: 'us-nordstrom', name: 'Nordstrom', aliases: ['nordstrom rewards', 'nordy club'], domain: 'nordstrom.com', country: 'US', defaultFormat: 'code128', brandColor: '#000000' },
  { id: 'us-macys', name: "Macy's", aliases: ['macys star rewards'], domain: 'macys.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-kohls', name: "Kohl's", aliases: ['kohls rewards', 'yes2you'], domain: 'kohls.com', country: 'US', defaultFormat: 'code128', brandColor: '#004A97' },

  // Electronics / Tech
  { id: 'us-best-buy', name: 'Best Buy', aliases: ['best buy rewards', 'my best buy'], domain: 'bestbuy.com', country: 'US', defaultFormat: 'code128', brandColor: '#0046BE' },
  { id: 'us-apple', name: 'Apple', aliases: ['apple rewards', 'apple card'], domain: 'apple.com', country: 'US', defaultFormat: 'qr', brandColor: '#555555' },
  { id: 'us-amazon', name: 'Amazon', aliases: ['amazon prime', 'amazon rewards'], domain: 'amazon.com', country: 'US', defaultFormat: 'code128', brandColor: '#FF9900' },

  // DIY / Home
  { id: 'us-home-depot', name: 'The Home Depot', aliases: ['home depot', 'pro xtra'], domain: 'homedepot.com', country: 'US', defaultFormat: 'code128', brandColor: '#F96302' },
  { id: 'us-lowes', name: "Lowe's", aliases: ['lowes', 'mylowe\'s rewards'], domain: 'lowes.com', country: 'US', defaultFormat: 'code128', brandColor: '#004990' },
  { id: 'us-ikea', name: 'IKEA', aliases: ['ikea family'], domain: 'ikea.com', country: 'US', defaultFormat: 'code128', brandColor: '#0058A3' },

  // Travel / Airlines
  { id: 'us-delta', name: 'Delta Air Lines', aliases: ['delta skymiles', 'skymiles'], domain: 'delta.com', country: 'US', defaultFormat: 'aztec', brandColor: '#003366' },
  { id: 'us-united', name: 'United Airlines', aliases: ['mileageplus', 'united mileageplus'], domain: 'united.com', country: 'US', defaultFormat: 'aztec', brandColor: '#002244' },
  { id: 'us-american-airlines', name: 'American Airlines', aliases: ['aadvantage', 'aa aadvantage'], domain: 'aa.com', country: 'US', defaultFormat: 'aztec', brandColor: '#0078D2' },
  { id: 'us-southwest', name: 'Southwest Airlines', aliases: ['rapid rewards', 'southwest rapid rewards'], domain: 'southwest.com', country: 'US', defaultFormat: 'aztec', brandColor: '#304CB2' },
  { id: 'us-marriott', name: 'Marriott', aliases: ['marriott bonvoy', 'bonvoy'], domain: 'marriott.com', country: 'US', defaultFormat: 'aztec', brandColor: '#AA0000' },
  { id: 'us-hilton', name: 'Hilton', aliases: ['hilton honors'], domain: 'hilton.com', country: 'US', defaultFormat: 'aztec', brandColor: '#2D2D6B' },

  // Coffee / Fast Food
  { id: 'us-starbucks', name: 'Starbucks', aliases: ['starbucks rewards'], domain: 'starbucks.com', country: 'US', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'us-mcdonalds', name: "McDonald's", aliases: ['mcdonald', 'mcdonalds rewards', 'mymarcos'], domain: 'mcdonalds.com', country: 'US', defaultFormat: 'qr' },
  { id: 'us-subway', name: 'Subway', aliases: ['subway myway rewards'], domain: 'subway.com', country: 'US', defaultFormat: 'qr' },
  { id: 'us-dunkin', name: "Dunkin'", aliases: ['dunkin donuts', 'dd perks'], domain: 'dunkindonuts.com', country: 'US', defaultFormat: 'qr', brandColor: '#FF671F' },
  { id: 'us-dominos', name: "Domino's", aliases: ['dominos pizza rewards'], domain: 'dominos.com', country: 'US', defaultFormat: 'qr', brandColor: '#006491' },
];
