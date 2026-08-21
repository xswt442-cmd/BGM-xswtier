<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import RangeField from '$lib/components/RangeField.svelte';
	import VirtualPoolList from '$lib/components/VirtualPoolList.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { searchSubjects, fetchSeason, fetchToday } from '$lib/api/searchFetchers.svelte';
	import type { SearchParams } from '$lib/api/searchFetchers.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { m } from '$lib/paraglide/messages';
	import { freshById } from '$lib/utils';
	import type { ItemData } from '$lib/schemas/item';
	import { selectAllMutable, toggleMutableSelection } from '$lib/utils/poolPerformance';

	let { active = true }: { active?: boolean } = $props();

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
	const searchSelection = new SvelteSet<string>();

	const hasMore = $derived(mode === 'search' && !searchExhausted);
	const isBusy = $derived(isLoading || isLoadingAll || isAddingAll);
	const isSelected = (id: string) => searchPool.has(id);

	function mergeUnique(base: ItemData[], incoming: ItemData[]): ItemData[] {
		return [...base, ...freshById(base, incoming)];
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
		searchSelection.clear();
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
	async function loadQuick(next: 'season' | 'today') {
		searchSelection.clear();
		mode = next;
		searchExhausted = true;
		hasSearched = true;
		isLoading = true;
		try {
			results = next === 'season' ? await fetchSeason() : await fetchToday();
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
		}
		else searchPool.add(item);
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
	function toggleBatch(id: string) {
		toggleMutableSelection(searchSelection, id);
	}
	function addBatchSelection() {
		searchPool.addAll(results.filter((item) => searchSelection.has(item.id)));
		searchSelection.clear();
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
		<FilterSelect id="search-region" bind:value={region} options={REGION_OPTIONS} />
	</div>

	<!-- ③ 快捷入口 -->
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" class="font-pixel text-[10px]" onclick={() => loadQuick('season')} disabled={isBusy}>
			<span class="icon-[pixelarticons--calendar] mr-1 h-4 w-4"></span>
			{m.season_quick()}
		</Button>
		<Button variant="outline" class="font-pixel text-[10px]" onclick={() => loadQuick('today')} disabled={isBusy}>
			<span class="icon-[pixelarticons--fire] mr-1 h-4 w-4"></span>
			{m.trending_quick()}
		</Button>
	</div>

	<!-- ④ 三组筛选下拉 -->
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
		<div class="grid gap-1">
			<Label for="search-platform" class="font-pixel text-[10px]">{m.filter_platform_label()}</Label>
			<FilterSelect id="search-platform" bind:value={platform} options={PLATFORM_OPTIONS} />
		</div>
		<div class="grid gap-1">
			<Label for="search-source" class="font-pixel text-[10px]">{m.filter_source_label()}</Label>
			<FilterSelect id="search-source" bind:value={source} options={SOURCE_OPTIONS} />
		</div>
		<div class="grid gap-1">
			<Label for="search-type" class="font-pixel text-[10px]">{m.filter_type_label()}</Label>
			<FilterSelect id="search-type" bind:value={type} options={TYPE_OPTIONS} />
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
	<RangeField
		label={m.filter_airdate_label()}
		fromId="air-date-from"
		toId="air-date-to"
		bind:fromValue={airDateFrom}
		bind:toValue={airDateTo}
	/>

	<!-- 评分（0.0–10.0 区间）-->
	<RangeField
		label={m.filter_rating_label()}
		fromId="rating-from"
		toId="rating-to"
		type="number"
		step="0.1"
		fromMin="0"
		fromMax="10"
		toMin="0"
		toMax="10"
		fromPlaceholder={m.rating_from_placeholder()}
		toPlaceholder={m.rating_to_placeholder()}
		bind:fromValue={ratingFrom}
		bind:toValue={ratingTo}
	/>

	<!-- 评分人数（0–99999 区间）-->
	<RangeField
		label={m.filter_rating_count_label()}
		fromId="rating-count-min"
		toId="rating-count-max"
		type="number"
		step="1"
		fromMin="0"
		toMax="99999"
		fromPlaceholder={m.rating_count_min_placeholder()}
		toPlaceholder={m.rating_count_max_placeholder()}
		bind:fromValue={ratingCountMin}
		bind:toValue={ratingCountMax}
	/>

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
					<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => selectAllMutable(searchSelection, results)}>{m.pool_select_all()}</Button>
					<Button variant="ghost" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={() => searchSelection.clear()} disabled={searchSelection.size === 0}>{m.pool_clear_selection()}</Button>
					<Button variant="outline" size="sm" class="font-pixel h-7 px-2 text-[8px]" onclick={addBatchSelection} disabled={searchSelection.size === 0}>{m.pool_add_selected()}</Button>
				</div>
			{/if}
			<VirtualPoolList items={results} {active} testid="search-row" checked={(id) => searchSelection.has(id)} onToggle={toggleBatch} actionVariant={(item) => isSelected(item.id) ? 'secondary' : 'outline'} actionLabel={(item) => isSelected(item.id) ? m.pool_added() : m.pool_add()} onAction={toggleSelect} emptyLabel={m.no_results()} />
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
</div>
