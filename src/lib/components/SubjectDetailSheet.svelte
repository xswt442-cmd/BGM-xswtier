<script lang="ts">
	import { Sheet, SheetClose, SheetTitle } from '$lib/components/ui/sheet';
	import { subjectDetail } from '$lib/states/subjectDetail.svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	// 纯浮层：桌面从右侧滑出、窄屏从底部滑出，任何情况下都不参与页面栅格，不挤压主内容。
	let isDesktop = $state(typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);

	const target = $derived(subjectDetail.target);
	const detail = $derived(subjectDetail.detail);

	const primaryName = $derived(target ? (getLocale() === 'zh' && target.name_cn ? target.name_cn : target.name) : '');
	/** 另一种语言的名字放副标题，与主标题不重复时才显示 */
	const secondaryName = $derived.by(() => {
		if (!target) return '';
		const other = getLocale() === 'zh' ? target.name : target.name_cn;
		return other && other !== primaryName ? other : '';
	});

	/** 封面优先大图，列表里带的是 small */
	const cover = $derived(detail?.images?.large ?? detail?.images?.common ?? target?.image ?? '');

	const RATING_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
	const ratingCounts = $derived(RATING_STEPS.map((step) => ({ step, count: detail?.rating?.count?.[step] ?? 0 })));
	const ratingMax = $derived(Math.max(1, ...ratingCounts.map((r) => r.count)));

	const collectionRows = $derived.by(() => {
		const c = detail?.collection;
		if (!c) return [];
		return [
			{ key: 'wish', label: m.detail_wish(), value: c.wish },
			{ key: 'collect', label: m.detail_collect(), value: c.collect },
			{ key: 'doing', label: m.detail_doing(), value: c.doing },
			{ key: 'on_hold', label: m.detail_on_hold(), value: c.on_hold },
			{ key: 'dropped', label: m.detail_dropped(), value: c.dropped },
		];
	});

	function barHeight(count: number) {
		// 给最小值留 2%，避免 0 计数与「很小的值」在视觉上无法区分
		return `${Math.max(2, Math.round((count / ratingMax) * 100))}%`;
	}
</script>

<Sheet
	open={subjectDetail.isOpen}
	onOpenChange={(next) => {
		if (!next) subjectDetail.close();
	}}
	side={isDesktop ? 'right' : 'bottom'}
	contentClass={isDesktop ? 'w-full max-w-md overflow-y-auto' : 'max-h-[85svh] overflow-y-auto rounded-t-xl'}
>
	{#snippet content()}
		{#if target}
			<div class="flex flex-col gap-5">
				<SheetClose class="absolute right-4 top-4 z-10 h-8 w-8" aria-label={m.detail_close()} />

				<!-- 头部：封面 + 主副标题 + 关键数字 -->
				<div class="flex gap-3 pr-8">
					<img
						src={cover}
						alt={primaryName}
						draggable="false"
						class="h-32 w-24 shrink-0 rounded-md border border-border object-cover object-top"
					/>
					<div class="flex min-w-0 flex-1 flex-col gap-1">
						<SheetTitle class="font-pixel text-xs leading-snug">{primaryName}</SheetTitle>
						{#if secondaryName}
							<p class="text-[10px] text-muted-foreground">{secondaryName}</p>
						{/if}
						<p class="text-[10px] text-muted-foreground">
							{[target.platform, target.air_date, target.eps ? m.detail_eps({ count: target.eps }) : '']
								.filter(Boolean)
								.join(' · ')}
						</p>
						<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1">
							{#if target.score !== undefined}
								<div>
									<p class="font-pixel text-sm tabular-nums">{target.score.toFixed(1)}</p>
									<p class="text-[9px] text-muted-foreground">{m.detail_score()}</p>
								</div>
							{/if}
							{#if detail?.rating?.rank}
								<div>
									<p class="font-pixel text-sm tabular-nums">#{detail.rating.rank}</p>
									<p class="text-[9px] text-muted-foreground">{m.detail_rank()}</p>
								</div>
							{/if}
							{#if target.rating_total !== undefined}
								<div>
									<p class="font-pixel text-sm tabular-nums">{target.rating_total}</p>
									<p class="text-[9px] text-muted-foreground">{m.detail_votes()}</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				{#if subjectDetail.loading}
					<p class="font-pixel py-6 text-center text-[10px] text-muted-foreground">
						{m.detail_loading()}
					</p>
				{:else if subjectDetail.failed}
					<p class="py-4 text-center text-[10px] text-muted-foreground" role="status">
						{m.detail_failed()}
					</p>
				{:else if detail}
					<!-- 评分分布 -->
					{#if ratingCounts.some((r) => r.count > 0)}
						<div>
							<p class="font-pixel mb-2 text-[10px]">{m.detail_rating_dist()}</p>
							<div class="flex h-20 items-end gap-1">
								{#each ratingCounts as row (row.step)}
									<div
										class="flex h-full flex-1 flex-col justify-end"
										title={m.detail_rating_bar({ step: row.step, count: row.count })}
									>
										<div
											class="w-full rounded-sm"
											style="height: {barHeight(row.count)}; background: var(--chart-2);"
										></div>
									</div>
								{/each}
							</div>
							<div class="mt-1 flex gap-1">
								{#each RATING_STEPS as step (step)}
									<span class="flex-1 text-center text-[8px] text-muted-foreground tabular-nums">
										{step}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- 收藏统计 -->
					{#if collectionRows.length > 0}
						<div>
							<p class="font-pixel mb-2 text-[10px]">{m.detail_collection()}</p>
							<ul class="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
								{#each collectionRows as row (row.key)}
									<li class="border-2 border-border bg-background/60 px-2 py-1">
										<p class="font-pixel text-[11px] tabular-nums">{row.value}</p>
										<p class="text-[9px] text-muted-foreground">{row.label}</p>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- 标签 -->
					{#if detail.meta_tags?.length}
						<div class="flex flex-wrap gap-1">
							{#each detail.meta_tags as tag (tag)}
								<span class="rounded-sm bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
									{tag}
								</span>
							{/each}
						</div>
					{/if}

					<!-- 简介 -->
					{#if detail.summary?.trim()}
						<div>
							<p class="font-pixel mb-2 text-[10px]">{m.detail_summary()}</p>
							<p class="whitespace-pre-line text-[11px] leading-relaxed text-muted-foreground">
								{detail.summary.trim()}
							</p>
						</div>
					{/if}
				{/if}

				<a
					href={`https://bgm.tv/subject/${target.bgm_id}`}
					target="_blank"
					rel="noopener noreferrer"
					class="font-pixel mt-auto inline-flex h-9 items-center justify-center rounded-md border-2 border-border text-[10px] transition-colors hover:bg-muted"
				>
					{m.detail_open_on_bgm()}
				</a>
			</div>
		{/if}
	{/snippet}
</Sheet>
