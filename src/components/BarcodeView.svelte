<script lang="ts">
  import { renderToCanvas } from '../lib/barcode/render';
  import type { BarcodeFormat } from '../lib/types';
  let { value, format }: { value: string; format: BarcodeFormat } = $props();
  let canvas: HTMLCanvasElement;
  $effect(() => { try { renderToCanvas(canvas, format, value); } catch {} });
</script>
<canvas bind:this={canvas}></canvas>
<style>canvas{max-width:90vw;height:auto}</style>
