<script lang="ts">
	import ItemCard from '$lib/components/ItemCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	// 检索池 / 排名池单行：复选框 + 卡片 + 名称 + 操作按钮。
	let {
		item,
		checked,
		onToggle,
		actionLabel,
		actionVariant = 'outline',
		onAction,
		testid,
	}: {
		item: ItemData;
		checked: boolean;
		onToggle: () => void;
		actionLabel: string;
		actionVariant?: 'outline' | 'secondary' | 'destructive';
		onAction: () => void;
		testid: string;
	} = $props();
</script>

<div
	class="pixel-border flex h-32 min-w-0 items-center gap-2 bg-card/70 p-1.5"
	data-testid={testid}
	data-platform={item.platform}
>
	<input
		type="checkbox"
		class="h-4 w-4 shrink-0 accent-primary"
		aria-label={m.pool_select_item({ name: item.name_cn || item.name })}
		{checked}
		onchange={onToggle}
	/>
	<ItemCard {item} />
	<span class="font-pixel min-w-0 flex-1 truncate text-[10px]" title={item.name_cn || item.name}>
		{item.name_cn || item.name}
	</span>
	<Button variant={actionVariant} size="sm" class="font-pixel text-[10px]" onclick={onAction}>
		{actionLabel}
	</Button>
</div>
