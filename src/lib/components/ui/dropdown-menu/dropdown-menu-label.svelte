<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let { class: className, children, ...rest }: { class?: string; children?: Snippet } = $props();
</script>

<div class={cn('px-2 py-1.5 text-sm font-semibold', className)} {...rest}>
	{@render children?.()}
</div>
