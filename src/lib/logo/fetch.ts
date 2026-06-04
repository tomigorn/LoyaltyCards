export interface LogoFetcher { fetchLogo(storeName: string): Promise<Blob | null>; }

/** Guess a domain from the store name and pull a logo. On-demand only. */
export const clearbitFetcher: LogoFetcher = {
  async fetchLogo(storeName) {
    const domain = storeName.trim().toLowerCase().replace(/\s+/g, '') + '.com';
    try {
      const res = await fetch(`https://logo.clearbit.com/${domain}?size=256`);
      if (!res.ok) return null;
      return await res.blob();
    } catch { return null; }
  },
};
