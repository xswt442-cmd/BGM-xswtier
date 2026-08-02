<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import ItemCard from '$lib/components/ItemCard.svelte';
	import { searchSubjects, fetchSeason, fetchToday } from '$lib/api/searchFetchers.svelte';
	import type { SearchParams } from '$lib/api/searchFetchers.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { tierData } from '$lib/states/tierData.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	// ---- 检索参数 ----
	let keyword = $state('');
	let tagInput = $state('');
	let tags = $state<string[]>([]);
	let airDateFrom = $state('');
	let airDateTo = $state('');
	let ratingFrom = $state('0.0'); // 评分下界（0.0–10.0）
	let ratingTo = $state('10.0'); // 评分上界（半开 <to）
	let ratingCountMin = $state('0'); // 评分人数下界
	let ratingCountMax = $state('99999'); // 评分人数上界（半开 <max）
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
	let isLoadingAll = $state(false);
	let isAddingAll = $state(false);
	let searchExhausted = $state(false);
	let hasSearched = $state(false);

	// ---- 排名池（选中待进 tier，持久化全局 store）----
	// $derived 确保 searchPool 内部 $state 变化时组件重新求值
	const selected = $derived(searchPool.items);
	const selectedIds = $derived(new Set(selected.map((i) => i.id)));
	let searchSelection = $state<Set<string>>(new Set());
	let rankingSelection = $state<Set<string>>(new Set());

	const hasMore = $derived(mode === 'search' && !searchExhausted);
	const isBusy = $derived(isLoading || isLoadingAll || isAddingAll);
	const isSelected = (id: string) => selectedIds.has(id);

	function mergeUnique(base: ItemData[], incoming: ItemData[]): ItemData[] {
		const seen = new Set(base.map((item) => item.id));
		return [...base, ...incoming.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))];
	}

	const REGION_OPTIONS = [
		{ value: '日本', label: m.filter_region_japan },
		{ value: '中国', label: m.filter_region_china },
		{ value: '韩国', label: m.filter_region_korea },
		{ value: '欧美', label: m.filter_region_western },
		{ value: '', label: m.filter_region_all }
	];
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

	/** 空串 / NaN → undefined；否则转 number（评分区间传数值，空则不筛选） */
	function toNum(v: string | number): number | undefined {
		const raw = String(v).trim();
		const n = Number(raw);
		return raw !== '' && Number.isFinite(n) ? n : undefined;
	}

	function buildSearchParams(offset = 0): SearchParams {
		// 来源 + 类型 + 区域合并进 meta_tags（区域默认日本，可切换）
		const metaTags = [
			...(source ? [source] : []),
			...(type ? [type] : []),
			...(region ? [region] : [])
		];
		return {
			keyword,
			tags,
			platform,
			metaTags,
			airDateFrom,
			airDateTo,
			ratingFrom: toNum(ratingFrom),
			ratingTo: toNum(ratingTo),
			ratingCountMin: toNum(ratingCountMin),
			ratingCountMax: toNum(ratingCountMax),
			offset
		};
	}

	async function runSearch() {
		searchSelection = new Set();
		mode = 'search';
		searchExhausted = false;
		hasSearched = true;
		isLoading = true;
		try {
			const r = await searchSubjects(buildSearchParams());
			results = r.items;
			rawFetched = r.rawCount;
			total = r.total;
			searchExhausted = r.rawCount === 0 || r.rawCount >= r.total;
		} finally {
			isLoading = false;
		}
	}
	async function loadMore() {
		if (mode !== 'search') return;
		isLoading = true;
		try {
			const r = await searchSubjects(buildSearchParams(rawFetched)); // 用原始条数递增，规避二次过滤跳页
			if (r.rawCount === 0) {
				// total>0 表示服务端正常返回空尾页；total=0 可能是请求失败，保留重试入口。
				if (r.total > 0) searchExhausted = true;
				return;
			}
			results = mergeUnique(results, r.items);
			rawFetched += r.rawCount;
			total = r.total;
			if (rawFetched >= total) searchExhausted = true;
		} finally {
			isLoading = false;
		}
	}
	async function loadSeason() {
		searchSelection = new Set();
		mode = 'season';
		searchExhausted = true;
		hasSearched = true;
		isLoading = true;
		try {
			results = await fetchSeason();
			rawFetched = results.length;
			total = results.length;
		} finally {
			isLoading = false;
		}
	}
	async function loadToday() {
		searchSelection = new Set();
		mode = 'today';
		searchExhausted = true;
		hasSearched = true;
		isLoading = true;
		try {
			results = await fetchToday();
			rawFetched = results.length;
			total = results.length;
		} finally {
			isLoading = false;
		}
	}

	function toggleSelect(item: ItemData) {
		// 加入 / 取消（toggle）
		if (searchPool.has(item.id)) {
			searchPool.remove(item.id);
			rankingSelection = new Set([...rankingSelection].filter((id) => id !== item.id));
		}
		else searchPool.add(item);
	}
	function removeSelected(item: ItemData) {
		// 从排名池删除（检索池自动恢复未加态）
		searchPool.remove(item.id);
		rankingSelection = new Set([...rankingSelection].filter((id) => id !== item.id));
	}
	async function addAllResults() {
		if (isBusy || (results.length === 0 && !hasMore)) return;
		// 快捷检索已全量加载；自定义搜索则继续扫描剩余候选页并增量加入真实命中项。
		searchPool.addAll(results);
		if (mode !== 'search' || !hasMore) return;
		isAddingAll = true;
		try {
			await scanRemaining(true);
		} finally {
			isAddingAll = false;
		}
	}
	async function scanRemaining(addToRanking: boolean) {
		if (mode !== 'search' || !hasMore) return;
		let offset = rawFetched;
		let expectedTotal = total;
		let pages = 0;
		while (offset < expectedTotal && pages < 100) {
			const r = await searchSubjects(buildSearchParams(offset));
			if (r.rawCount === 0) {
				if (r.total > 0) searchExhausted = true;
				break;
			}
			results = mergeUnique(results, r.items);
			if (addToRanking) searchPool.addAll(r.items);
			offset += r.rawCount;
			expectedTotal = Math.max(expectedTotal, r.total);
			rawFetched = offset;
			total = expectedTotal;
			pages += 1;
		}
		if (offset >= expectedTotal || pages >= 100) searchExhausted = true;
	}
	async function loadAllResults() {
		if (isBusy || mode !== 'search' || !hasMore) return;
		isLoadingAll = true;
		try {
			await scanRemaining(false);
		} finally {
			isLoadingAll = false;
		}
	}
	function clearSelected() {
		// 清空排名池（检索池自动全部恢复未加态）
		searchPool.clear();
		rankingSelection = new Set();
	}
	function toggleBatch(set: Set<string>, id: string, target: 'search' | 'ranking') {
		const next = new Set(set);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		if (target === 'search') searchSelection = next;
		else rankingSelection = next;
	}
	function addBatchSelection() {
		searchPool.addAll(results.filter((item) => searchSelection.has(item.id)));
		searchSelection = new Set();
	}
	function deleteBatchSelection() {
		for (const id of rankingSelection) searchPool.remove(id);
		rankingSelection = new Set();
	}

	function goToTier() {
		if (tierData.hasDraft) {
			goto('/tier?draft=1');
			return;
		}
		startNewSession();
	}

	function startNewSession() {
		const pool = searchPool.items;
		if (pool.length === 0) return;
		itemLoader.clear();
		itemLoader.seedLoaded(pool);
		tierData.startSession(pool);
		goto('/tier?source=pool');
	}

