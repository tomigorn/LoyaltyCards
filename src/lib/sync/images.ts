import { pb } from '../auth/client';
import { getImage, putImage } from '../db';
import type { Card } from '../types';

type Slot = { ref: string | undefined; remoteRefField: string; fileField: string };

function slots(card: Card): Slot[] {
  return [
    { ref: card.frontPhotoRef, remoteRefField: 'frontPhotoRef', fileField: 'frontPhoto' },
    { ref: card.backPhotoRef,  remoteRefField: 'backPhotoRef',  fileField: 'backPhoto' },
    { ref: card.logo.blobRef,  remoteRefField: 'logoBlobRef',   fileField: 'logoImage' },
  ];
}

/**
 * Build a file payload for image slots whose local blob isn't yet on the server for the current ref.
 * The SDK sends multipart automatically when File values are present.
 */
export async function buildImageUploads(
  card: Card,
  remote: Record<string, unknown> | null,
): Promise<Record<string, File>> {
  const payload: Record<string, File> = {};
  for (const s of slots(card)) {
    if (!s.ref) continue;
    // Skip if the remote already has this exact ref with a file
    if (remote && remote[s.remoteRefField] === s.ref && !!remote[s.fileField]) continue;
    const blob = await getImage(s.ref);
    if (!blob) continue;
    payload[s.fileField] = new File([blob], `${s.fileField}.jpg`, { type: blob.type || 'image/jpeg' });
  }
  return payload;
}

/**
 * Download any image files this device is missing locally (matched by synced ref) into IndexedDB.
 */
export async function pullImages(remote: Record<string, any>, token: string): Promise<void> {
  const imageSlots: Array<[string, string]> = [
    ['frontPhotoRef', 'frontPhoto'],
    ['backPhotoRef',  'backPhoto'],
    ['logoBlobRef',   'logoImage'],
  ];
  for (const [refField, fileField] of imageSlots) {
    const ref: string | undefined = remote[refField];
    const file: string | undefined = remote[fileField];
    if (!ref || !file) continue;
    if (await getImage(ref)) continue; // already have it locally
    try {
      const url = pb.files.getURL(remote, file, { token });
      const resp = await fetch(url);
      if (resp.ok) await putImage(ref, await resp.blob());
    } catch {
      // leave for retry on next sync
    }
  }
}
