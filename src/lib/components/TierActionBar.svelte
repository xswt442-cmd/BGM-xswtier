<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
	} from '$lib/components/ui/dropdown-menu';
	import { tierData } from '$lib/states/tierData.svelte';
	import { m } from '$lib/paraglide/messages';
	import { referenceRangeText, referenceTrendline } from '$lib/utils/scoreRefs';
	import type { ThresholdPreset } from '$lib/utils/autoDistribute';
	import type { TierHistoryAction } from '$lib/utils/tierHistory';
	import {
		countAffectedTiers,
		TIER_SORT_KEYS,
		DEFAULT_SORT_DIRECTION,
		type TierSortKey,
	} from '$lib/utils/sortTierItems';

	/**
	 * 榜单操作栏：品味画像 / 档内排序 / 自动分档 / 撤销 / 重做。
	 *
	 * 全是作用于榜单本身的动作，与"会话进出"（TierToolbar）是两件事，所以独立成组件。
	 * 排序与自动分档在此自行实现并播报；撤销/重做由页面传入——
	 * 同一对动作还挂在键盘快捷键上，只能有一个实现。
	 */
	let {
		isExporting,
		onStatus,
		onUndo,
		onRedo,
	}: {
		isExporting: boolean;
		onStatus: (message: string) => void;
		onUndo: () => TierHistoryAction | null;
		onRedo: () => TierHistoryAction | null;
	} = $props();

	/** 画像与档内排序只在榜单里真有条目时才有意义 */
	const anyTierItems = $derived(tierData.tiers.some((tier) => tier.items.length > 0));
	/** 有未排名条目才谈得上预分档 */
	const canDistribute = $derived(tierData.collection.length > 0);
	/** 阈值预设是 4 个分界（5 档）的口径，档位数不符时该项无意义，置灰 */
	const thresholdsUsable = $derived(tierData.tiers.length === 5);
	/**
	 * 评分阈值菜单的参照线：由首档现况反推（首档是用户亲手划的，就是他自己心里的标准）。
	 * 首档标签是用户可改的，文案里带出来才能让人一眼认出参照的是哪一档。
	 */
	const topTierLabel = $derived(tierData.tiers[0]?.label ?? '');
	const thresholdRef = $derived(referenceTrendline(tierData.tiers[0]?.items ?? []));

	const SORT_LABELS: Record<TierSortKey, () => string> = {
		score: m.sort_by_score,
		rating_total: m.sort_by_rating_total,
		air_date: m.sort_by_air_date,
		name: m.sort_by_name,
	};

	/** 档位内重排（不跨档移动），单事务可撤销；无变化时明确告知，避免"点了没反应" */
	function sortTierItems(key: TierSortKey) {
		const affected = countAffectedTiers(tierData.tiers, key, DEFAULT_SORT_DIRECTION[key]);
		if (affected === 0) {
			onStatus(m.sort_no_change());
			return;
		}
		tierData.sortTierItems(key);
		onStatus(m.sort_done({ sort: SORT_LABELS[key](), count: affected }));
	}

	/**
	 * 未排名条目预分档（单事务可撤销），完成后播报结果。
	 * 不传 preset 走「按条数均分」，传 preset 走「按评分阈值」。
	 * 播报带上参照线快照：榜单被改过之后回头听播报，才知道当时是拿什么当标准的。
	 */
	function autoDistribute(preset?: ThresholdPreset) {
		const ref = thresholdRef ? referenceRangeText(thresholdRef) : '';
		tierData.autoDistribute(preset);
		onStatus(ref ? m.auto_distribute_done_ref({ range: ref }) : m.auto_distribute_done());
	}
</script>

<div class="ml-auto flex items-center gap-1" data-export-exclude>
	<Button
		variant="outline"
		size="icon"
		class="h-9 w-9"
		onclick={() => goto('/profile')}
		disabled={!anyTierItems}
		aria-label={m.taste_profile()}
		title={m.taste_profile()}
		data-testid="taste-profile-button"
	>
		<span class="icon-[pixelarticons--chart] h-4 w-4"></span>
	</Button>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					class="h-9 w-9"
					disabled={!anyTierItems || isExporting}
					aria-label={m.sort_tier_items()}
					title={m.sort_tier_items()}
					data-testid="sort-tier-button"
					{...props}
				>
					<span class="icon-[pixelarticons--arrows-vertical] h-4 w-4"></span>
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		{#snippet content()}
			<DropdownMenuLabel>{m.sort_tier_items()}</DropdownMenuLabel>
			<DropdownMenuSeparator />
			{#each TIER_SORT_KEYS as key (key)}
				<DropdownMenuItem onSelect={() => sortTierItems(key)}>
					{SORT_LABELS[key]()}
				</DropdownMenuItem>
			{/each}
		{/snippet}
	</DropdownMenu>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					class="h-9 w-9"
					disabled={!canDistribute || isExporting}
					aria-label={m.auto_distribute()}
					title={m.auto_distribute()}
					data-testid="auto-distribute-button"
					{...props}
				>
					<span class="icon-[pixelarticons--sort] h-4 w-4"></span>
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		{#snippet content()}
			<DropdownMenuLabel>{m.auto_distribute()}</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuItem onSelect={() => autoDistribute()}>
				{m.auto_distribute_even()}
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			{#if thresholdsUsable}
				<DropdownMenuLabel class="font-normal opacity-70">
					{#if thresholdRef}
						{m.auto_distribute_ref({ tier: topTierLabel, range: referenceRangeText(thresholdRef) })}
					{:else}
						{m.auto_distribute_ref_unknown()}
					{/if}
				</DropdownMenuLabel>
				<DropdownMenuItem onSelect={() => autoDistribute('strict')}>
					{m.auto_distribute_strict()}
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => autoDistribute('standard')}>
					{m.auto_distribute_standard()}
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => autoDistribute('loose')}>
					{m.auto_distribute_loose()}
				</DropdownMenuItem>
			{:else}
				<DropdownMenuItem disabled>{m.auto_distribute_need_five()}</DropdownMenuItem>
			{/if}
		{/snippet}
	</DropdownMenu>
	<Button
		variant="outline"
		size="icon"
		class="h-9 w-9"
		onclick={onUndo}
		disabled={!tierData.canUndo}
		aria-label={m.undo_available({ count: tierData.undoDepth })}
		title={m.undo_available({ count: tierData.undoDepth })}
		data-testid="undo-button"
	>
		<span class="icon-[pixelarticons--undo] h-4 w-4"></span>
	</Button>
	<Button
		variant="outline"
		size="icon"
		class="h-9 w-9"
		onclick={onRedo}
		disabled={!tierData.canRedo}
		aria-label={m.redo_available({ count: tierData.redoDepth })}
		title={m.redo_available({ count: tierData.redoDepth })}
		data-testid="redo-button"
	>
		<span class="icon-[pixelarticons--redo] h-4 w-4"></span>
	</Button>
</div>
