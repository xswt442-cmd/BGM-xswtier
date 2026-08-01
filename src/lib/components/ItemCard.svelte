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
				class="absolute bottom-0 right-0 px-1 text-[10px] font-bold text-white"
				style="background: var(--chart-6);"
			>
				★{item.score}
			</span>
		{/if}
	</div>
	<div class="flex h-5 w-full items-center justify-center overflow-hidden bg-muted">
		<span class="truncate px-1 text-[9px] font-bold leading-none" title={displayName}>
			{displayName}
		</span>
	</div>
</div>
