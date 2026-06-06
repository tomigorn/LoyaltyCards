<script lang="ts">
  import { getImage, deleteImage } from '../lib/db';
  import { storeImage } from '../lib/image';
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
    const oldKey = value;
    const key = await storeImage(file);
    if (oldKey) await deleteImage(oldKey);
    value = key;
    const newUrl = URL.createObjectURL(await getImage(key) ?? file);
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    url = newUrl;
  }
</script>
<div class="field">
  <span class="lbl">{label}</span>
  {#if url}<img class="preview" src={url} alt={label} />{/if}
  <label class="btn">
    {url ? 'Replace photo' : `Add ${label.toLowerCase()}`}
    <input type="file" accept="image/*" capture="environment" onchange={onPick} hidden />
  </label>
</div>
<style>
  .field{margin:0 16px}
  .lbl{display:block;color:#9a9aa6;font-size:13px;margin:0 2px 6px}
  .preview{display:block;width:100%;border-radius:12px;margin-bottom:8px;border:1px solid #2a2a30}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;
    border-radius:12px;border:1px solid #33333a;background:#1a1a20;color:#e6e6ec;font-size:15px;
    cursor:pointer;-webkit-tap-highlight-color:transparent}
  .btn:active{background:#23232b}
</style>
