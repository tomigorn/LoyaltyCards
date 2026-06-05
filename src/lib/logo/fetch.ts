export interface LogoFetcher { fetchLogo(domain: string): Promise<Blob | null>; }

const TOKEN = (import.meta as any).env?.VITE_LOGODEV_TOKEN ?? '';

export function buildLogoUrl(domain: string, token: string = TOKEN): string | null {
  if (!token) return null;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128&format=png`;
}

// Negative cache: once a domain fails (404 / network / wrong domain), don't hammer
// logo.dev for it again — persisted in localStorage so it survives app launches.
const FAIL_KEY = 'logoFailedDomains';
function loadFailed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAIL_KEY) ?? '[]') as string[]); }
  catch { return new Set(); }
}
const failedDomains = loadFailed();
function markFailed(domain: string) {
  failedDomains.add(domain);
  try { localStorage.setItem(FAIL_KEY, JSON.stringify([...failedDomains])); } catch { /* ignore */ }
}
/** Forget all failed domains (so they'll be retried) — used when clearing the logo cache. */
export function clearFailedDomains() {
  failedDomains.clear();
  try { localStorage.removeItem(FAIL_KEY); } catch { /* ignore */ }
}

/** Fetch a logo by domain from logo.dev. On-demand only; failure is non-fatal. */
export const logoDevFetcher: LogoFetcher = {
  async fetchLogo(domain) {
    if (failedDomains.has(domain)) return null;
    const url = buildLogoUrl(domain);
    if (!url) return null;                       // no token → no network, don't blacklist
    try {
      const res = await fetch(url);
      if (!res.ok) { markFailed(domain); return null; }
      return await res.blob();
    } catch { markFailed(domain); return null; }
  },
};
