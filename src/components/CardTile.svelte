<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveLogoUrl } from '../lib/logo/resolve';
  import { getImage, getLogo, putLogo, putLogoColor } from '../lib/db';
  import { generateTile } from '../lib/logo/tile';
  import { logoDevFetcher } from '../lib/logo/fetch';
  import { extractDominantColor } from '../lib/logo/color';
  import { findCatalogById } from '../lib/catalog/catalog';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let url = $state('');

  $effect(() => {
    let createdUrl: string | null = null;
    resolveLogoUrl(card, {
      getImage,
      getLogo,
      putLogo,
      putLogoColor,
      makeObjectUrl: (blob) => { createdUrl = URL.createObjectURL(blob); return createdUrl; },
      generateTile,
      fetchLogo: (d) => logoDevFetcher.fetchLogo(d),
      extractColor: extractDominantColor,
      autoFetchEnabled: () => true,
      domainFor: (id) => findCatalogById(id)?.domain,
    }).then(u => url = u);
    return () => { if (createdUrl && createdUrl.startsWith('blob:')) URL.revokeObjectURL(createdUrl); };
  });
</script>
<button class="tile" style="background:{card.brandColor}" onclick={() => onopen(card)}>
  {#if url}
    <img src={url} alt={card.storeName} />
  {/if}
  <span>{card.storeName}</span>
</button>
<style>
  .tile{border:none;border-radius:14px;aspect-ratio:1.4;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:6px;color:#fff;cursor:pointer;padding:8px;overflow:hidden}
  img{max-width:70%;max-height:55%;object-fit:contain}
  span{font-size:13px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.4)}
</style>
