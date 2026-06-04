export interface LogoFetcher { fetchLogo(domain: string): Promise<Blob | null>; }

const TOKEN = (import.meta as any).env?.VITE_LOGODEV_TOKEN ?? '';

export function buildLogoUrl(domain: string, token: string = TOKEN): string | null {
  if (!token) return null;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128&format=png`;
}

// Session-scoped negative cache: once a domain fails (404 / network / wrong domain),
// don't hammer logo.dev for it again on every grid render. Cleared on reload.
const failedDomains = new Set<string>();

/** Fetch a logo by domain from logo.dev. On-demand only; failure is non-fatal. */
export const logoDevFetcher: LogoFetcher = {
  async fetchLogo(domain) {
    if (failedDomains.has(domain)) return null;
    const url = buildLogoUrl(domain);
    if (!url) return null;                       // no token → no network, don't blacklist
    try {
      const res = await fetch(url);
      if (!res.ok) { failedDomains.add(domain); return null; }
      return await res.blob();
    } catch { failedDomains.add(domain); return null; }
  },
};
