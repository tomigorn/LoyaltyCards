<script lang="ts">
  import { putImage, getImage } from '../lib/db';
  let { label, value = $bindable() }: { label: string; value: string | undefined } = $props();
  let url = $state('');
  $effect(() => {
    let createdUrl: string | null = null;
    if (value) {
      getImage(value).then(b => {
        if (b) { createdUrl = URL.createObjectURL(b); url = createdUrl; }
      });
    }
    return () => { if (createdUrl && createdUrl.startsWith('blob:')) URL.revokeObjectURL(createdUrl); };
  });
  async function onPick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const key = crypto.randomUUID();
    await putImage(key, file); value = key;
    const newUrl = URL.createObjectURL(file);
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    url = newUrl;
  }
</script>
<label>{label}
  <input type="file" accept="image/*" capture="environment" onchange={onPick} />
</label>
{#if url}<img src={url} alt={label} />{/if}
<style>img{max-width:100%;border-radius:10px;margin:6px 16px}label{display:block;margin:10px 16px}</style>
