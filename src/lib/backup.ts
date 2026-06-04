import { getAllCards, putCard, putImage, getImage, clearAll } from './db';
import type { Card } from './types';

interface BackupFile {
  version: 1;
  cards: Card[];
  images: Record<string, string>; // key → base64
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ''; for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin);
}
function base64ToBlob(b64: string): Blob {
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr]);
}

export async function exportBackup(): Promise<string> {
  const cards = await getAllCards();
  const images: Record<string, string> = {};
  const refs = new Set<string>();
  for (const c of cards) {
    [c.logo.blobRef, c.frontPhotoRef, c.backPhotoRef].forEach(r => r && refs.add(r));
  }
  for (const ref of refs) {
    const blob = await getImage(ref);
    if (blob) images[ref] = await blobToBase64(blob);
  }
  const file: BackupFile = { version: 1, cards, images };
  return JSON.stringify(file);
}

export async function importBackup(json: string, mode: 'replace' | 'merge' = 'replace') {
  const file = JSON.parse(json) as BackupFile;
  if (file.version !== 1) throw new Error('Unsupported backup version');
  if (mode === 'replace') await clearAll();
  for (const [key, b64] of Object.entries(file.images)) await putImage(key, base64ToBlob(b64));
  for (const c of file.cards) await putCard(c);
}
