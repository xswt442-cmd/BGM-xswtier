<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import ItemCard from '$lib/components/ItemCard.svelte';
	import { searchSubjects, fetchSeason, fetchToday } from '$lib/api/searchFetchers.svelte';
	import type { SearchParams } from '$lib/api/searchFetchers.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	// ---- 检索参数 ----
	let keyword = $state('');
	let tagInput = $state('');
	let tags = $state<string[]>([]);
	let airDateFrom = $state('');
	let airDateTo = $state('');
	let platform = $state(''); // 分类（单选）
	let source = $state(''); // 来源（单选 meta_tags）
	let type = $state(''); // 类型（单选 meta_tags）
	let region = $state('日本'); // 区域（默认锁日本）

	// ---- 检索池（结果区）----
	let results = $state<ItemData[]>([]);
	let total = $state(0);
	let rawFetched = $state(0); // 服务端已拉取原始条数（offset 递增基准）
	let mode = $state<'search' | 'season' | 'today' | null>(null);
	let isLoading = $state(false);
	let hasSearched = $state(false);

	// ---- 排名池（选中待进 tier，持久化全局 store）----
	// $derived 确保 searchPool 内部 $state 变化时组件重新求值
	const selected = $derived(searchPool.items);
	const selectedIds = $derived(new Set(selected.map((i) => i.id)));

	const hasMore = $derived(mode === 'search' && rawFetched < total);
	const isSelected = (id: string) => selectedIds.has(id);

	const PLATFORM_OPTIONS = [
		{ value: '', label: m.filter_platform_all },
		{ value: 'TV', label: m.filter_platform_tv },
		{ value: 'WEB', label: m.filter_platform_web },
		{ value: 'OVA', label: m.filter_platform_ova },
		{ value: '剧场版', label: m.filter_platform_movie },
		{ value: '动态漫画', label: m.filter_platform_dongman },
		{ value: '其他', label: m.filter_platform_other }
	];
	const SOURCE_OPTIONS = [
		{ value: '', label: m.filter_source_all },
		{ value: '原创', label: m.filter_source_original },
		{ value: '漫画改', label: m.filter_source_manga },
		{ value: '游戏改', label: m.filter_source_game },
		{ value: '小说改', label: m.filter_source_novel },
		{ value: '动画改', label: m.filter_source_anime },
		{ value: '影视改', label: m.filter_source_live }
	];
	const TYPE_OPTIONS = [
		{ value: '', label: m.filter_type_all },
		{ value: '科幻', label: m.filter_type_scifi },
		{ value: '喜剧', label: m.filter_type_comedy },
		{ value: '同人', label: m.filter_type_doujin },
		{ value: '百合', label: m.filter_type_yuri },
		{ value: '校园', label: m.filter_type_school },
		{ value: '惊悚', label: m.filter_type_thriller },
		{ value: '后宫', label: m.filter_type_harem },
		{ value: '机战', label: m.filter_type_mecha },
		{ value: '悬疑', label: m.filter_type_mystery },
		{ value: '恋爱', label: m.filter_type_romance },
		{ value: '奇幻', label: m.filter_type_fantasy },
		{ value: '推理', label: m.filter_type_detective },
		{ value: '运动', label: m.filter_type_sports },
		{ value: '耽美', label: m.filter_type_bl },
		{ value: '音乐', label: m.filter_type_music },
		{ value: '战斗', label: m.filter_type_battle },
		{ value: '冒险', label: m.filter_type_adventure },
		{ value: '萌系', label: m.filter_type_moe },
		{ value: '穿越', label: m.filter_type_isekai },
		{ value: '玄幻', label: m.filter_type_xuanhuan },
		{ value: '乙女', label: m.filter_type_otome },
		{ value: '恐怖', label: m.filter_type_horror },
		{ value: '历史', label: m.filter_type_history },
		{ value: '日常', label: m.filter_type_slice },
		{ value: '剧情', label: m.filter_type_drama },
		{ value: '武侠', label: m.filter_type_wuxia },
		{ value: '美食', label: m.filter_type_food },
		{ value: '职场', label: m.filter_type_work }
	];

	function addTag() {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) tags = [...tags, t];
		tagInput = '';
	}
	function removeTag(t: string) {
		tags = tags.filter((x) => x !== t);
	}

	function buildSearchParams(offset = 0): SearchParams {
		// 来源 + 类型 + 区域合并进 meta_tags（区域默认日本，可切换）
		const metaTags = [
			...(source ? [source] : []),
			...(type ? [type] : []),
			...(region ? [region] : [])
		];
		return { keyword, tags, platform, metaTags, airDateFrom, airDateTo, offset };
	}

	async function runSearch() {
		mode = 'search';
		hasSearched = true;
		isLoading = true;
		const r = await searchSubjects(buildSearchParams());
		results = r.items;
		rawFetched = r.rawCount;
		total = r.total;
		isLoading = false;
	}
	async function loadMore() {
		if (mode !== 'search') return;
		isLoading = true;
		const r = await searchSubjects(buildSearchParams(rawFetched)); // 用原始条数递增，规避二次过滤跳页
		results = [...results, ...r.items];
		rawFetched += r.rawCount;
		total = r.total;
		isLoading = false;
	}
	async function loadSeason() {
		mode = 'season';
		hasSearched = true;
		isLoading = true;
		results = await fetchSeason();
		rawFetched = results.length;
		total = results.length;
		isLoading = false;
	}
	async function loadToday() {
		mode = 'today';
		hasSearched = true;
		isLoading = true;
		results = await fetchToday();
		rawFetched = results.length;
		total = results.length;
		isLoading = false;
	}

	function toggleSelect(item: ItemData) {
		// 加入 / 取消（toggle）
		if (searchPool.has(item.id)) searchPool.remove(item.id);
		else searchPool.add(item);
	}
	function removeSelected(item: ItemData) {
		// 从排名池删除（检索池自动恢复未加态）
		searchPool.remove(item.id);
	}
	function addAllResults() {
		// 检索池全部加入排名池（searchPool.addAll 内部去重）
		searchPool.addAll(results);
	}
	function clearSelected() {
		// 清空排名池（检索池自动全部恢复未加态）
		searchPool.clear();
	}

	function goToTier() {
		// 基于排名池，非 results
		const pool = searchPool.items;
		if (pool.length === 0 || !mode) return;
		itemLoader.clear();
		itemLoader.seedLoaded(pool);
		goto(`/tier?source=${mode}`);
	}
