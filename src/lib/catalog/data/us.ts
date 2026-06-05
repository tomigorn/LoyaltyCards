import type { CatalogEntry } from '../../types';
export const US: CatalogEntry[] = [
  // Groceries / Supermarkets / Wholesale
  { id: 'us-walmart', name: 'Walmart', aliases: ['walmart rewards', 'walmart+', 'walmart plus'], domain: 'walmart.com', country: 'US', defaultFormat: 'code128', brandColor: '#0071CE' },
  { id: 'us-target', name: 'Target', program: 'Circle', aliases: ['target circle', 'redcard'], domain: 'target.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-costco', name: 'Costco', aliases: ['costco membership', 'costco warehouse'], domain: 'costco.com', country: 'US', defaultFormat: 'code128', brandColor: '#005DAA' },
  { id: 'us-kroger', name: 'Kroger', program: 'Kroger Plus', aliases: ['kroger plus', 'kroger rewards'], domain: 'kroger.com', country: 'US', defaultFormat: 'code128', brandColor: '#004990' },
  { id: 'us-safeway', name: 'Safeway', program: 'for U', aliases: ['safeway for u', 'safeway rewards'], domain: 'safeway.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-publix', name: 'Publix', aliases: ['publix savings'], domain: 'publix.com', country: 'US', defaultFormat: 'code128', brandColor: '#1B7E2D' },
  { id: 'us-whole-foods', name: 'Whole Foods Market', aliases: ['whole foods', 'amazon whole foods'], domain: 'wholefoodsmarket.com', country: 'US', defaultFormat: 'code128', brandColor: '#009640' },
  { id: 'us-albertsons', name: 'Albertsons', program: 'for U', aliases: ['albertsons for u', 'albertsons rewards'], domain: 'albertsons.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-wegmans', name: 'Wegmans', aliases: ['wegmans shopper'], domain: 'wegmans.com', country: 'US', defaultFormat: 'code128', brandColor: '#AA0000' },
  { id: 'us-aldi', name: 'ALDI', aliases: ['aldi us'], domain: 'aldi.us', country: 'US', defaultFormat: 'code128' },
  { id: 'us-trader-joes', name: "Trader Joe's", aliases: ['trader joes'], domain: 'traderjoes.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-harris-teeter', name: 'Harris Teeter', program: 'VIC Card', aliases: ['vip card harris teeter'], domain: 'harristeeter.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-meijer', name: 'Meijer', program: 'mPerks', aliases: ['mperks', 'meijer rewards'], domain: 'meijer.com', country: 'US', defaultFormat: 'code128', brandColor: '#CE0E2D' },
  { id: 'us-heb', name: 'H-E-B', aliases: ['heb', 'h e b'], domain: 'heb.com', country: 'US', defaultFormat: 'code128', brandColor: '#ED1C2E' },
  { id: 'us-giant-eagle', name: 'Giant Eagle', program: 'myPerks', aliases: ['giant eagle advantage', 'myperks'], domain: 'gianteagle.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-sams-club', name: "Sam's Club", aliases: ['sams club', 'sams club membership'], domain: 'samsclub.com', country: 'US', defaultFormat: 'code128', brandColor: '#0067A0' },
  { id: 'us-bjs', name: "BJ's Wholesale Club", aliases: ['bjs', 'bjs wholesale'], domain: 'bjs.com', country: 'US', defaultFormat: 'code128', brandColor: '#D5212B' },

  // Pharmacy / Drug Stores
  { id: 'us-cvs', name: 'CVS', program: 'ExtraCare', aliases: ['cvs pharmacy', 'cvs extracare', 'cvs caremark'], domain: 'cvs.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-walgreens', name: 'Walgreens', program: 'myWalgreens', aliases: ['walgreens balance rewards', 'mywalgreens'], domain: 'walgreens.com', country: 'US', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'us-rite-aid', name: 'Rite Aid', program: 'wellness+ Rewards', aliases: ['rite aid wellness plus'], domain: 'riteaid.com', country: 'US', defaultFormat: 'code128', brandColor: '#003087' },

  // Fuel / Convenience
  { id: 'us-shell', name: 'Shell', program: 'Fuel Rewards', aliases: ['shell us', 'shell rewards', 'shell drive for five'], domain: 'shell.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-exxon', name: 'Exxon', program: 'Plenti+', aliases: ['exxon mobil', 'mobil', 'speedpass+'], domain: 'exxon.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-bp', name: 'BP', aliases: ['bp rewards', 'ampm'], domain: 'bp.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-chevron', name: 'Chevron', aliases: ['chevron techron', 'texaco'], domain: 'chevron.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-7-eleven', name: '7-Eleven', program: '7Rewards', aliases: ['7eleven', '7rewards'], domain: '7-eleven.com', country: 'US', defaultFormat: 'qr' },
  { id: 'us-circle-k', name: 'Circle K', program: 'Inner Circle', aliases: ['circlek', 'inner circle'], domain: 'circlek.com', country: 'US', defaultFormat: 'code128', brandColor: '#ED1C24' },
  { id: 'us-wawa', name: 'Wawa', program: 'Wawa Rewards', aliases: ['wawa rewards'], domain: 'wawa.com', country: 'US', defaultFormat: 'qr', brandColor: '#C8102E' },
  { id: 'us-quiktrip', name: 'QuikTrip', program: 'QT Rewards', aliases: ['quiktrip', 'qt rewards'], domain: 'quiktrip.com', country: 'US', defaultFormat: 'qr' },

  // Fashion / Clothing
  { id: 'us-h-m', name: 'H&M', program: 'Member', aliases: ['h and m', 'hm member'], domain: 'hm.com', country: 'US', defaultFormat: 'code128' },
  { id: 'us-gap', name: 'Gap', program: 'Good Rewards', aliases: ['gap good rewards', 'gap card'], domain: 'gap.com', country: 'US', defaultFormat: 'code128', brandColor: '#1C1C1C' },
  { id: 'us-old-navy', name: 'Old Navy', program: 'Navyist Rewards', aliases: ['old navy rewards'], domain: 'oldnavy.com', country: 'US', defaultFormat: 'code128', brandColor: '#004A97' },
  { id: 'us-nordstrom', name: 'Nordstrom', program: 'Nordy Club', aliases: ['nordstrom rewards', 'nordy club'], domain: 'nordstrom.com', country: 'US', defaultFormat: 'code128', brandColor: '#000000' },
  { id: 'us-macys', name: "Macy's", program: 'Star Rewards', aliases: ['macys star rewards'], domain: 'macys.com', country: 'US', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'us-kohls', name: "Kohl's", program: 'Rewards', aliases: ['kohls rewards', 'yes2you'], domain: 'kohls.com', country: 'US', defaultFormat: 'code128', brandColor: '#004A97' },
  { id: 'us-tj-maxx', name: 'T.J.Maxx', program: 'TJX Rewards', aliases: ['tjmaxx', 'tj maxx', 'tjx rewards'], domain: 'tjmaxx.tjx.com', country: 'US', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'us-victorias-secret', name: "Victoria's Secret", aliases: ['victorias secret', 'vs pink'], domain: 'victoriassecret.com', country: 'US', defaultFormat: 'code128', brandColor: '#ED145B' },
  { id: 'us-dsw', name: 'DSW', program: 'VIP Rewards', aliases: ['dsw vip', 'designer shoe warehouse'], domain: 'dsw.com', country: 'US', defaultFormat: 'code128' },

  // Electronics / Tech
  { id: 'us-best-buy', name: 'Best Buy', program: 'My Best Buy', aliases: ['best buy rewards', 'my best buy'], domain: 'bestbuy.com', country: 'US', defaultFormat: 'code128', brandColor: '#0046BE' },
  { id: 'us-apple', name: 'Apple', aliases: ['apple rewards', 'apple card'], domain: 'apple.com', country: 'US', defaultFormat: 'qr', brandColor: '#555555' },
  { id: 'us-amazon', name: 'Amazon', aliases: ['amazon prime', 'amazon rewards'], domain: 'amazon.com', country: 'US', defaultFormat: 'code128', brandColor: '#FF9900' },
  { id: 'us-gamestop', name: 'GameStop', program: 'PowerUp Rewards', aliases: ['powerup rewards', 'game stop'], domain: 'gamestop.com', country: 'US', defaultFormat: 'code128', brandColor: '#EC1C24' },

  // DIY / Home
  { id: 'us-home-depot', name: 'The Home Depot', program: 'Pro Xtra', aliases: ['home depot', 'pro xtra'], domain: 'homedepot.com', country: 'US', defaultFormat: 'code128', brandColor: '#F96302' },
  { id: 'us-lowes', name: "Lowe's", program: 'MyLowe\'s Rewards', aliases: ['lowes', 'mylowe\'s rewards'], domain: 'lowes.com', country: 'US', defaultFormat: 'code128', brandColor: '#004990' },
  { id: 'us-ikea', name: 'IKEA', program: 'Family', aliases: ['ikea family'], domain: 'ikea.com', country: 'US', defaultFormat: 'code128', brandColor: '#0058A3' },
  { id: 'us-ace-hardware', name: 'Ace Hardware', program: 'Ace Rewards', aliases: ['ace rewards'], domain: 'acehardware.com', country: 'US', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'us-bed-bath-beyond', name: 'Bed Bath & Beyond', aliases: ['bed bath and beyond'], domain: 'bedbathandbeyond.com', country: 'US', defaultFormat: 'code128' },

  // Sports / Outdoor
  { id: 'us-dicks', name: "Dick's Sporting Goods", program: 'ScoreCard', aliases: ['dicks sporting goods', 'scorecard rewards'], domain: 'dickssportinggoods.com', country: 'US', defaultFormat: 'code128', brandColor: '#006937' },
  { id: 'us-rei', name: 'REI', program: 'Co-op Membership', aliases: ['rei coop', 'rei co-op'], domain: 'rei.com', country: 'US', defaultFormat: 'code128', brandColor: '#00563F' },

  // Books / Stationery
  { id: 'us-barnes-noble', name: 'Barnes & Noble', program: 'Rewards', aliases: ['barnes and noble', 'bn rewards'], domain: 'barnesandnoble.com', country: 'US', defaultFormat: 'code128', brandColor: '#000000' },

  // Beauty / Cosmetics
  { id: 'us-ulta', name: 'Ulta Beauty', program: 'Ultamate Rewards', aliases: ['ulta', 'ultamate rewards'], domain: 'ulta.com', country: 'US', defaultFormat: 'code128', brandColor: '#E41E26' },
  { id: 'us-sephora', name: 'Sephora', program: 'Beauty Insider', aliases: ['sephora beauty insider'], domain: 'sephora.com', country: 'US', defaultFormat: 'code128', brandColor: '#000000' },

  // Pet
  { id: 'us-petco', name: 'Petco', program: 'Vital Care', aliases: ['petco rewards', 'vital care'], domain: 'petco.com', country: 'US', defaultFormat: 'code128', brandColor: '#003DA5' },
  { id: 'us-petsmart', name: 'PetSmart', program: 'Treats', aliases: ['petsmart treats'], domain: 'petsmart.com', country: 'US', defaultFormat: 'code128' },

  // Restaurants / Fast Food
  { id: 'us-chipotle', name: 'Chipotle', program: 'Rewards', aliases: ['chipotle rewards'], domain: 'chipotle.com', country: 'US', defaultFormat: 'qr', brandColor: '#A81612' },
  { id: 'us-panera', name: 'Panera Bread', program: 'MyPanera', aliases: ['panera', 'mypanera'], domain: 'panerabread.com', country: 'US', defaultFormat: 'qr', brandColor: '#5E8C31' },
  { id: 'us-taco-bell', name: 'Taco Bell', program: 'Rewards', aliases: ['taco bell rewards'], domain: 'tacobell.com', country: 'US', defaultFormat: 'qr', brandColor: '#702082' },
  { id: 'us-wendys', name: "Wendy's", program: 'Rewards', aliases: ['wendys rewards'], domain: 'wendys.com', country: 'US', defaultFormat: 'qr', brandColor: '#E2203D' },
  { id: 'us-chick-fil-a', name: 'Chick-fil-A', program: 'Rewards', aliases: ['chickfila', 'chick fil a one'], domain: 'chick-fil-a.com', country: 'US', defaultFormat: 'qr', brandColor: '#E51636' },
  { id: 'us-panda-express', name: 'Panda Express', program: 'Panda Rewards', aliases: ['panda rewards'], domain: 'pandaexpress.com', country: 'US', defaultFormat: 'qr' },

  // Travel / Airlines
  { id: 'us-delta', name: 'Delta Air Lines', program: 'SkyMiles', aliases: ['delta skymiles', 'skymiles'], domain: 'delta.com', country: 'US', defaultFormat: 'aztec', brandColor: '#003366' },
  { id: 'us-united', name: 'United Airlines', program: 'MileagePlus', aliases: ['mileageplus', 'united mileageplus'], domain: 'united.com', country: 'US', defaultFormat: 'aztec', brandColor: '#002244' },
  { id: 'us-american-airlines', name: 'American Airlines', program: 'AAdvantage', aliases: ['aadvantage', 'aa aadvantage'], domain: 'aa.com', country: 'US', defaultFormat: 'aztec', brandColor: '#0078D2' },
  { id: 'us-southwest', name: 'Southwest Airlines', program: 'Rapid Rewards', aliases: ['rapid rewards', 'southwest rapid rewards'], domain: 'southwest.com', country: 'US', defaultFormat: 'aztec', brandColor: '#304CB2' },
  { id: 'us-marriott', name: 'Marriott', program: 'Bonvoy', aliases: ['marriott bonvoy', 'bonvoy'], domain: 'marriott.com', country: 'US', defaultFormat: 'aztec', brandColor: '#AA0000' },
  { id: 'us-hilton', name: 'Hilton', program: 'Honors', aliases: ['hilton honors'], domain: 'hilton.com', country: 'US', defaultFormat: 'aztec', brandColor: '#2D2D6B' },

  // Coffee / Fast Food
  { id: 'us-starbucks', name: 'Starbucks', program: 'Rewards', aliases: ['starbucks rewards'], domain: 'starbucks.com', country: 'US', defaultFormat: 'qr', brandColor: '#006241' },
  { id: 'us-mcdonalds', name: "McDonald's", program: 'MyMcDonald\'s Rewards', aliases: ['mcdonald', 'mcdonalds rewards', 'mymarcos'], domain: 'mcdonalds.com', country: 'US', defaultFormat: 'qr' },
  { id: 'us-subway', name: 'Subway', program: 'MVP Rewards', aliases: ['subway myway rewards'], domain: 'subway.com', country: 'US', defaultFormat: 'qr' },
  { id: 'us-dunkin', name: "Dunkin'", program: 'Rewards', aliases: ['dunkin donuts', 'dd perks'], domain: 'dunkindonuts.com', country: 'US', defaultFormat: 'qr', brandColor: '#FF671F' },
  { id: 'us-dominos', name: "Domino's", program: 'Piece of the Pie Rewards', aliases: ['dominos pizza rewards'], domain: 'dominos.com', country: 'US', defaultFormat: 'qr', brandColor: '#006491' },
];
