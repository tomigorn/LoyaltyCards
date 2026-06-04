import { openDB, type IDBPDatabase } from 'idb';
import type { Card } from './types';

const DB_NAME = 'loyaltycards';
const VERSION = 1;
let dbp: Promise<IDBPDatabase> | null = null;

function open() {
  if (!dbp) {
    dbp = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cards'))
          db.createObjectStore('cards', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('images'))
          db.createObjectStore('images');
      },
    });
  }
  return dbp;
}

export async function resetDB() {
  const db = await open();
  await db.clear('cards'); await db.clear('images');
}
export async function putCard(card: Card) { (await open()).put('cards', card); }
export async function getCard(id: string): Promise<Card | undefined> {
  return (await open()).get('cards', id);
}
export async function getAllCards(): Promise<Card[]> {
  const all = (await (await open()).getAll('cards')) as Card[];
  return all.sort((a, b) => a.order - b.order);
}
export async function deleteCard(id: string) { (await open()).delete('cards', id); }
export async function putImage(key: string, blob: Blob) { await (await open()).put('images', blob, key); }
export async function getImage(key: string): Promise<Blob | undefined> {
  return (await open()).get('images', key);
}
export async function deleteImage(key: string) { (await open()).delete('images', key); }
export async function clearAll() {
  const db = await open();
  await db.clear('cards'); await db.clear('images');
}
