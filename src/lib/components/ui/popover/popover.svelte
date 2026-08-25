<script lang="ts" module>
	import { Popover as PopoverPrimitive } from 'bits-ui';
	export const PopoverTrigger = PopoverPrimitive.Trigger;
	export const PopoverClose = PopoverPrimitive.Close;
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(),
		onOpenChange,
		class: className,
		contentClass,
		children,
		content,
		arrow = false,
		...rest
	}: PopoverPrimitive.RootProps & {
		class?: string;
		contentClass?: string;
		children?: Snippet;
		content?: Snippet;
		arrow?: boolean;
	} = $props();
</script>

<PopoverPrimitive.Root {open} {onOpenChange} {...rest}>
	{@render children?.()}
	<PopoverPrimitive.Content
		class={cn(
			'z-50 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			contentClass,
		)}
	>
		{@render content?.()}
		{#if arrow}
			<PopoverPrimitive.Arrow class="fill-popover" />
		{/if}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Root>
