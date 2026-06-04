export interface LogoFetcher { fetchLogo(domain: string): Promise<Blob | null>; }

const TOKEN = (import.meta as any).env?.VITE_LOGODEV_TOKEN ?? '';

export function buildLogoUrl(domain: string, token: string = TOKEN): string | null {
  if (!token) return null;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128&format=png`;
}

/** Fetch a logo by domain from logo.dev. On-demand only; failure is non-fatal. */
export const logoDevFetcher: LogoFetcher = {
  async fetchLogo(domain) {
    const url = buildLogoUrl(domain);
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch { return null; }
  },
};
