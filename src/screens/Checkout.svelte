<script lang="ts">
  import type { Card } from '../lib/types';
  let { card, onback, onedit }: { card: Card; onback: () => void; onedit: () => void } = $props();
</script>
<p>Checkout — coming soon</p><button onclick={onback}>Back</button>
