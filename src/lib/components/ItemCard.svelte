<script lang="ts">
	import type { ItemData } from '$lib/schemas/item';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	let { item, titleMode = 'compact' }: { item: ItemData; titleMode?: 'compact' | 'two-line' } = $props();

	const displayName = $derived(getLocale() === 'zh' && item.name_cn ? item.name_cn : item.name);
	const fallbackImage = 'https://lain.bgm.tv/img/no_icon_subject.png';
	// hover 详情（原生 tooltip，零渲染成本）：评分(人数) · 放送日期 · 类型
	const detailLine = $derived.by(() => {
		const parts: string[] = [];
		if (item.score !== undefined) {
			parts.push(`★ ${item.score.toFixed(1)}${item.rating_total !== undefined ? ` (${item.rating_total})` : ''}`);
		}
		if (item.air_date) parts.push(item.air_date);
		if (item.platform) parts.push(item.platform);
		return parts.join(' · ');
	});
	const cardTitle = $derived(detailLine ? `${displayName}\n${detailLine}` : displayName);
</script>

<!-- 贴纸卡片：像素描边 + 硬投影 + 顶部贴纸评分角标；hover 出现 bgm.tv 外链角标 -->
<div
	class="pixel-border pixel-shadow group relative flex w-20 shrink-0 select-none flex-col overflow-hidden rounded-lg bg-card {titleMode ===
	'two-line'
		? 'h-32'
		: 'h-28'}"
	title={cardTitle}
>
	<div
		class="relative w-full overflow-hidden {titleMode === 'two-line'
			? 'h-[calc(100%-2.5rem)]'
			: 'h-[calc(100%-1.25rem)]'}"
	>
		<img
			src={item.image ?? fallbackImage}
			alt={displayName}
			draggable="false"
			loading="lazy"
			decoding="async"
			fetchpriority="low"
			class="absolute inset-0 h-full w-full object-cover object-top"
		/>
		<a
			href={`https://bgm.tv/subject/${item.bgm_id}`}
			target="_blank"
			rel="noopener noreferrer"
			draggable="false"
			class="absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-sm border border-white/40 bg-black/70 font-mono text-[11px] leading-none text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
			aria-label={m.item_open_bgm({ name: displayName })}
			title={m.item_open_bgm({ name: displayName })}
			data-export-exclude
		>
			↗
		</a>
		{#if item.score !== undefined}
			<span
				class="absolute bottom-1 right-1 min-w-8 border-2 border-white bg-black px-1 py-0.5 text-center font-mono text-[11px] font-black leading-none tracking-normal tabular-nums text-white shadow-sm"
				aria-label={`Score ${item.score}`}
			>
				{item.score.toFixed(1)}
			</span>
		{/if}
	</div>
	<div
		class="flex w-full items-center justify-center overflow-hidden bg-muted {titleMode === 'two-line' ? 'h-10' : 'h-5'}"
	>
		<span
			class="font-pixel px-1 text-center text-[9px] font-bold {titleMode === 'two-line'
				? 'line-clamp-2 leading-4'
				: 'truncate leading-tight'}"
			title={displayName}
		>
			{displayName}
		</span>
	</div>
</div>
