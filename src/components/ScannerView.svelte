<script lang="ts">
  import { startScan, type ScanResult } from '../lib/barcode/scan';
  let { onresult }: { onresult: (r: ScanResult) => void } = $props();
  let video: HTMLVideoElement;
  let stop: (() => void) | null = null;
  let error = $state('');
  $effect(() => {
    startScan(video, (r) => { onresult(r); }).then(s => stop = s)
      .catch(() => error = 'Camera unavailable — use manual entry.');
    return () => stop?.();
  });
</script>
{#if error}<p class="err">{error}</p>{/if}
<!-- svelte-ignore a11y_media_has_caption -->
<video bind:this={video} playsinline></video>
<style>video{width:100%;border-radius:12px;background:#000}.err{color:#f88}</style>
