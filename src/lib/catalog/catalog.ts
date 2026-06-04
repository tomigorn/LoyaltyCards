import { CATALOG } from './data';
import type { CatalogEntry } from '../types';
export function findCatalogEntry(query: string): CatalogEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return CATALOG.find(e =>
    e.id === q ||
    e.name.toLowerCase() === q ||
    e.aliases.some(a => a.toLowerCase() === q) ||
    e.name.toLowerCase().includes(q));
}
export function findCatalogById(id: string): CatalogEntry | undefined {
  return CATALOG.find(e => e.id === id);
}
export { CATALOG };
