<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { ItemData } from '$lib/schemas/item';
	import ItemCard from './ItemCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';

	let { items = $bindable([]), onLoadMore }: { items: ItemData[]; onLoadMore?: () => void } = $props();

	const flipDurationMs = 300;
	function handleDndConsider(e: CustomEvent) {
		items = e.detail.items;
	}
	function handleDndFinalize(e: CustomEvent) {
		items = e.detail.items;
	}
</script>

<section class="flex h-full flex-col">
	<div class="flex items-center justify-between px-3 pb-2 pt-3">
		<h2 class="text-sm font-bold">{m.unranked()}</h2>
		{#if itemLoader.total > 0}
			<span class="text-xs text-muted-foreground">
				{m.loading_progress({ loaded: itemLoader.loadedCount, total: itemLoader.total })}
			</span>
		{/if}
	</div>
	<div class="flex-1 overflow-y-auto">
		{#if items.length === 0 && !itemLoader.isLoading}
			<p class="p-6 text-center text-sm text-muted-foreground">{m.EMPTY()}</p>
		{:else}
			<section
				use:dndzone={{ items, flipDurationMs }}
				onconsider={handleDndConsider}
				onfinalize={handleDndFinalize}
				class="flex flex-wrap content-start gap-2 p-3"
			>
				{#each items as item (item.id)}
					<div animate:flip={{ duration: flipDurationMs }}>
						<ItemCard {item} />
					</div>
				{/each}
			</section>
		{/if}
	</div>
	{#if !itemLoader.isDone}
		<div class="p-3 pt-1">
			<Button class="w-full" variant="outline" onclick={onLoadMore} disabled={itemLoader.isLoading}>
				{itemLoader.isLoading ? m.LOADING() : m.load_more()}
			</Button>
		</div>
	{/if}
</section>
