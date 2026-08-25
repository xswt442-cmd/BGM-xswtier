<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { ItemData } from '$lib/schemas/item';
	import ItemCard from './ItemCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { cleanFinalizedItems } from '$lib/utils/dndItems';
	import { tierData } from '$lib/states/tierData.svelte';

	let { items = $bindable([]), onLoadMore }: { items: ItemData[]; onLoadMore?: () => void } = $props();

	const flipDurationMs = 300;
	// svelte-dnd-action 跨容器拖拽：consider/finalize 都直接用原始 items
	// （含 shadow 占位符，渲染时处理，持久化时过滤）
	function handleDndConsider(e: CustomEvent) {
		tierData.beginHistory('move_item');
		items = e.detail.items;
	}
	function handleDndFinalize(e: CustomEvent) {
		items = cleanFinalizedItems(e.detail.items);
		tierData.scheduleHistoryCommit();
	}
</script>

<section class="flex h-full flex-col">
	<div class="flex items-center justify-between px-3 pb-2 pr-14 pt-3 xl:pr-3">
		<h2 class="font-pixel text-[10px] text-foreground">{m.unranked()}</h2>
		{#if itemLoader.total > 0}
			<span class="font-pixel text-[9px] text-muted-foreground">
				{m.loading_progress({ loaded: itemLoader.loadedCount, total: itemLoader.total })}
			</span>
		{/if}
	</div>
	<div class="bg-dotted relative flex-1 overflow-y-auto">
		{#if items.length === 0 && !itemLoader.isLoading}
			<p
				class="font-pixel pointer-events-none absolute inset-x-0 top-0 p-6 text-center text-[10px] text-muted-foreground"
			>
				{m.EMPTY()}
			</p>
		{/if}
		<section
			use:dndzone={{ items, flipDurationMs, useCursorForDetection: true, delayTouchStart: true }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
			aria-label={m.unranked()}
			data-testid="unranked-zone"
			class="flex min-h-full flex-wrap content-start gap-2 p-3"
		>
			{#each items as item (item.id)}
				<div
					animate:flip={{ duration: flipDurationMs }}
					data-is-dnd-shadow-item-hint={item.isDndShadowItem}
					data-item-id={item.id}
					aria-label={item.name_cn || item.name || ''}
				>
					<ItemCard {item} titleMode="two-line" />
				</div>
			{/each}
		</section>
	</div>
	{#if !itemLoader.isDone}
		<div class="p-3 pt-1">
			<Button class="w-full" variant="outline" onclick={onLoadMore} disabled={itemLoader.isLoading}>
				{itemLoader.isLoading ? m.LOADING() : m.load_more()}
			</Button>
		</div>
	{/if}
	{#if itemLoader.failedCount > 0}
		<div class="grid gap-1 p-3 pt-1">
			<p class="font-pixel text-[9px] text-destructive" role="alert">
				{m.load_failed_count({ count: itemLoader.failedCount })}
			</p>
			<Button class="w-full" variant="outline" onclick={() => itemLoader.retryFailed()} disabled={itemLoader.isLoading}>
				{m.me_retry()}
			</Button>
		</div>
	{/if}
</section>
