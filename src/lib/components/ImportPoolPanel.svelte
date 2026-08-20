<script lang="ts">
	import PoolRow from '$lib/components/PoolRow.svelte';
	import { Button } from '$lib/components/ui/button';
	import { importPool } from '$lib/states/importPool.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	let selection = $state<Set<string>>(new Set());
	let isLoadingAll = $state(false);
	const isBusy = $derived(isLoadingAll || itemLoader.isLoading);
	const isAdded = (id: string) => searchPool.has(id);

	async function loadAllRemaining() {
		while (!itemLoader.isDone) await itemLoader.loadBatch();
	}

	async function addAllToRanking() {
		if (isBusy) return;
		isLoadingAll = true;
		try {
			await loadAllRemaining();
			searchPool.addAll(importPool.items);
			selection = new Set();
		} finally {
			isLoadingAll = false;
		}
	}

	async function selectAll() {
		if (isBusy) return;
		isLoadingAll = true;
		try {
			await loadAllRemaining();
			selection = new Set(importPool.items.map((item) => item.id));
		} finally {
			isLoadingAll = false;
		}
	}

	function toggle(id: string) {
		const next = new Set(selection);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selection = next;
	}

	function addSelected() {
		searchPool.addAll(importPool.items.filter((item) => selection.has(item.id)));
		selection = new Set();
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
				<span class="truncate text-[10px] text-muted-foreground" title={importPool.source.label}>{importPool.source.label}</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<span class="font-pixel text-[9px] text-muted-foreground">{m.loading_progress({ loaded: itemLoader.loadedCount, total: itemLoader.total })}</span>
			<Button variant="ghost" size="sm" class="font-pixel h-5 px-2 text-[9px]" onclick={addAllToRanking} disabled={importPool.items.length === 0 || isBusy}>
				{isLoadingAll ? m.pool_adding_all() : m.pool_add_all()}
			</Button>
		</div>
	</div>
	{#if importPool.items.length > 0}
		<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
			<span class="font-pixel mr-auto text-[9px] text-muted-foreground">{m.pool_selected_count({ count: selection.size })}</span>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={selectAll} disabled={isBusy}>{m.pool_select_all()}</Button>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (selection = new Set())} disabled={selection.size === 0 || isBusy}>{m.pool_clear_selection()}</Button>
			<Button variant="outline" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={addSelected} disabled={selection.size === 0 || isBusy}>{m.pool_add_selected()}</Button>
		</div>
	{/if}
	<div class="grid min-w-0 max-h-[40svh] grid-cols-1 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-2">
		{#if importPool.items.length === 0}
			<p class="font-pixel py-4 text-center text-[10px] text-muted-foreground sm:col-span-2">{m.pool_empty()}</p>
		{:else}
			{#each importPool.items as item (item.id)}
				<PoolRow {item} testid="import-row" checked={selection.has(item.id)} onToggle={() => toggle(item.id)} actionVariant={isAdded(item.id) ? 'secondary' : 'outline'} actionLabel={isAdded(item.id) ? m.pool_added() : m.pool_add()} onAction={() => addItem(item)} />
			{/each}
		{/if}
	</div>
	{#if !itemLoader.isDone}
		<div class="p-1.5 pt-0.5">
			<Button class="w-full" variant="outline" onclick={() => itemLoader.loadBatch()} disabled={itemLoader.isLoading}>
				{itemLoader.isLoading ? m.LOADING() : m.load_more()}
			</Button>
		</div>
	{/if}
</section>
