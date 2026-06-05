<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveCardLogo, resolveCardColor } from '../lib/logo/resolveCard';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let url = $state('');
  let bg = $state('#2a2a30');
  $effect(() => {
    let made = '';
    resolveCardColor(card).then(c => { bg = c; });          // program colour / cached
    resolveCardLogo(card).then(u => {
      url = u; made = u;
      resolveCardColor(card).then(c => { bg = c; });         // re-resolve once a fetched logo's colour is cached
    });
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
