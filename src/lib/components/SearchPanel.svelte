<script lang="ts">
	import { goto } from '$app/navigation';
	import { Tooltip } from 'bits-ui';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import ItemCard from '$lib/components/ItemCard.svelte';
	import { searchSubjects, fetchCalendar, fetchTrending } from '$lib/api/searchFetchers.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	let keyword = $state('');
	let tagInput = $state('');
	let tags = $state<string[]>([]);
	let airDateFrom = $state('');
	let airDateTo = $state('');

	let results = $state<ItemData[]>([]);
	let total = $state(0);
	let source = $state<'search' | 'season' | 'trending' | null>(null);
	let isLoading = $state(false);
	let hasSearched = $state(false);

	const hasMore = $derived(source === 'search' && results.length < total);

	function addTag() {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) tags = [...tags, t];
		tagInput = '';
	}
	function removeTag(t: string) {
		tags = tags.filter((x) => x !== t);
	}

	async function runSearch() {
		source = 'search';
		hasSearched = true;
		isLoading = true;
		const r = await searchSubjects({ keyword, tags, airDateFrom, airDateTo, offset: 0 });
		results = r.items;
		total = r.total;
		isLoading = false;
	}
	async function loadMore() {
		if (source !== 'search') return;
		isLoading = true;
		const r = await searchSubjects({ keyword, tags, airDateFrom, airDateTo, offset: results.length });
		results = [...results, ...r.items];
		total = r.total;
		isLoading = false;
	}
	async function loadSeason() {
		source = 'season';
		hasSearched = true;
		isLoading = true;
		results = await fetchCalendar();
		total = results.length;
		isLoading = false;
	}
	async function loadTrending() {
		source = 'trending';
		hasSearched = true;
		isLoading = true;
		results = await fetchTrending();
		total = results.length;
		isLoading = false;
	}

	function goToTier() {
		if (results.length === 0 || !source) return;
		itemLoader.clear();
		itemLoader.seedLoaded(results);
		goto(`/tier?source=${source}`);
	}
</script>

<div class="grid gap-3">
	<div class="flex flex-wrap gap-2">
		<Button
			variant="outline"
			class="font-pixel text-[10px]"
			onclick={loadSeason}
			disabled={isLoading}
		>
			<span class="icon-[pixelarticons--calendar] mr-1 h-4 w-4"></span>
			{m.season_quick()}
		</Button>
		<Button
			variant="outline"
			class="font-pixel text-[10px]"
			onclick={loadTrending}
			disabled={isLoading}
		>
			<span class="icon-[pixelarticons--flame] mr-1 h-4 w-4"></span>
			{m.trending_quick()}
		</Button>
	</div>

	<div class="grid gap-1.5">
		<Label for="search-keyword" class="font-pixel text-xs">{m.search_label()}</Label>
		<Input
			id="search-keyword"
			type="text"
			placeholder={m.search_placeholder()}
			bind:value={keyword}
		/>
	</div>

	<div class="grid gap-1.5">
		<Label for="search-tags" class="font-pixel text-xs">{m.filter_tags_label()}</Label>
		<div class="flex gap-2">
			<Input
				id="search-tags"
				type="text"
				placeholder={m.filter_tags_placeholder()}
				bind:value={tagInput}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						addTag();
					}
				}}
			/>
			<Button type="button" variant="outline" onclick={addTag} class="font-pixel text-[10px]">
				{m.add_tag()}
			</Button>
		</div>
		{#if tags.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each tags as tag (tag)}
					<button
						onclick={() => removeTag(tag)}
						class="font-pixel border-2 border-border bg-card px-2 py-0.5 text-[10px] text-foreground hover:opacity-70"
					>
						{tag} ✕
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="grid gap-1.5">
		<Label class="font-pixel text-xs">{m.filter_airdate_label()}</Label>
		<div class="flex items-center gap-2">
			<span class="font-pixel text-[10px] text-muted-foreground">{m.airdate_from()}</span>
			<Input type="date" class="flex-1" bind:value={airDateFrom} />
			<span class="font-pixel text-[10px] text-muted-foreground">{m.airdate_to()}</span>
			<Input type="date" class="flex-1" bind:value={airDateTo} />
		</div>
	</div>

	<Button onclick={runSearch} disabled={isLoading} class="font-pixel">
		{isLoading ? m.searching() : m.search_button()}
	</Button>

	{#if hasSearched}
		<p class="font-pixel text-[10px] text-muted-foreground">
			{m.results_count({ count: results.length, total })}
		</p>
		<div class="border-2 border-border bg-card/60 px-2 py-1 max-h-[40svh] overflow-y-auto">
			{#if results.length === 0}
				<p class="font-pixel py-2 text-center text-[10px] text-muted-foreground">{m.no_results()}</p>
			{:else}
				<Tooltip.Provider>
					{#each results as item (item.id)}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<div
									title={item.name_cn || item.name}
									class="font-pixel truncate border-b border-border/50 py-1 text-[10px] text-foreground last:border-b-0 hover:text-accent"
								>
									{(item.name_cn || item.name).slice(0, 18)}
									{#if (item.name_cn || item.name).length > 18}…{/if}
								</div>
							</Tooltip.Trigger>
							<Tooltip.Content side="right" class="z-50">
								<div class="rounded-lg border-2 border-border bg-background p-2 pixel-shadow">
									<ItemCard {item} />
								</div>
							</Tooltip.Content>
						</Tooltip.Root>
					{/each}
				</Tooltip.Provider>
			{/if}
		</div>
		{#if hasMore}
			<Button variant="outline" class="w-full font-pixel" onclick={loadMore} disabled={isLoading}>
				{isLoading ? m.LOADING() : m.load_more()}
			</Button>
		{/if}
		<Button class="w-full font-pixel" onclick={goToTier} disabled={results.length === 0}>
			{m.go_to_tier({ count: results.length })}
		</Button>
	{/if}
</div>
