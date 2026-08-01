<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		label,
		value,
		class: className
	}: { label: string; value: string; class?: string } = $props();
</script>

<span
	class={cn(
		'font-pixel inline-flex items-center gap-1 whitespace-nowrap border-2 border-border bg-card px-2.5 py-1.5 text-[11px] leading-none',
		className
	)}
>
	<span class="text-muted-foreground">[{label}:</span>
	<span class="text-foreground">{value}]</span>
</span>
