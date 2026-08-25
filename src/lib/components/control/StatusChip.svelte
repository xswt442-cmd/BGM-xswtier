<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		label,
		value,
		iconClass,
		class: className,
	}: { label: string; value: string; iconClass?: string; class?: string } = $props();
</script>

<span
	class={cn(
		'font-pixel inline-flex items-center gap-1 whitespace-nowrap border-2 border-border bg-card px-2 py-1.5 text-[10px] leading-none sm:px-2.5 sm:text-[11px]',
		className,
	)}
>
	{#if iconClass}<span class={cn(iconClass, 'h-3.5 w-3.5 shrink-0 text-accent')}></span>{/if}
	<span class="text-muted-foreground">[{label}:</span>
	<span class="text-foreground">{value}]</span>
</span>
