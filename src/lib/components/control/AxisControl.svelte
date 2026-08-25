<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import StatusChip from './StatusChip.svelte';

	// 三轴控制（COLOR/VFX/UIFB）共用模板：状态徽章触发 Popover，网格按钮选值。
	let {
		chipLabel,
		iconClass,
		heading,
		options,
		current,
		onSelect,
	}: {
		chipLabel: string;
		iconClass: string;
		heading: string;
		options: { value: string; badge: string; label: () => string }[];
		current: string;
		onSelect: (value: string) => void;
	} = $props();

	const chipValue = $derived(options.find((o) => o.value === current)?.badge ?? '');
</script>

<Popover>
	<PopoverTrigger class="min-h-11 rounded-sm transition-opacity hover:opacity-80 sm:min-h-0">
		<StatusChip label={chipLabel} value={chipValue} {iconClass} />
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-xs font-semibold">{heading}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each options as option (option.value)}
					<Button
						variant={current === option.value ? 'default' : 'outline'}
						size="sm"
						onclick={() => onSelect(option.value)}
					>
						{option.label()}
					</Button>
				{/each}
			</div>
		</div>
	{/snippet}
</Popover>
