import { matchShop } from '../catalog/match';
import type { CatalogEntry } from '../types';

/**
 * Split OCR text into candidate query strings and run each through
 * matchShop, returning deduplicated top-5 suggestions.
 * Pure function — unit-tested, no Tesseract dependency.
 */
export function suggestShopsFromText(text: string): CatalogEntry[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const candidates = new Set<string>();

  for (const line of lines) {
    // Whole line (stripped to alpha only, length >= 3)
    const lineAlpha = line.replace(/[^a-zA-Z ]/g, '').trim();
    if (lineAlpha.length >= 3) candidates.add(lineAlpha);

    // Individual word tokens: alphabetic only, length >= 3
    const words = line.split(/\s+/).filter(w => /^[a-zA-Z]{3,}$/.test(w));
    for (const w of words) candidates.add(w);

    // Adjacent 2-word combos
    for (let i = 0; i < words.length - 1; i++) {
      candidates.add(`${words[i]} ${words[i + 1]}`);
    }
  }

  // Run each candidate through matchShop and dedupe by id
  const seen = new Set<string>();
  const results: CatalogEntry[] = [];

  for (const candidate of candidates) {
    const matches = matchShop(candidate, 3);
    for (const entry of matches) {
      if (!seen.has(entry.id)) {
        seen.add(entry.id);
        results.push(entry);
        if (results.length >= 5) return results;
      }
    }
  }

  return results;
}

/**
 * Use Tesseract.js (lazy-loaded) to OCR a Blob/File and return the raw text.
 * All assets are served from /tess/ for offline + CSP-clean operation.
 */
export async function recognizeText(blob: Blob): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    workerPath: '/tess/worker.min.js',
    corePath: '/tess/',
    langPath: '/tess/',
  });
  try {
    const { data } = await worker.recognize(blob);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
