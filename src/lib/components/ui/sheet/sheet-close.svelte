<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: DialogPrimitive.CloseProps & { class?: string; children?: Snippet } = $props();
</script>

<DialogPrimitive.Close
	class={cn(
		'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none',
		className,
	)}
	{...rest}
>
	<span class="icon-[pixelarticons--close] h-4 w-4"></span>
	{@render children?.()}
</DialogPrimitive.Close>
