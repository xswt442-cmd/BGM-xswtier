<script lang="ts">
	import type { ItemData } from '$lib/schemas/item';
	import { getLocale } from '$lib/paraglide/runtime';

	let { item, titleMode = 'compact' }: { item: ItemData; titleMode?: 'compact' | 'two-line' } = $props();

	const displayName = $derived(getLocale() === 'zh' && item.name_cn ? item.name_cn : item.name);
	const fallbackImage = 'https://lain.bgm.tv/img/no_icon_subject.png';
</script>

<!-- 贴纸卡片：像素描边 + 硬投影 + 顶部贴纸评分角标 -->
<div
	class="pixel-border pixel-shadow relative flex w-20 shrink-0 select-none flex-col overflow-hidden rounded-lg bg-card {titleMode ===
	'two-line'
		? 'h-32'
		: 'h-28'}"
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