</script>

<div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
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

	<!-- ② 区域（可调节，默认日本）-->
	<div class="grid gap-1.5">
		<Label for="search-region" class="font-pixel text-xs">{m.filter_region_label()}</Label>
		<select
			id="search-region"
			class="font-pixel h-10 w-full cursor-pointer appearance-none border-2 border-border bg-card px-2 py-1.5 text-[11px] leading-5 text-foreground outline-none"
			bind:value={region}
		>
			{#each REGION_OPTIONS as opt}
				<option value={opt.value}>{opt.label()}</option>
			{/each}
		</select>
	</div>

	<!-- ③ 快捷入口 -->
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" class="font-pixel text-[10px]" onclick={loadSeason} disabled={isBusy}>
			<span class="icon-[pixelarticons--calendar] mr-1 h-4 w-4"></span>
			{m.season_quick()}
		</Button>
		<Button variant="outline" class="font-pixel text-[10px]" onclick={loadToday} disabled={isBusy}>
			<span class="icon-[pixelarticons--fire] mr-1 h-4 w-4"></span>
			{m.trending_quick()}
		</Button>
	</div>

	<!-- ④ 三组筛选下拉 -->
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
		<div class="grid gap-1">
			<Label for="search-platform" class="font-pixel text-[10px]">{m.filter_platform_label()}</Label>
			<select
				id="search-platform"
				class="font-pixel h-10 w-full cursor-pointer appearance-none border-2 border-border bg-card px-2 py-1.5 text-[11px] leading-5 text-foreground outline-none"
				bind:value={platform}
			>
				{#each PLATFORM_OPTIONS as opt}
					<option value={opt.value}>{opt.label()}</option>
				{/each}
			</select>
		</div>
		<div class="grid gap-1">
			<Label for="search-source" class="font-pixel text-[10px]">{m.filter_source_label()}</Label>
			<select
				id="search-source"
				class="font-pixel h-10 w-full cursor-pointer appearance-none border-2 border-border bg-card px-2 py-1.5 text-[11px] leading-5 text-foreground outline-none"
				bind:value={source}
			>
				{#each SOURCE_OPTIONS as opt}
					<option value={opt.value}>{opt.label()}</option>
				{/each}
			</select>
		</div>
		<div class="grid gap-1">
			<Label for="search-type" class="font-pixel text-[10px]">{m.filter_type_label()}</Label>
			<select
				id="search-type"
				class="font-pixel h-10 w-full cursor-pointer appearance-none border-2 border-border bg-card px-2 py-1.5 text-[11px] leading-5 text-foreground outline-none"
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
		<div class="flex min-w-0 gap-2">
			<Input
				id="search-tags"
				type="text"
				placeholder={m.filter_tags_placeholder()}
				bind:value={tagInput}
				class="min-w-0 flex-1"
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
		<div
			class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
		>
			<Label for="air-date-from" class="font-pixel text-[10px] text-muted-foreground">{m.airdate_from()}</Label>
			<Input id="air-date-from" type="date" class="min-w-0 w-full" bind:value={airDateFrom} />
			<Label for="air-date-to" class="font-pixel text-[10px] text-muted-foreground">{m.airdate_to()}</Label>
			<Input id="air-date-to" type="date" class="min-w-0 w-full" bind:value={airDateTo} />
		</div>
	</div>

	<!-- 评分（0.0–10.0 区间，照抄开播时间布局）-->
	<div class="grid gap-1.5">
		<Label class="font-pixel text-xs">{m.filter_rating_label()}</Label>
		<div
			class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
		>
			<Label for="rating-from" class="font-pixel text-[10px] text-muted-foreground">{m.airdate_from()}</Label>
			<Input
				id="rating-from"
				type="number"
				step="0.1"
				min="0"
				max="10"
				placeholder={m.rating_from_placeholder()}
				class="min-w-0 w-full"
				bind:value={ratingFrom}
			/>
			<Label for="rating-to" class="font-pixel text-[10px] text-muted-foreground">{m.airdate_to()}</Label>
			<Input
				id="rating-to"
				type="number"
				step="0.1"
				min="0"
				max="10"
				placeholder={m.rating_to_placeholder()}
				class="min-w-0 w-full"
				bind:value={ratingTo}
			/>
		</div>
	</div>

	<!-- 评分人数（0–99999 区间）-->
	<div class="grid gap-1.5">
		<Label class="font-pixel text-xs">{m.filter_rating_count_label()}</Label>
		<div
			class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
		>
			<Label for="rating-count-min" class="font-pixel text-[10px] text-muted-foreground">{m.airdate_from()}</Label>
			<Input
				id="rating-count-min"
				type="number"
				step="1"
				min="0"
				placeholder={m.rating_count_min_placeholder()}
				class="min-w-0 flex-1"
				bind:value={ratingCountMin}
			/>
			<Label for="rating-count-max" class="font-pixel text-[10px] text-muted-foreground">{m.airdate_to()}</Label>
			<Input
				id="rating-count-max"
				type="number"
				step="1"
				min="0"
				max="99999"
				placeholder={m.rating_count_max_placeholder()}
				class="min-w-0 w-full"
				bind:value={ratingCountMax}
			/>
		</div>
	</div>

	<Button onclick={runSearch} disabled={isBusy} class="font-pixel">
		{isLoading ? m.searching() : m.search_button()}
	</Button>

	{#if hasSearched}
		<!-- 检索池 -->
		<div class="min-w-0 border-2 border-border bg-card/60">
			<div class="flex items-center justify-between gap-2 border-b-2 border-border px-2 py-1">
				<span class="font-pixel text-[10px]">{m.pool_search_title()}</span>
				<div class="flex items-center gap-2">
					<span class="font-pixel text-[9px] text-muted-foreground">
						{hasMore
							? m.results_scanning({ count: results.length, scanned: rawFetched, total })
							: m.results_complete({ count: results.length })}
					</span>
					<Button
						variant="ghost"
						size="sm"
						class="font-pixel h-5 px-2 text-[9px]"
						onclick={addAllResults}
						disabled={(results.length === 0 && !hasMore) || isBusy}
					>
						{isAddingAll ? m.pool_adding_all() : m.pool_add_all()}
					</Button>
				</div>
			</div>
			{#if results.length > 0}
				<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
					<span class="font-pixel mr-auto text-[9px] text-muted-foreground">{m.pool_selected_count({ count: searchSelection.size })}</span>
					<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (searchSelection = new Set(results.map((item) => item.id)))}>{m.pool_select_all()}</Button>
					<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (searchSelection = new Set())} disabled={searchSelection.size === 0}>{m.pool_clear_selection()}</Button>
					<Button variant="outline" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={addBatchSelection} disabled={searchSelection.size === 0}>{m.pool_add_selected()}</Button>
				</div>
			{/if}
			<div class="grid min-w-0 max-h-[40svh] grid-cols-1 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-2">
				{#if results.length === 0}
					<p class="font-pixel py-2 text-center text-[10px] text-muted-foreground">{m.no_results()}</p>
				{:else}
					{#each results as item (item.id)}
						<div
							class="pixel-border flex h-32 min-w-0 items-center gap-2 bg-card/70 p-1.5"
							data-testid="search-row"
							data-platform={item.platform}
						>
							<input type="checkbox" class="h-4 w-4 shrink-0 accent-primary" aria-label={m.pool_select_item({ name: item.name_cn || item.name })} checked={searchSelection.has(item.id)} onchange={() => toggleBatch(searchSelection, item.id, 'search')} />
							<ItemCard {item} />
							<span class="font-pixel min-w-0 flex-1 truncate text-[10px]" title={item.name_cn || item.name}>
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
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<Button variant="outline" class="w-full border-chart-3 bg-chart-3 font-pixel text-black hover:bg-chart-3/80 hover:text-black" onclick={loadMore} disabled={isBusy}>
					{isLoading ? m.LOADING() : m.load_more()}
				</Button>
				<Button variant="outline" class="w-full border-chart-4 bg-chart-4 font-pixel text-black hover:bg-chart-4/80 hover:text-black" onclick={loadAllResults} disabled={isBusy}>
					{isLoadingAll ? m.loading_all() : m.load_all()}
				</Button>
			</div>
		{/if}
	{/if}

	<!-- 排名池（独立于搜索，进 START 即显示持久化内容） -->
	<div class="min-w-0 border-2 border-border bg-card/60">
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
		{#if selected.length > 0}
			<div class="flex flex-wrap items-center gap-1.5 border-b-2 border-border px-2 py-1">
				<span class="font-pixel mr-auto text-[9px] text-muted-foreground">{m.pool_selected_count({ count: rankingSelection.size })}</span>
				<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (rankingSelection = new Set(selected.map((item) => item.id)))}>{m.pool_select_all()}</Button>
				<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => (rankingSelection = new Set())} disabled={rankingSelection.size === 0}>{m.pool_clear_selection()}</Button>
				<Button variant="destructive" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={deleteBatchSelection} disabled={rankingSelection.size === 0}>{m.pool_delete_selected()}</Button>
			</div>
		{/if}
		<div class="grid min-w-0 max-h-[30svh] grid-cols-1 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-2">
			{#if selected.length === 0}
				<p class="font-pixel py-2 text-center text-[10px] text-muted-foreground">{m.pool_empty()}</p>
			{:else}
				{#each selected as item (item.id)}
					<div
						class="pixel-border flex h-32 min-w-0 items-center gap-2 bg-card/70 p-1.5"
						data-testid="pool-row"
					>
						<input type="checkbox" class="h-4 w-4 shrink-0 accent-primary" aria-label={m.pool_select_item({ name: item.name_cn || item.name })} checked={rankingSelection.has(item.id)} onchange={() => toggleBatch(rankingSelection, item.id, 'ranking')} />
						<ItemCard {item} />
						<span class="font-pixel min-w-0 flex-1 truncate text-[10px]" title={item.name_cn || item.name}>
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

	<Button class="w-full font-pixel" onclick={goToTier} disabled={!tierData.hasDraft && selected.length === 0}>
		{m.go_to_tier({ count: selected.length })}
	</Button>
	{#if tierData.hasDraft && selected.length > 0}
		<Button variant="outline" class="w-full border-accent bg-accent/20 font-pixel text-foreground hover:bg-accent/35 hover:text-foreground" onclick={startNewSession}>
			{m.new_from_pool({ count: selected.length })}
		</Button>
	{/if}
</div>
