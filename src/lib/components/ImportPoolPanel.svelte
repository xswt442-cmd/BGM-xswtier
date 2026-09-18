<script lang="ts">
	import VirtualPoolList from '$lib/components/VirtualPoolList.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { importPool } from '$lib/states/importPool.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';
	import {
		filterItemsByQuery,
		selectAllMutable,
		toggleMutableSelection,
	} from '$lib/utils/poolPerformance';

	let { active = true }: { active?: boolean } = $props();
	const selection = new SvelteSet<string>();
	let isLoadingAll = $state(false);
	let selectionSource = $state<string | null>(null);
	let query = $state('');
	const isBusy = $derived(isLoadingAll || itemLoader.isLoading);
	const isAdded = (id: string) => searchPool.has(id);
	/** 仅用于渲染；selection 按全量维护，筛选不误清已选项 */
	const visible = $derived(filterItemsByQuery(importPool.items, query));
	const filtering = $derived(query.trim().length > 0);
	$effect(() => {
		const next = importPool.source ? `${importPool.source.kind}:${importPool.source.label}` : null;
		if (selectionSource !== next) {
			selectionSource = next;
			selection.clear();
		}
	});

	async function loadAllRemaining() {
		while (!itemLoader.isDone) await itemLoader.loadBatch();
	}

	async function addAllToRanking() {
		if (isBusy) return;
		isLoadingAll = true;
		try {
			await loadAllRemaining();
			searchPool.addAll(importPool.items);
			selection.clear();
		} finally {
			isLoadingAll = false;
		}
	}

	async function selectAll() {
		if (isBusy) return;
		isLoadingAll = true;
		try {
			await loadAllRemaining();
			// 筛选态下"全选"只选中当前可见结果，符合所见即所得
			selectAllMutable(selection, filtering ? visible : importPool.items);
		} finally {
			isLoadingAll = false;
		}
	}

	function toggle(id: string) {
		toggleMutableSelection(selection, id);
	}

	function addSelected() {
		searchPool.addAll(importPool.items.filter((item) => selection.has(item.id)));
		selection.clear();
	}

	function addItem(item: ItemData) {
		if (!isBusy && !isAdded(item.id)) searchPool.add(item);
	}
</script>

<section class="flex min-w-0 flex-col border-2 border-border bg-card/60" data-testid="import-pool-panel">
	<div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
		<div class="flex min-w-0 items-center gap-2">
			<span class="font-pixel text-[10px]">{m.import_pool_title()}</span>
			{#if importPool.source}
				<span class="truncate text-[10px] text-muted-foreground" title={importPool.source.label}
					>{importPool.source.label}</span
				>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<span class="font-pixel text-[9px] text-muted-foreground"
				>{m.loading_progress({ loaded: itemLoader.loadedCount, total: itemLoader.total })}</span
			>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-5 px-2 text-[9px]"
				onclick={addAllToRanking}
				disabled={importPool.items.length === 0 || isBusy}
			>
				{isLoadingAll ? m.pool_adding_all() : m.pool_add_all()}
			</Button>
		</div>
	</div>
	{#if importPool.items.length > 0}
		<div class="flex items-center gap-1.5 border-b-2 border-border px-2 py-1">
			<Input
				class="font-pixel h-7 min-w-0 flex-1 text-[9px]"
				placeholder={m.pool_filter_placeholder()}
				bind:value={query}
				data-testid="import-filter-input"
				aria-label={m.pool_filter_placeholder()}
			/>
			{#if filtering}
				<span class="font-pixel shrink-0 text-[9px] text-muted-foreground"
					>{m.pool_filtered_count({ shown: visible.length, total: importPool.items.length })}</span
				>
				<Button
					variant="ghost"
					size="sm"
					class="font-pixel h-7 shrink-0 px-2 text-[8px]"
					onclick={() => (query = '')}>{m.pool_filter_clear()}</Button
				>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
			<span class="font-pixel mr-auto text-[9px] text-muted-foreground"
				>{m.pool_selected_count({ count: selection.size })}</span
			>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={selectAll} disabled={isBusy}
				>{m.pool_select_all()}</Button
			>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-7 px-2 text-[8px]"
				onclick={() => selection.clear()}
				disabled={selection.size === 0 || isBusy}>{m.pool_clear_selection()}</Button
			>
			<Button
				variant="outline"
				size="sm"
				class="font-pixel h-7 px-2 text-[8px]"
				onclick={addSelected}
				disabled={selection.size === 0 || isBusy}>{m.pool_add_selected()}</Button
			>
		</div>
	{/if}
	<VirtualPoolList
		items={visible}
		{active}
		testid="import-row"
		checked={(id) => selection.has(id)}
		onToggle={toggle}
		actionVariant={(item) => (isAdded(item.id) ? 'secondary' : 'outline')}
		actionLabel={(item) => (isAdded(item.id) ? m.pool_added() : m.pool_add())}
		onAction={addItem}
		emptyLabel={filtering ? m.pool_filter_no_match() : m.pool_empty()}
	/>
	{#if !itemLoader.isDone}
		<div class="p-1.5 pt-0.5">
			<Button class="w-full" variant="outline" onclick={() => itemLoader.loadBatch()} disabled={itemLoader.isLoading}>
				{itemLoader.isLoading ? m.LOADING() : m.load_more()}
			</Button>
		</div>
	{/if}
</section>
