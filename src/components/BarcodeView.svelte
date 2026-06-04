<script lang="ts">
  import { renderToCanvas } from '../lib/barcode/render';
  import type { BarcodeFormat } from '../lib/types';
  let { value, format }: { value: string; format: BarcodeFormat } = $props();
  let canvas: HTMLCanvasElement;
  let failed = $state(false);
  $effect(() => {
    failed = false;
    try { renderToCanvas(canvas, format, value); }
    catch { failed = true; }
  });
</script>
{#if !failed}<canvas bind:this={canvas}></canvas>{/if}
{#if failed}<p class="err">Couldn't render barcode — use the number below.</p>{/if}
<style>
  canvas{max-width:90vw;height:auto}
  .err{color:#f88;font-size:14px;margin:8px 0;text-align:center}
</style>
