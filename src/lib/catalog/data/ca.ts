import type { CatalogEntry } from '../../types';
export const CA: CatalogEntry[] = [
  { id: 'ca-loblaws', name: 'Loblaws', aliases: ['pc optimum', 'pc points'], domain: 'loblaws.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'ca-shoppers', name: 'Shoppers Drug Mart', aliases: ['shoppers', 'optimum'], domain: 'shoppersdrugmart.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#E31837' },
  { id: 'ca-canadian-tire', name: 'Canadian Tire', aliases: ['canadian tire money', 'triangle rewards'], domain: 'canadiantire.ca', country: 'CA', defaultFormat: 'code128', brandColor: '#CC0000' },
  { id: 'ca-tim-hortons', name: 'Tim Hortons', aliases: ['timmies', 'tims rewards'], domain: 'timhortons.ca', country: 'CA', defaultFormat: 'qr', brandColor: '#C8102E' },
];
