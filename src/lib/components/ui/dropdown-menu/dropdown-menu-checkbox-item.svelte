<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		checked = $bindable(false),
		...rest
	}: DropdownMenuPrimitive.CheckboxItemProps & { class?: string; children?: Snippet } = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
	class={cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className,
	)}
	{checked}
	{...rest}
>
	<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
		{#if checked}
			<span class="icon-[pixelarticons--check] h-4 w-4"></span>
		{/if}
	</span>
	{@render children?.()}
</DropdownMenuPrimitive.CheckboxItem>
