import type { CatalogEntry } from '../types';
import { CH } from './data/ch';
import { DE } from './data/de';
import { FR } from './data/fr';
import { IT } from './data/it';
import { AT } from './data/at';
import { US } from './data/us';
import { CA } from './data/ca';
export const CATALOG: CatalogEntry[] = [...CH, ...DE, ...FR, ...IT, ...AT, ...US, ...CA];
