<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import PoolRow from '$lib/components/PoolRow.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';
	import { poolColumnCount, virtualRowCount, virtualRowKey, VIRTUAL_POOL_ROW_HEIGHT, VIRTUAL_POOL_THRESHOLD } from '$lib/utils/poolPerformance';

	type ActionVariant = 'outline' | 'secondary' | 'destructive';
	let {
		items,
		active = true,
		testid,
		checked,
		onToggle,
		actionLabel,
		actionVariant,
		onAction,
		emptyLabel = m.pool_empty(),
		maxHeight = '40svh'
	}: {
		items: ItemData[];
		active?: boolean;
		testid: string;
		checked: (id: string) => boolean;
		onToggle: (id: string) => void;
		actionLabel: (item: ItemData) => string;
		actionVariant: (item: ItemData) => ActionVariant;
		onAction: (item: ItemData) => void;
		emptyLabel?: string;
		maxHeight?: string;
	} = $props();

	let scrollElement = $state<HTMLDivElement | null>(null);
	let columns = $state(1);
	const virtual = $derived(items.length > VIRTUAL_POOL_THRESHOLD);
	const rowCount = $derived(virtualRowCount(items.length, columns));

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		getScrollElement: () => scrollElement,
		estimateSize: () => VIRTUAL_POOL_ROW_HEIGHT,
		overscan: 3,
		enabled: false
	});

	$effect(() => {
		const instance = untrack(() => $virtualizer);
		instance.setOptions({
			count: rowCount,
			getScrollElement: () => scrollElement,
			estimateSize: () => VIRTUAL_POOL_ROW_HEIGHT,
			overscan: 3,
			enabled: active && virtual,
			getItemKey: (row) => virtualRowKey(items, row, columns)
		});
	});

	onMount(() => {
		const media = matchMedia('(min-width: 640px)');
		const update = () => {
			const oldColumns = columns;
			const firstRow = $virtualizer.getVirtualItems()[0]?.index ?? 0;
			const anchorId = items[firstRow * oldColumns]?.id;
			columns = poolColumnCount(media.matches ? 640 : 0);
			if (anchorId && oldColumns !== columns) {
				requestAnimationFrame(() => {
					const nextIndex = items.findIndex((item) => item.id === anchorId);
					if (nextIndex >= 0) $virtualizer.scrollToIndex(Math.floor(nextIndex / columns), { align: 'start' });
				});
			}
		};
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	});

	const renderedCount = $derived(
		!active ? 0 : virtual ? Math.min(items.length, $virtualizer.getVirtualItems().length * columns) : items.length
	);
</script>

<div class="border-t border-border/50 px-2 py-0.5 text-right font-pixel text-[8px] text-muted-foreground" data-testid={`${testid}-render-count`}>
	{m.pool_rendered_count({ rendered: renderedCount, total: items.length })}
</div>

{#if items.length === 0}
	<p class="font-pixel py-5 text-center text-[10px] text-muted-foreground">{emptyLabel}</p>
{:else if !active}
	<!-- Hidden tab: keep component state, but do not retain row/image DOM. -->
{:else if !virtual}
	<div bind:this={scrollElement} class="grid min-w-0 grid-cols-1 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-2" style:max-height={maxHeight} data-testid={`${testid}-list`}>
		{#each items as item (item.id)}
			<PoolRow {item} {testid} checked={checked(item.id)} onToggle={() => onToggle(item.id)} actionVariant={actionVariant(item)} actionLabel={actionLabel(item)} onAction={() => onAction(item)} />
		{/each}
	</div>
{:else}
	<div bind:this={scrollElement} class="min-w-0 overflow-y-auto p-1.5" style:height={`min(${maxHeight}, ${Math.max(VIRTUAL_POOL_ROW_HEIGHT, $virtualizer.getTotalSize())}px)`} data-testid={`${testid}-list`}>
		<div class="relative w-full" style:height={`${$virtualizer.getTotalSize()}px`}>
			{#each $virtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
				<div class="absolute left-0 top-0 grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2" style:height={`${virtualRow.size}px`} style:transform={`translateY(${virtualRow.start}px)`} data-index={virtualRow.index}>
					{#each items.slice(virtualRow.index * columns, virtualRow.index * columns + columns) as item (item.id)}
						<PoolRow {item} {testid} checked={checked(item.id)} onToggle={() => onToggle(item.id)} actionVariant={actionVariant(item)} actionLabel={actionLabel(item)} onAction={() => onAction(item)} />
					{/each}
				</div>
			{/each}
		</div>
	</div>
{/if}
