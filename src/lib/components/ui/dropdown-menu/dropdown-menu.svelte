<script lang="ts" module>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
	export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
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
		...rest
	}: DropdownMenuPrimitive.RootProps & {
		class?: string;
		contentClass?: string;
		children?: Snippet;
		content?: Snippet;
	} = $props();
</script>

<DropdownMenuPrimitive.Root {open} {onOpenChange} {...rest}>
	{@render children?.()}
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Content
			class={cn(
				'z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				contentClass
			)}
		>
			{@render content?.()}
		</DropdownMenuPrimitive.Content>
	</DropdownMenuPrimitive.Portal>
</DropdownMenuPrimitive.Root>
