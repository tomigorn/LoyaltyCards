import { openDB, type IDBPDatabase } from 'idb';
import type { Card } from './types';

const DB_NAME = 'loyaltycards';
const VERSION = 3;
let dbp: Promise<IDBPDatabase> | null = null;

function open() {
  if (!dbp) {
    dbp = openDB(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('cards'))
          db.createObjectStore('cards', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('images'))
          db.createObjectStore('images');
        if (!db.objectStoreNames.contains('logos'))
          db.createObjectStore('logos');
        if (!db.objectStoreNames.contains('logoColors'))
          db.createObjectStore('logoColors');
        // learned barcode prefixes → catalogId (self-learning brand detection, F5)
        if (!db.objectStoreNames.contains('prefixes'))
          db.createObjectStore('prefixes');
      },
    });
  }
  return dbp;
}

export async function resetDB() {
  const db = await open();
  await db.clear('cards'); await db.clear('images');
}
export async function putCard(card: Card) { await (await open()).put('cards', card); }
export async function getCard(id: string): Promise<Card | undefined> {
  return (await open()).get('cards', id);
}
export async function getAllCards(): Promise<Card[]> {
  const all = (await (await open()).getAll('cards')) as Card[];
  return all.sort((a, b) => a.order - b.order);
}
export async function deleteCard(id: string) { await (await open()).delete('cards', id); }
export async function putImage(key: string, blob: Blob) { await (await open()).put('images', blob, key); }
export async function getImage(key: string): Promise<Blob | undefined> {
  return (await open()).get('images', key);
}
export async function deleteImage(key: string) { await (await open()).delete('images', key); }
export async function clearAll() {
  const db = await open();
  await db.clear('cards'); await db.clear('images');
}

export async function getLogo(domain: string): Promise<Blob | undefined> {
  return (await open()).get('logos', domain);
}
export async function putLogo(domain: string, blob: Blob) { await (await open()).put('logos', blob, domain); }
export async function getLogoColor(domain: string): Promise<string | undefined> {
  return (await open()).get('logoColors', domain);
}
export async function putLogoColor(domain: string, hex: string) { await (await open()).put('logoColors', hex, domain); }
export async function clearLogoCache() {
  const db = await open();
  await db.clear('logos'); await db.clear('logoColors');
}

// Self-learned barcode prefix → catalogId map (F5). Keyed by the prefix string.
export async function putPrefix(prefix: string, catalogId: string) {
  await (await open()).put('prefixes', catalogId, prefix);
}
export async function getAllPrefixes(): Promise<{ prefix: string; catalogId: string }[]> {
  const db = await open();
  const keys = (await db.getAllKeys('prefixes')) as string[];
  const vals = (await db.getAll('prefixes')) as string[];
  return keys.map((prefix, i) => ({ prefix, catalogId: vals[i] }));
}
