<script lang="ts">
  import BarcodeView from '../components/BarcodeView.svelte';
  import { getImage } from '../lib/db';
  import type { Card } from '../lib/types';
  let { card, onback, onedit }:
    { card: Card; onback: () => void; onedit: () => void } = $props();
  let showTip = $state(localStorage.getItem('brightnessTipSeen') !== '1');
  let wake: WakeLockSentinel | null = null;
  $effect(() => {
    navigator.wakeLock?.request('screen').then((w) => wake = w).catch(() => {});
    return () => wake?.release().catch(() => {});
  });
  function dismissTip() { showTip = false; localStorage.setItem('brightnessTipSeen', '1'); }

  // Card photos (front/back). The back often holds a signature strip, terms, a service
  // number or a second barcode — handy to glance at right at the till.
  let frontUrl = $state(''); let backUrl = $state('');
  let viewing = $state<'' | 'front' | 'back'>('');
  $effect(() => {
    let made: string[] = [];
    if (card.frontPhotoRef) getImage(card.frontPhotoRef).then(b => { if (b) { frontUrl = URL.createObjectURL(b); made.push(frontUrl); } });
    if (card.backPhotoRef) getImage(card.backPhotoRef).then(b => { if (b) { backUrl = URL.createObjectURL(b); made.push(backUrl); } });
    return () => { for (const u of made) URL.revokeObjectURL(u); };
  });
</script>
<div class="sheet" onclick={onback} role="button" tabindex="0"
     onkeydown={(e) => e.key === 'Escape' && onback()}>
  <div class="name">{card.storeName}</div>
  <BarcodeView value={card.barcodeValue} format={card.barcodeFormat} />
  <div class="num">{card.barcodeValue}</div>
  {#if showTip}
    <div class="tip" onclick={(e) => { e.stopPropagation(); dismissTip(); }} role="button" tabindex="0"
         onkeydown={() => {}}>Turn your screen brightness up for best scanning. (tap to dismiss)</div>
  {/if}
  {#if frontUrl || backUrl}
    <div class="photos" onclick={(e) => e.stopPropagation()} role="presentation">
      {#if frontUrl}<button class="photo-btn" onclick={() => viewing = 'front'}>Front of card</button>{/if}
      {#if backUrl}<button class="photo-btn" onclick={() => viewing = 'back'}>Back of card</button>{/if}
    </div>
  {/if}
  <button class="edit" onclick={(e) => { e.stopPropagation(); onedit(); }}>Edit</button>
</div>
{#if viewing}
  <div class="viewer" onclick={() => viewing = ''} role="button" tabindex="0"
       onkeydown={(e) => e.key === 'Escape' && (viewing = '')}>
    <img src={viewing === 'front' ? frontUrl : backUrl} alt="{viewing} of card" />
    <span class="hint">tap to close</span>
  </div>
{/if}
<style>
  .sheet{position:fixed;inset:0;background:#fff;color:#111;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:16px;padding:24px}
  .name{align-self:flex-start;font-weight:800;font-size:20px}
  .num{font-family:ui-monospace,monospace;letter-spacing:3px;font-size:18px}
  .tip{background:#fff3cd;color:#664d03;padding:10px 14px;border-radius:10px;font-size:14px;max-width:90vw}
  .photos{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
  .photo-btn{background:#f1f1f4;color:#222;border:1px solid #e0e0e6;border-radius:12px;
    padding:11px 16px;font-size:15px;font-weight:600;cursor:pointer}
  .edit{position:fixed;top:14px;right:14px;background:#eee;border:none;border-radius:10px;padding:8px 12px}
  .viewer{position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:14px;padding:16px;z-index:10}
  .viewer img{max-width:100%;max-height:82vh;object-fit:contain;border-radius:12px}
  .hint{color:#bbb;font-size:13px}
</style>
