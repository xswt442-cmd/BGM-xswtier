<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import TierBar from '$lib/components/TierBar.svelte';
	import ItemList from '$lib/components/ItemList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetClose, SheetTitle } from '$lib/components/ui/sheet';
	import { tierData } from '$lib/states/tierData.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { sidebar } from '$lib/states/sidebar.svelte';
	import { fetchIndexById } from '$lib/api/indexFetchers.svelte';
	import { fetchUserCollection } from '$lib/api/bgmFetchers.svelte';
	import { m } from '$lib/paraglide/messages';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { toPng } from 'html-to-image';

	let exportNode: HTMLElement;
	let statusMessage = $state('');
	let isExporting = $state(false);

	function allSessionItems() {
		return [
			...tierData.tiers.flatMap((tier) => tier.items),
			...tierData.collection
		];
	}

	function saveDraft(exit = false) {
		tierData.normalize();
		tierData.saveDraft();
		statusMessage = m.draft_saved();
		if (exit) goto('/');
	}

	function clearAndExit() {
		if (!window.confirm(m.clear_exit_confirm())) return;
		tierData.clearSessionAndDraft();
		searchPool.clear();
		itemLoader.clear();
		sidebar.open = false;
		goto('/');
	}

	function exportFilename() {
		const stamp = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');
		return `bgm-xswtier-${stamp}.png`;
	}

	async function exportPng() {
		if (!exportNode || isExporting) return;
		isExporting = true;
		statusMessage = m.exporting_png();
		try {
			await document.fonts.ready;
			const dataUrl = await toPng(exportNode, {
				pixelRatio: 2,
				cacheBust: true,
				skipFonts: true,
				backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
				filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-export-exclude'))
			});
			const link = document.createElement('a');
			link.download = exportFilename();
			link.href = dataUrl;
			link.click();
			statusMessage = m.export_png_success();
		} catch (error) {
			console.error('[Tier export] Failed', error);
			statusMessage = m.export_png_failed();
		} finally {
			isExporting = false;
		}
	}

	// 首次进入：读 URL 参数 → 加载条目 → 分批入队
	onMount(async () => {
		const isDraft = page.url.searchParams.get('draft') === '1';
		const index = Number(page.url.searchParams.get('index'));
		const user = page.url.searchParams.get('user');
		const source = page.url.searchParams.get('source'); // search | season | trending
		if (isDraft) {
			if (!tierData.restoreDraft()) {
				goto('/');
				return;
			}
			itemLoader.clear();
			itemLoader.seedLoaded(allSessionItems());
			return;
		}
		if (!index && !user && !source) {
			goto('/');
			return;
		}
		// 搜索/本季/热门入口：条目已由首页 seed 进 itemLoader.loadedItems，无需 clear/fetch
		if (source) {
			// 首页已原子初始化；刷新时沿用自动持久化的当前会话。
			if (itemLoader.loadedItems.length === 0 && allSessionItems().length === 0) goto('/');
			return;
		}
		itemLoader.clear();
		tierData.startSession([]);
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

<div class="mx-auto grid min-h-svh w-full max-w-7xl xl:grid-cols-[minmax(0,1fr)_340px]">
	<main class="p-4 pt-6 pb-32 xl:pb-4">
		<div class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4" data-export-exclude>
			<Button variant="outline" class="font-pixel h-11 text-[10px] sm:h-9" onclick={() => saveDraft(false)}>
				{m.save_draft()}
			</Button>
			<Button variant="outline" class="font-pixel h-11 text-[10px] sm:h-9" onclick={() => saveDraft(true)}>
				{m.save_draft_exit()}
			</Button>
			<Button variant="destructive" class="font-pixel h-11 text-[10px] sm:h-9" onclick={clearAndExit}>
				{m.clear_exit()}
			</Button>
			<Button class="font-pixel h-11 text-[10px] sm:h-9" onclick={exportPng} disabled={isExporting}>
				{isExporting ? m.exporting_png() : m.save_png()}
			</Button>
		</div>
		<p class="sr-only" aria-live="polite">{statusMessage}</p>
		<div bind:this={exportNode} class="rounded-lg bg-background p-1">
		<div class="mb-6 flex items-center gap-2">
			<span class="icon-[pixelarticons--notebook] h-5 w-5 text-accent"></span>
			<span
				class="neon-text font-pixel rounded-md px-2.5 py-1 text-xs text-black"
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
		</div>
		<Button variant="outline" class="w-full" onclick={() => tierData.addTier()} data-export-exclude>
			<span class="icon-[pixelarticons--plus] mr-1 h-4 w-4"></span>
			{m.add_tier()}
		</Button>
	</main>

	<aside class="hidden xl:block">
		<div class="sticky top-14 h-[calc(100svh-3.5rem)] border-l">
			<ItemList bind:items={tierData.collection} onLoadMore={() => itemLoader.loadBatch()} />
		</div>
	</aside>
</div>

<!-- 移动/平板：集合面板作为底部抽屉 -->
<Sheet bind:open={sidebar.open} side="bottom" class="xl:hidden">
	{#snippet content()}
		<SheetTitle class="sr-only">{m.unranked()}</SheetTitle>
		<SheetClose class="right-6 top-6 z-10 h-11 w-11" aria-label={m.close_collection()} />
		<div class="h-[60svh]">
			<ItemList bind:items={tierData.collection} onLoadMore={() => itemLoader.loadBatch()} />
		</div>
	{/snippet}
</Sheet>
