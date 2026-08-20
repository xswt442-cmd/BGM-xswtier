<script lang="ts">
	import PoolRow from '$lib/components/PoolRow.svelte';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { searchPool } from '$lib/states/searchPool.svelte';

	let selection = $state<Set<string>>(new Set());
	const items = $derived(searchPool.items);

	function toggle(id: string) {
		const next = new Set(selection);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selection = next;
	}

	function remove(id: string) {
		searchPool.remove(id);
		if (selection.has(id)) {
			const next = new Set(selection);
			next.delete(id);
			selection = next;
		}
	}

	function removeSelected() {
		searchPool.removeAll(selection);
		selection = new Set();
	}
</script>

<section class="min-w-0 border-2 border-border bg-card/60" data-testid="ranking-pool-panel">
	<div class="flex items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
		<span class="font-pixel text-[10px]">{m.pool_ranking_title()}</span>
		<div class="flex items-center gap-2">
			<span class="font-pixel text-[10px] text-muted-foreground">{items.length}</span>
			<Button variant="ghost" size="sm" class="font-pixel h-5 px-2 text-[9px]" onclick={() => { searchPool.clear(); selection = new Set(); }} disabled={items.length === 0}>
				{m.pool_delete_all()}
			</Button>
		</div>
	</div>
	{#if items.length > 0}
		<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
			<span class="font-pixel mr-auto text-[9px] text-muted-foreground">{m.pool_selected_count({ count: selection.size })}</span>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (selection = new Set(items.map((item) => item.id)))}>{m.pool_select_all()}</Button>
			<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (selection = new Set())} disabled={selection.size === 0}>{m.pool_clear_selection()}</Button>
			<Button variant="destructive" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={removeSelected} disabled={selection.size === 0}>{m.pool_delete_selected()}</Button>
		</div>
	{/if}
	<div class="grid min-w-0 max-h-[55svh] grid-cols-1 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-2">
		{#if items.length === 0}
			<p class="font-pixel py-5 text-center text-[10px] text-muted-foreground sm:col-span-2">{m.pool_empty()}</p>
		{:else}
			{#each items as item (item.id)}
				<PoolRow
					{item}
					testid="pool-row"
					checked={selection.has(item.id)}
					onToggle={() => toggle(item.id)}
					actionVariant="destructive"
					actionLabel={m.pool_delete()}
					onAction={() => remove(item.id)}
				/>
			{/each}
		{/if}
	</div>
</section>