</script>

<div class="grid gap-3">
	<!-- ① 直接搜索 -->
	<div class="grid gap-1.5">
		<Label for="search-keyword" class="font-pixel text-xs">{m.search_label()}</Label>
		<Input
			id="search-keyword"
			type="text"
			placeholder={m.search_placeholder()}
			bind:value={keyword}
		/>
	</div>

	<!-- ② 区域（默认锁日本）-->
	<div class="grid gap-1.5">
		<Label class="font-pixel text-xs">{m.filter_region_label()}</Label>
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => (region = region === '日本' ? '' : '日本')}
				class={cn(
					'font-pixel border-2 px-2.5 py-1.5 text-[11px] leading-none',
					region === '日本'
						? 'border-border bg-card text-foreground'
						: 'border-border/40 bg-transparent text-muted-foreground'
				)}
			>
				[日本]
			</button>
			<span class="font-pixel text-[9px] text-muted-foreground">{m.filter_region_default()}</span>
		</div>
	</div>

	<!-- ③ 快捷入口 -->
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" class="font-pixel text-[10px]" onclick={loadSeason} disabled={isLoading}>
			<span class="icon-[pixelarticons--calendar] mr-1 h-4 w-4"></span>
			{m.season_quick()}
		</Button>
		<Button variant="outline" class="font-pixel text-[10px]" onclick={loadToday} disabled={isLoading}>
			<span class="icon-[pixelarticons--flame] mr-1 h-4 w-4"></span>
			{m.trending_quick()}
		</Button>
	</div>

	<!-- ④ 三组筛选下拉 -->
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
		<div class="grid gap-1">
			<Label class="font-pixel text-[10px]">{m.filter_platform_label()}</Label>
			<select
				class="font-pixel h-8 w-full cursor-pointer appearance-none border-2 border-border bg-card px-1 text-[10px] text-foreground outline-none"
				bind:value={platform}
			>
				{#each PLATFORM_OPTIONS as opt}
					<option value={opt.value}>{opt.label()}</option>
				{/each}
			</select>
		</div>
		<div class="grid gap-1">
			<Label class="font-pixel text-[10px]">{m.filter_source_label()}</Label>
			<select
				class="font-pixel h-8 w-full cursor-pointer appearance-none border-2 border-border bg-card px-1 text-[10px] text-foreground outline-none"
				bind:value={source}
			>
				{#each SOURCE_OPTIONS as opt}
					<option value={opt.value}>{opt.label()}</option>
				{/each}
			</select>
		</div>
		<div class="grid gap-1">
			<Label class="font-pixel text-[10px]">{m.filter_type_label()}</Label>
			<select
				class="font-pixel h-8 w-full cursor-pointer appearance-none border-2 border-border bg-card px-1 text-[10px] text-foreground outline-none"
				bind:value={type}
			>
				{#each TYPE_OPTIONS as opt}
					<option value={opt.value}>{opt.label()}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- 标签（且关系）-->
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

	<!-- 开播时间 -->
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
		<!-- 检索池 -->
		<div class="border-2 border-border bg-card/60">
			<div class="flex items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
				<span class="font-pixel text-[10px]">{m.pool_search_title()}</span>
				<div class="flex items-center gap-2">
					<span class="font-pixel text-[10px] text-muted-foreground">
						{m.results_count({ count: results.length, total })}
					</span>
					<Button
						variant="ghost"
						size="sm"
						class="font-pixel h-5 px-2 text-[9px]"
						onclick={addAllResults}
						disabled={results.length === 0}
					>
						{m.pool_add_all()}
					</Button>
				</div>
			</div>
			<div class="max-h-[40svh] overflow-y-auto p-1.5">
				{#if results.length === 0}
					<p class="font-pixel py-2 text-center text-[10px] text-muted-foreground">{m.no_results()}</p>
				{:else}
					{#each results as item (item.id)}
						<div
							class="pixel-border mb-1.5 flex h-28 items-center gap-2 bg-card/70 p-1.5 last:mb-0"
							data-testid="search-row"
							data-platform={item.platform}
						>
							<ItemCard {item} />
							<span class="font-pixel flex-1 truncate text-[10px]" title={item.name_cn || item.name}>
								{item.name_cn || item.name}
							</span>
							<Button
								variant={isSelected(item.id) ? 'secondary' : 'outline'}
								size="sm"
								class="font-pixel text-[10px]"
								onclick={() => toggleSelect(item)}
							>
								{isSelected(item.id) ? m.pool_added() : m.pool_add()}
							</Button>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		{#if hasMore}
			<Button variant="outline" class="w-full font-pixel" onclick={loadMore} disabled={isLoading}>
				{isLoading ? m.LOADING() : m.load_more()}
			</Button>
		{/if}
	{/if}

	<!-- 排名池（独立于搜索，进 START 即显示持久化内容） -->
	<div class="border-2 border-border bg-card/60">
		<div class="flex items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
			<span class="font-pixel text-[10px]">{m.pool_ranking_title()}</span>
			<div class="flex items-center gap-2">
				<span class="font-pixel text-[10px] text-muted-foreground">{selected.length}</span>
				<Button
					variant="ghost"
					size="sm"
					class="font-pixel h-5 px-2 text-[9px]"
					onclick={clearSelected}
					disabled={selected.length === 0}
				>
					{m.pool_delete_all()}
				</Button>
			</div>
		</div>
		<div class="max-h-[30svh] overflow-y-auto p-1.5">
			{#if selected.length === 0}
				<p class="font-pixel py-2 text-center text-[10px] text-muted-foreground">{m.pool_empty()}</p>
			{:else}
				{#each selected as item (item.id)}
					<div
						class="pixel-border mb-1.5 flex h-28 items-center gap-2 bg-card/70 p-1.5 last:mb-0"
						data-testid="pool-row"
					>
						<ItemCard {item} />
						<span class="font-pixel flex-1 truncate text-[10px]" title={item.name_cn || item.name}>
							{item.name_cn || item.name}
						</span>
						<Button
							variant="destructive"
							size="sm"
							class="font-pixel text-[10px]"
							onclick={() => removeSelected(item)}
						>
							{m.pool_delete()}
						</Button>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<Button class="w-full font-pixel" onclick={goToTier} disabled={selected.length === 0}>
		{m.go_to_tier({ count: selected.length })}
	</Button>
</div>
