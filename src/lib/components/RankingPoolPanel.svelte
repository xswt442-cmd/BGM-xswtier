<script lang="ts">
	import VirtualPoolList from '$lib/components/VirtualPoolList.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { pruneMutableSelection, selectAllMutable, toggleMutableSelection } from '$lib/utils/poolPerformance';

	let { active = true }: { active?: boolean } = $props();
	const selection = new SvelteSet<string>();
	const items = $derived(searchPool.items);
	$effect(() => pruneMutableSelection(selection, items));

	function toggle(id: string) {
		toggleMutableSelection(selection, id);
	}

	function remove(id: string) {
		searchPool.remove(id);
		if (selection.has(id)) {
			selection.delete(id);
		}
	}

	function removeSelected() {
		searchPool.removeAll(selection);
		selection.clear();
	}
</script>

<section class="min-w-0 border-2 border-border bg-card/60" data-testid="ranking-pool-panel">
	<div class="flex items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
		<span class="font-pixel text-[10px]">{m.pool_ranking_title()}</span>
		<div class="flex items-center gap-2">
			<span class="font-pixel text-[10px] text-muted-foreground">{items.length}</span>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-5 px-2 text-[9px]"
				onclick={() => {
					searchPool.clear();
					selection.clear();
				}}
				disabled={items.length === 0}
			>
				{m.pool_delete_all()}
			</Button>
		</div>
	</div>
	{#if items.length > 0}
		<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
			<span class="font-pixel mr-auto text-[9px] text-muted-foreground"
				>{m.pool_selected_count({ count: selection.size })}</span
			>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-7 px-2 text-[8px]"
				onclick={() => selectAllMutable(selection, items)}>{m.pool_select_all()}</Button
			>
			<Button
				variant="ghost"
				size="sm"
				class="font-pixel h-7 px-2 text-[8px]"
				onclick={() => selection.clear()}
				disabled={selection.size === 0}>{m.pool_clear_selection()}</Button
			>
			<Button
				variant="destructive"
				size="sm"
				class="font-pixel h-7 px-2 text-[8px]"
				onclick={removeSelected}
				disabled={selection.size === 0}>{m.pool_delete_selected()}</Button
			>
		</div>
	{/if}
	<VirtualPoolList
		{items}
		{active}
		testid="pool-row"
		checked={(id) => selection.has(id)}
		onToggle={toggle}
		actionVariant={() => 'destructive'}
		actionLabel={() => m.pool_delete()}
		onAction={(item) => remove(item.id)}
		maxHeight="55svh"
	/>
</section>
