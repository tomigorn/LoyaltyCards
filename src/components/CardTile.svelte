<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveLogoUrl } from '../lib/logo/resolve';
  import { getImage } from '../lib/db';
  import { generateTile } from '../lib/logo/tile';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let url = $state('');
  $effect(() => {
    resolveLogoUrl(card, {
      getImage, makeObjectUrl: URL.createObjectURL, generateTile,
    }).then(u => url = u);
  });
</script>
<button class="tile" style="background:{card.brandColor}" onclick={() => onopen(card)}>
  {#if url}<img src={url} alt={card.storeName} />{/if}
  <span>{card.storeName}</span>
</button>
<style>
  .tile{border:none;border-radius:14px;aspect-ratio:1.4;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:6px;color:#fff;cursor:pointer;padding:8px;overflow:hidden}
  img{max-width:70%;max-height:55%;object-fit:contain}
  span{font-size:13px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.4)}
</style>
