<script lang="ts">
  import { matchShop } from '../lib/catalog/match';
  let { initial, onpick, onclose }:
    { initial: string; onpick: (url: string) => void; onclose: () => void } = $props();

  const TOKEN = (import.meta as any).env?.VITE_LOGODEV_TOKEN ?? '';
  let q = $state(initial ?? '');

  function domains(query: string): string[] {
    // Real catalog domains give real logos; only guess a domain when nothing matches.
    const fromCatalog = matchShop(query, 4).map(e => e.domain);
    if (fromCatalog.length) return [...new Set(fromCatalog)].slice(0, 4);
    const slug = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return slug ? [`${slug}.com`] : [];
  }

  // candidate image URLs across several services for each guessed domain
  const candidates = $derived.by(() => {
    const out: string[] = [];
    for (const d of domains(q)) {
      if (TOKEN) out.push(`https://img.logo.dev/${d}?token=${TOKEN}&size=128&format=png`);
      out.push(`https://icon.horse/icon/${d}`);
      out.push(`https://icons.duckduckgo.com/ip3/${d}.ico`);
    }
    return out;
  });

  function hide(e: Event) {
    const btn = (e.currentTarget as HTMLElement).closest('.opt') as HTMLElement | null;
    if (btn) btn.style.display = 'none';
  }
  // hide failed loads AND tiny placeholders (blank / 1px icons from favicon services)
  function onImgLoad(e: Event) {
    const img = e.currentTarget as HTMLImageElement;
    if (img.naturalWidth && img.naturalWidth < 24) hide(e);
  }
</script>

<div class="picker">
  <div class="bar">
    <input bind:value={q} placeholder="Search a brand…" aria-label="Search logos" />
    <button class="close" onclick={onclose}>Cancel</button>
  </div>
  <p class="hint">Tap a logo to use it for this card.</p>
  <div class="grid">
    {#each candidates as url (url)}
      <button class="opt" onclick={() => onpick(url)}>
        <img src={url} alt="" loading="lazy" onerror={hide} onload={onImgLoad} />
      </button>
    {/each}
  </div>
</div>

<style>
  .picker{margin:8px 16px;background:#161618;border:1px solid #2a2a30;border-radius:12px;padding:12px}
  .bar{display:flex;gap:8px}
  .bar input{flex:1;padding:9px 11px;border-radius:9px;border:1px solid #2a2a30;background:#0e0e10;color:#eee}
  .close{background:none;border:none;color:#9a9aa6;cursor:pointer}
  .hint{color:#8a8a94;font-size:13px;margin:8px 2px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .opt{background:#fff;border:1px solid #2a2a30;border-radius:10px;aspect-ratio:1;display:flex;
    align-items:center;justify-content:center;cursor:pointer;padding:6px}
  .opt img{max-width:100%;max-height:100%;object-fit:contain}
</style>
