<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { ItemData } from '$lib/schemas/item';
	import ItemCard from './ItemCard.svelte';
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';

	let {
		items = $bindable([]),
		title = 'A',
		color = 'var(--chart-2)',
		onRename,
		onColorChange,
		onDelete,
		canDelete = true
	}: {
		items: ItemData[];
		title: string;
		color: string;
		onRename?: (label: string) => void;
		onColorChange?: (color: string) => void;
		onDelete?: () => void;
		canDelete?: boolean;
	} = $props();

	let draftLabel = $state('');
	// 仅当 title 变化时同步草稿（用户输入不触发，不会覆盖）
	$effect(() => {
		draftLabel = title;
	});

	// 自定义字号（rem）；null = 按字数自动缩放（像素体字号偏小）
	let customSize = $state<number | null>(null);
	const autoFont = $derived(
		draftLabel.length <= 2 ? 0.9 : draftLabel.length <= 3 ? 0.75 : draftLabel.length <= 5 ? 0.6 : 0.5
	);
	const fontSize = $derived(customSize !== null ? `${customSize}rem` : `${autoFont}rem`);

	const PRESETS = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
		'var(--chart-6)',
		'var(--chart-7)',
		'var(--chart-8)'
	];

	function commitRename() {
		const trimmed = draftLabel.trim();
		if (trimmed && trimmed !== title && onRename) onRename(trimmed);
		if (!trimmed) draftLabel = title;
	}

	const flipDurationMs = 300;
	function handleDndConsider(e: CustomEvent) {
		items = e.detail.items;
	}
	function handleDndFinalize(e: CustomEvent) {
		items = e.detail.items;
	}
</script>

<section class="relative mb-5 rounded-lg">
	<!-- 和纸胶带标签（顶置，替代 legacy 左侧色块列） -->
	<div
		class="washi-tape absolute -top-3 left-3 z-10 flex rotate-[-1.2deg] items-center gap-1"
		style="background-color: {color};"
	>
		<input
			type="text"
			value={draftLabel}
			oninput={(e) => (draftLabel = e.currentTarget.value)}
			onkeydown={(e) => {
				if (e.key === 'Enter') e.currentTarget.blur();
			}}
			onblur={commitRename}
			class="font-pixel min-w-10 bg-transparent text-center font-bold text-black outline-none"
			style="font-size: {fontSize}; line-height: 1.7;"
			placeholder="?"
		/>
		<Popover>
			<PopoverTrigger class="rounded opacity-0 transition-opacity group-hover:opacity-100">
				<Button variant="ghost" size="icon" class="h-5 w-5 text-black">
					<span class="icon-[lucide--settings-2] h-3 w-3"></span>
				</Button>
			</PopoverTrigger>
			{#snippet content()}
				<div class="grid gap-3">
					<div class="grid gap-1.5">
						<span class="text-xs font-semibold">{m.color_scheme()}</span>
						<div class="flex flex-wrap items-center gap-1.5">
							{#each PRESETS as p (p)}
								<button
									type="button"
									class="pixel-border h-6 w-6 rounded-full"
									style="background: {p};"
									aria-label={p}
									onclick={() => onColorChange?.(p)}
								></button>
							{/each}
							<label class="pixel-border relative h-6 w-6 cursor-pointer overflow-hidden rounded-full">
								<input
									type="color"
									class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
									onchange={(e) => onColorChange?.(e.currentTarget.value)}
								/>
							</label>
						</div>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-semibold">{m.font_size()}</span>
						<Button
							variant="outline"
							size="sm"
							class="h-6 w-6 p-0"
							onclick={() => (customSize = Math.max(0.3, (customSize ?? autoFont) - 0.1))}
						>
							−
						</Button>
						<Button
							variant="outline"
							size="sm"
							class="h-6 w-6 p-0"
							onclick={() => (customSize = (customSize ?? autoFont) + 0.1)}
						>
							+
						</Button>
						<Button variant="ghost" size="sm" class="h-6 px-1 text-xs" onclick={() => (customSize = null)}>
							{m.reset()}
						</Button>
					</div>
					{#if canDelete}
						<Button variant="destructive" size="sm" onclick={onDelete}>
							{m.delete_tier()}
						</Button>
					{/if}
				</div>
			{/snippet}
		</Popover>
	</div>

	<!-- 虚线裁剪框 + 贴纸区 -->
	<div class="cut-lines relative min-h-28 rounded-lg bg-card/70">
		{#if items.length === 0}
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
				<span class="text-sm" style="color: var(--drop-here-color);">{m.drop_here()}</span>
			</div>
		{/if}
		<section
			use:dndzone={{ items, flipDurationMs }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
			class="flex flex-wrap content-start gap-2 p-3 pt-4"
		>
			{#each items as item (item.id)}
				<div animate:flip={{ duration: flipDurationMs }} class="sticker-scatter">
					<ItemCard {item} />
				</div>
			{/each}
		</section>
	</div>
</section>
