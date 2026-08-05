<script lang="ts">
	import PoolRow from '$lib/components/PoolRow.svelte';
	import { Button } from '$lib/components/ui/button';
	import { indexPool } from '$lib/states/indexPool.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	// 目录池：复刻检索池的 source 角色，ADD 进排名池（searchPool）。
	// 目录池自身条目在 indexPool，与检索池 results 完全独立，互不干涉。
	const isAdded = (id: string) => searchPool.has(id);

	let selection = $state<Set<string>>(new Set());

	function toggleSelect(id: string) {
		const next = new Set(selection);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selection = next;
	}
	function addToRanking(item: ItemData) {
		if (isAdded(item.id)) return;
		searchPool.add(item);
	}
	function addAllToRanking() {
		searchPool.addAll(indexPool.items.filter((i) => !isAdded(i.id)));
		selection = new Set();
	}
	function addSelected() {
		searchPool.addAll(indexPool.items.filter((i) => selection.has(i.id) && !isAdded(i.id)));
		selection = new Set();
	}
</script>

<section class="flex min-w-0 flex-col border-2 border-border bg-card/60">
	<div class="flex items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
		<span class="font-pixel text-[10px]">{m.index_pool_title()}</span>
		<div class="flex items-center gap-2">
			<span class="font-pixel text-[9px] text-muted-foreground">
				{m.loading_progress({ loaded: itemLoader.loadedCount, total: itemLoader.total })}
			</span>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-5 px-2 text-[9px]"
				onclick={addAllToRanking}
				disabled={indexPool.items.length === 0}
			>
				{m.pool_add_all()}
			</Button>
		</div>
	</div>
	{#if indexPool.items.length > 0}
		<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
			<span class="font-pixel mr-auto text-[9px] text-muted-foreground">{m.pool_selected_count({ count: selection.size })}</span>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (selection = new Set(indexPool.items.map((i) => i.id)))}>{m.pool_select_all()}</Button>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (selection = new Set())} disabled={selection.size === 0}>{m.pool_clear_selection()}</Button>
			<Button variant="outline" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={addSelected} disabled={selection.size === 0}>{m.pool_add_selected()}</Button>
		</div>
	{/if}
	<div class="grid min-w-0 max-h-[40svh] grid-cols-1 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-2">
		{#if indexPool.items.length === 0}
			<p class="font-pixel py-2 text-center text-[10px] text-muted-foreground">{m.pool_empty()}</p>
		{:else}
			{#each indexPool.items as item (item.id)}
				<PoolRow
					{item}
					testid="index-row"
					checked={selection.has(item.id)}
					onToggle={() => toggleSelect(item.id)}
					actionVariant={isAdded(item.id) ? 'secondary' : 'outline'}
					actionLabel={isAdded(item.id) ? m.pool_added() : m.pool_add()}
					onAction={() => addToRanking(item)}
				/>
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
