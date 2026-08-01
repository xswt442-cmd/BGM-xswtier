<script lang="ts">
	import { Label as LabelPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: LabelPrimitive.RootProps & { class?: string; children?: Snippet } = $props();
</script>

<LabelPrimitive.Root
	class={cn(
		'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className
	)}
	{...rest}
>
	{@render children?.()}
</LabelPrimitive.Root>
