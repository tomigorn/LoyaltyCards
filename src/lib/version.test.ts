import { describe, it, expect } from 'vitest';
import { APP_VERSION } from './version';

describe('APP_VERSION', () => {
  it('is injected at build time as a semver string', () => {
    // If the Vite `define` ever breaks, this would be `undefined` / unreplaced.
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
