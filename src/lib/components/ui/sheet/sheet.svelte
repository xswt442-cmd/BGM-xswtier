<script lang="ts" module>
	import { Dialog as DialogPrimitive } from 'bits-ui';
	export const SheetTrigger = DialogPrimitive.Trigger;
	export const SheetPortal = DialogPrimitive.Portal;
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
		side = 'right',
		...rest
	}: DialogPrimitive.RootProps & {
		class?: string;
		contentClass?: string;
		children?: Snippet;
		content?: Snippet;
		side?: 'top' | 'bottom' | 'left' | 'right';
	} = $props();

	const sides: Record<string, string> = {
		top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
		bottom:
			'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
		left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
		right:
			'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
	};
</script>

<DialogPrimitive.Root {open} {onOpenChange} {...rest}>
	{@render children?.()}
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/60" />
		<DialogPrimitive.Content
			class={cn(
				'fixed z-50 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
				sides[side],
				contentClass,
			)}
		>
			{@render content?.()}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
