<script lang="ts">
  import BarcodeView from '../components/BarcodeView.svelte';
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
</script>
<div class="sheet" onclick={onback} role="button" tabindex="0"
     onkeydown={(e) => e.key === 'Escape' && onback()}>
  <div class="name">{card.storeName}</div>
  <BarcodeView value={card.barcodeValue} format={card.barcodeFormat} />
  <div class="num">{card.barcodeValue}</div>
  {#if showTip}
    <div class="tip" onclick={(e) => { e.stopPropagation(); dismissTip(); }} role="button" tabindex="0"
         onkeydown={() => {}}>☀️ Turn your screen brightness up for best scanning. (tap to dismiss)</div>
  {/if}
  <button class="edit" onclick={(e) => { e.stopPropagation(); onedit(); }}>Edit</button>
</div>
<style>
  .sheet{position:fixed;inset:0;background:#fff;color:#111;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:16px;padding:24px}
  .name{align-self:flex-start;font-weight:800;font-size:20px}
  .num{font-family:ui-monospace,monospace;letter-spacing:3px;font-size:18px}
  .tip{background:#fff3cd;color:#664d03;padding:10px 14px;border-radius:10px;font-size:14px;max-width:90vw}
  .edit{position:fixed;top:14px;right:14px;background:#eee;border:none;border-radius:10px;padding:8px 12px}
</style>
