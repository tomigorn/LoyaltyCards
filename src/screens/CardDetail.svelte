<script lang="ts">
  import type { Card } from '../lib/types';
  let { card, ondone }: { card: Card; ondone: () => void } = $props();
</script>
<p>Detail — coming soon</p><button onclick={ondone}>Done</button>
