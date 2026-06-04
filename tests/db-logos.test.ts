// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { getLogo, putLogo, getLogoColor, putLogoColor, clearLogoCache, resetDB } from '../src/lib/db';

describe('logo cache', () => {
  beforeEach(async () => { await resetDB(); await clearLogoCache(); });
  it('stores and reads a logo blob by domain', async () => {
    await putLogo('migros.ch', new Blob(['PNG'], { type: 'image/png' }));
    expect((await getLogo('migros.ch'))?.size).toBe(3);
  });
  it('stores and reads a logo colour by domain', async () => {
    await putLogoColor('migros.ch', '#FF6600');
    expect(await getLogoColor('migros.ch')).toBe('#FF6600');
  });
  it('clearLogoCache empties logos and colours', async () => {
    await putLogo('a.com', new Blob(['x'])); await putLogoColor('a.com', '#111');
    await clearLogoCache();
    expect(await getLogo('a.com')).toBeUndefined();
    expect(await getLogoColor('a.com')).toBeUndefined();
  });
});
