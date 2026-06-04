import { describe, it, expect } from 'vitest';
import { buildLogoUrl } from '../src/lib/logo/fetch';

describe('buildLogoUrl', () => {
  it('builds a logo.dev url with the domain and token', () => {
    const url = buildLogoUrl('migros.ch', 'pk_test123');
    expect(url).toContain('https://img.logo.dev/migros.ch');
    expect(url).toContain('token=pk_test123');
  });
  it('returns null when no token', () => {
    expect(buildLogoUrl('migros.ch', '')).toBeNull();
  });
});
