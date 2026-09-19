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

	import type { Snippet } from 'svelte';

	let {
		items = $bindable([]),
		onLoadMore,
		selection,
		selectMode = $bindable(false),
		bulkActions,
	}: {
		items: ItemData[];
		onLoadMore?: () => void;
		selection?: { has: (id: string) => boolean; toggle: (id: string) => void; clear: () => void; size: number };
		selectMode?: boolean;
		/** 多选工具条右侧的批量动作（由调用方注入，如"移入档位"） */
		bulkActions?: Snippet;
	} = $props();

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
		{#if selection}
			<Button
				variant={selectMode ? 'default' : 'outline'}
				size="sm"
				class="font-pixel h-6 px-2 text-[8px]"
				data-export-exclude
				data-testid="toggle-select-mode"
				onclick={() => {
					selectMode = !selectMode;
					selection.clear();
				}}
				disabled={items.length === 0 && !selectMode}
			>
				{selectMode ? m.select_mode_exit() : m.select_mode_enter()}
			</Button>
		{/if}
	</div>
	{#if selectMode && selection}
		<div
			class="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-1"
			data-export-exclude
			data-testid="bulk-select-bar"
		>
			<span class="font-pixel mr-auto text-[9px] text-muted-foreground"
				>{m.pool_selected_count({ count: selection.size })}</span
			>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-6 px-2 text-[8px]"
				onclick={() => selection.clear()}
				disabled={selection.size === 0}>{m.pool_clear_selection()}</Button
			>
			{@render bulkActions?.()}
		</div>
	{/if}
	<div class="bg-dotted relative flex-1 overflow-y-auto">
		{#if items.length === 0 && !itemLoader.isLoading}
			<p
				class="font-pixel pointer-events-none absolute inset-x-0 top-0 p-6 text-center text-[10px] text-muted-foreground"
			>
				{m.EMPTY()}
			</p>
		{/if}
		<section
			use:dndzone={{
				items,
				flipDurationMs,
				useCursorForDetection: true,
				delayTouchStart: true,
				dragDisabled: selectMode, // 多选态下禁用拖拽：点击用于勾选，避免与 dnd 抢手势
			}}
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
					class="relative"
				>
					{#if selectMode && selection}
						<!-- 勾选层：整卡可点，覆盖在卡上，避免与卡片内部的 bgm.tv 外链冲突 -->
						<button
							type="button"
							class="absolute inset-0 z-20 cursor-pointer rounded-lg ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {selection.has(
								item.id,
							)
								? 'ring-2 ring-primary'
								: ''}"
							data-export-exclude
							data-testid="select-item"
							aria-pressed={selection.has(item.id)}
							aria-label={item.name_cn || item.name || ''}
							onclick={() => selection?.toggle(item.id)}
						></button>
					{/if}
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
