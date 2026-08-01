<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: DropdownMenuPrimitive.ItemProps & { class?: string; children?: Snippet } = $props();
</script>

<DropdownMenuPrimitive.Item
	class={cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	{...rest}
>
	{@render children?.()}
</DropdownMenuPrimitive.Item>
