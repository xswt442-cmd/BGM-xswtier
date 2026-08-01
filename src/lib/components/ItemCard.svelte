<script lang="ts">
	import type { ItemData } from '$lib/schemas/item';
	import { getLocale } from '$lib/paraglide/runtime';

	let { item }: { item: ItemData } = $props();

	const displayName = $derived(getLocale() === 'zh' && item.name_cn ? item.name_cn : item.name);
	const fallbackImage = 'https://lain.bgm.tv/img/no_icon_subject.png';
</script>

<div
	class="group/card relative flex h-28 w-20 shrink-0 select-none flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent"
>
	<div class="relative h-[calc(100%-1.25rem)] w-full overflow-hidden bg-muted">
		<img
			src={item.image ?? fallbackImage}
			alt={displayName}
			draggable="false"
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover object-top"
		/>
		{#if item.score !== undefined}
			<span class="absolute bottom-0 right-0 rounded-tl-md bg-black/60 px-1 text-[10px] font-bold text-white">
				★{item.score}
			</span>
		{/if}
	</div>
	<div class="flex h-5 w-full items-center justify-center overflow-hidden bg-card">
		<span class="truncate px-1 text-[9px] font-bold leading-none tracking-tight" title={displayName}>
			{displayName}
		</span>
	</div>
</div>
