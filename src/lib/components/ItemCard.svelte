<script lang="ts">
	import type { ItemData } from '$lib/schemas/item';
	import { getLocale } from '$lib/paraglide/runtime';

	let { item }: { item: ItemData } = $props();

	const displayName = $derived(getLocale() === 'zh' && item.name_cn ? item.name_cn : item.name);
	const fallbackImage = 'https://lain.bgm.tv/img/no_icon_subject.png';
</script>

<!-- 贴纸卡片：像素描边 + 硬投影 + 顶部贴纸评分角标 -->
<div
	class="pixel-border pixel-shadow relative flex h-28 w-20 shrink-0 select-none flex-col overflow-hidden rounded-lg bg-card"
>
	<div class="relative h-[calc(100%-1.25rem)] w-full overflow-hidden">
		<img
			src={item.image ?? fallbackImage}
			alt={displayName}
			draggable="false"
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover object-top"
		/>
			{#if item.score !== undefined}
				<span
					class="font-pixel absolute bottom-1 right-1 min-w-7 border border-white/70 bg-black/85 px-1 py-1 text-center text-[8px] leading-none tabular-nums text-white shadow-sm"
					aria-label={`Score ${item.score}`}
				>
					{item.score.toFixed(1)}
				</span>
		{/if}
	</div>
	<div class="flex h-5 w-full items-center justify-center overflow-hidden bg-muted">
		<span class="font-pixel truncate px-1 text-[9px] font-bold leading-none" title={displayName}>
			{displayName}
		</span>
	</div>
</div>
