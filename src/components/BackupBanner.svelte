<script lang="ts">
  import { isLoggedIn } from '../lib/auth/store';
  let { onsettings }: { onsettings: () => void } = $props();
  let dismissed = $state(localStorage.getItem('backupBannerDismissed') === '1');
  function dismiss() { dismissed = true; localStorage.setItem('backupBannerDismissed', '1'); }
</script>

{#if !$isLoggedIn && !dismissed}
  <div class="banner">
    <span class="txt">Your cards aren't backed up — they're only on this device.</span>
    <button class="act" onclick={onsettings}>Log in</button>
    <button class="x" aria-label="Dismiss" onclick={dismiss}>✕</button>
  </div>
{/if}

<style>
  .banner{display:flex;align-items:center;gap:8px;margin:0 16px 12px;padding:10px 12px;border-radius:10px;
    background:#2a230f;border:1px solid #5a4a17;color:#e8d9a8;font-size:13px}
  .txt{flex:1}
  .act{background:#2a6df4;border:none;color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer}
  .x{background:none;border:none;color:#c8b888;font-size:14px;cursor:pointer;padding:2px 4px}
</style>
