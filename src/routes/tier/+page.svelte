<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import TierBar from '$lib/components/TierBar.svelte';
	import ItemList from '$lib/components/ItemList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetTitle } from '$lib/components/ui/sheet';
	import { tierData } from '$lib/states/tierData.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { sidebar } from '$lib/states/sidebar.svelte';
	import { fetchIndexById } from '$lib/api/indexFetchers.svelte';
	import { fetchUserCollection } from '$lib/api/bgmFetchers.svelte';
	import { m } from '$lib/paraglide/messages';

	// 首次进入：读 URL 参数 → 加载条目 → 分批入队
	onMount(async () => {
		const index = Number(page.url.searchParams.get('index'));
		const user = page.url.searchParams.get('user');
		if (!index && !user) {
			goto('/');
			return;
		}
		itemLoader.clear();
		let identities;
		if (index) {
			identities = await fetchIndexById(index);
		} else if (user) {
			identities = await fetchUserCollection(user);
		}
		if (!identities || identities.length === 0) return;
		itemLoader.addItems(identities);
		await itemLoader.loadBatch();
	});
</script>

<div class="mx-auto grid min-h-svh w-full max-w-7xl lg:grid-cols-[minmax(0,1fr)_340px]">
	<main class="p-4 pt-6 pb-32 lg:pb-4">
		<div class="mb-6 flex items-center gap-2">
			<span class="icon-[pixelarticons--notebook] h-5 w-5 text-accent"></span>
			<span
				class="font-pixel rounded-md px-2.5 py-1 text-[11px] text-black"
				style="background: var(--chart-2);"
			>
				TIER LIST
			</span>
		</div>
		{#each tierData.tiers as tier (tier.id)}
			<TierBar
				bind:items={tier.items}
				title={tier.label}
				color={tier.color}
				onRename={(label) => tierData.renameTier(tier.id, label)}
				onColorChange={(color) => tierData.recolorTier(tier.id, color)}
				onDelete={() => tierData.removeTier(tier.id)}
				canDelete={tierData.tiers.length > 1}
			/>
		{/each}
		<Button variant="outline" class="w-full" onclick={() => tierData.addTier()}>
			<span class="icon-[pixelarticons--plus] mr-1 h-4 w-4"></span>
			{m.add_tier()}
		</Button>
	</main>

	<aside class="hidden lg:block">
		<div class="sticky top-14 h-[calc(100svh-3.5rem)] border-l">
			<ItemList bind:items={tierData.collection} onLoadMore={() => itemLoader.loadBatch()} />
		</div>
	</aside>
</div>

<!-- 移动/平板：集合面板作为底部抽屉 -->
<Sheet bind:open={sidebar.open} side="bottom" class="lg:hidden">
	{#snippet content()}
		<SheetTitle class="sr-only">{m.unranked()}</SheetTitle>
		<div class="h-[60svh]">
			<ItemList bind:items={tierData.collection} onLoadMore={() => itemLoader.loadBatch()} />
		</div>
	{/snippet}
</Sheet>
