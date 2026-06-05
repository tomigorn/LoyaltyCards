<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveCardLogo } from '../lib/logo/resolveCard';
  import { getLogoColor } from '../lib/db';
  import { findCatalogById } from '../lib/catalog/catalog';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let url = $state('');
  let extractedColor = $state<string | undefined>(undefined);
  const bg = $derived(card.brandColor || extractedColor || '#2a2a30');
  $effect(() => {
    let made = '';
    resolveCardLogo(card).then(u => { url = u; made = u; });
    // resolve tile background colour: brandColor wins, else extracted colour for the shop
    if (!card.brandColor && card.catalogId) {
      const dom = findCatalogById(card.catalogId)?.domain;
      if (dom) getLogoColor(dom).then(c => { if (c) extractedColor = c; });
    }
    return () => { if (made.startsWith('blob:')) URL.revokeObjectURL(made); };
  });
  const isTile = $derived(url.startsWith('data:')); // generated tile → no white chip
</script>
<button class="tile" style="background:{bg}" onclick={() => onopen(card)}>
  {#if url && !isTile}
    <span class="chip"><img src={url} alt={card.storeName} /></span>
  {/if}
  <span class="nm">{card.storeName}</span>
</button>
<style>
  .tile{width:100%;border:none;border-radius:14px;aspect-ratio:1.4;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:7px;color:#fff;cursor:pointer;padding:8px;overflow:hidden}
  .chip{background:#fff;border-radius:9px;padding:6px;display:flex;align-items:center;justify-content:center}
  .chip img{width:42px;height:42px;object-fit:contain;display:block}
  .nm{font-size:13px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.35)}
</style>
