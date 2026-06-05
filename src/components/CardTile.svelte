<script lang="ts">
  import type { Card } from '../lib/types';
  import { resolveCardLogo, resolveCardColor } from '../lib/logo/resolveCard';
  import { getImage } from '../lib/db';
  let { card, onopen }: { card: Card; onopen: (c: Card) => void } = $props();
  let logoUrl = $state('');
  let photoUrl = $state('');     // front card photo → shown AS the tile (Stocard-style)
  let bg = $state('#2a2a30');
  $effect(() => {
    let madeLogo = '', madePhoto = '';
    resolveCardColor(card).then(c => { bg = c; });
    resolveCardLogo(card).then(u => {
      logoUrl = u; madeLogo = u;
      resolveCardColor(card).then(c => { bg = c; });
    });
    if (card.frontPhotoRef) {
      getImage(card.frontPhotoRef).then(b => { if (b) { photoUrl = URL.createObjectURL(b); madePhoto = photoUrl; } });
    } else {
      photoUrl = '';
    }
    return () => {
      for (const m of [madeLogo, madePhoto]) if (m.startsWith('blob:')) URL.revokeObjectURL(m);
    };
  });
  const isTile = $derived(logoUrl.startsWith('data:')); // generated tile → no white chip
  // a plain div (not a <button>): native buttons swallow touch-drags, so dragging the
  // background wouldn't start a reorder — only a child element would.
  function open() { onopen(card); }
  function onkey(e: KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }
</script>

{#if photoUrl}
  <div class="tile photo" role="button" tabindex="0" onclick={open} onkeydown={onkey}>
    <img class="cardimg" src={photoUrl} alt={card.storeName} draggable="false" />
    <span class="nm over">{card.storeName}</span>
  </div>
{:else}
  <div class="tile" role="button" tabindex="0" style="background:{bg}" onclick={open} onkeydown={onkey}>
    {#if logoUrl && !isTile}
      <span class="chip"><img src={logoUrl} alt={card.storeName} draggable="false" /></span>
    {/if}
    <span class="nm">{card.storeName}</span>
  </div>
{/if}

<style>
  .tile{position:relative;width:100%;border:none;border-radius:14px;aspect-ratio:1.4;display:flex;
    flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#fff;cursor:pointer;
    padding:8px;overflow:hidden;user-select:none;-webkit-tap-highlight-color:transparent}
  /* logos/photos must not behave like draggable/long-pressable images (no browser image
     menu, and the whole TILE stays the tap/drag target, not the image) */
  .tile img{pointer-events:none;user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none}
  .chip{background:#fff;border-radius:9px;padding:6px;display:flex;align-items:center;justify-content:center}
  .chip img{width:42px;height:42px;object-fit:contain;display:block}
  .nm{font-size:13px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.35)}
  /* photo tile: the card image fills the tile, name overlaid on a gradient scrim */
  .tile.photo{padding:0}
  .cardimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .nm.over{position:absolute;left:0;right:0;bottom:0;padding:14px 8px 7px;
    background:linear-gradient(transparent,rgba(0,0,0,.6));font-size:13px}
</style>
