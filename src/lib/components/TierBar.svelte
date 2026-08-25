<script lang="ts">
	import { dndzone, dragHandle } from 'svelte-dnd-action';
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { ItemData } from '$lib/schemas/item';
	import ItemCard from './ItemCard.svelte';
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { cleanFinalizedItems } from '$lib/utils/dndItems';
	import { tierData } from '$lib/states/tierData.svelte';

	let {
		items = $bindable([]),
		title = 'A',
		color = 'var(--chart-2)',
		onRename,
		onColorChange,
		onDelete,
		canDelete = true,
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
	let settingsOpen = $state(false);
	// 仅当 title 变化时同步草稿（用户输入不触发，不会覆盖）
	$effect(() => {
		draftLabel = title;
	});

	// 自定义字号（rem）；null = 固定字号，不随字数缩放
	let customSize = $state<number | null>(null);
	const FIXED_FONT = 0.7;
	const fontSize = $derived(customSize !== null ? `${customSize}rem` : `${FIXED_FONT}rem`);
	// 名称框宽度随字数自动右扩（box 伸长）；字号固定不缩小
	const nameWidth = $derived(`${Math.max(5, draftLabel.length * 1.15 + 2)}rem`);

	const PRESETS = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
		'var(--chart-6)',
		'var(--chart-7)',
		'var(--chart-8)',
	];
	// 色板读屏标签：三主题色相一致（红橙黄绿青蓝紫粉），用具名颜色而非 CSS 变量名；
	// 存消息函数引用、模板内调用，语言切换即时生效
	const COLOR_LABELS = [
		m.chart_color_1,
		m.chart_color_2,
		m.chart_color_3,
		m.chart_color_4,
		m.chart_color_5,
		m.chart_color_6,
		m.chart_color_7,
		m.chart_color_8,
	];

	function commitRename() {
		const trimmed = draftLabel.trim();
		if (trimmed && trimmed !== title && onRename) onRename(trimmed);
		if (!trimmed) draftLabel = title;
	}

	const flipDurationMs = 300;
	// svelte-dnd-action 跨容器拖拽：consider/finalize 都直接用原始 items
	// （含 shadow 占位符，渲染时用 data-is-dnd-shadow-item-hint 处理，持久化时过滤）
	function handleDndConsider(e: CustomEvent) {
		tierData.beginHistory('move_item');
		items = e.detail.items;
	}

	async function deleteTier() {
		settingsOpen = false;
		await tick();
		onDelete?.();
	}
	function handleDndFinalize(e: CustomEvent) {
		items = cleanFinalizedItems(e.detail.items);
		tierData.scheduleHistoryCommit();
	}
</script>

<!-- 8-bit 等级块：固定宽度名称框（左、居中文字、固定字号）+ 贴纸区 -->
<section
	class="group neon-border pixel-border pixel-shadow mb-3 overflow-hidden rounded-lg bg-card"
	data-testid="tier-zone"
>
	<div class="flex flex-wrap items-center gap-2 p-2">
		<button
			use:dragHandle
			type="button"
			aria-label={m.tier_drag_handle()}
			data-testid="tier-drag-handle"
			class="group/tdh relative inline-flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing sm:h-6 sm:w-6"
			data-export-exclude
		>
			<span class="icon-[pixelarticons--move] h-4 w-4 sm:h-3.5 sm:w-3.5"></span>
			<span
				class="font-pixel pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 -translate-y-1/2 whitespace-nowrap rounded-sm border border-border bg-background px-1.5 py-1 text-[9px] leading-none text-foreground opacity-0 shadow-sm transition-opacity group-hover/tdh:opacity-100"
			>
				{m.tier_drag_handle()}
			</span>
		</button>
		<div
			class="relative flex items-center justify-center rounded-md px-3 py-1.5"
			style="background-color: {color}; width: {nameWidth};"
		>
			<input
				type="text"
				value={draftLabel}
				oninput={(e) => (draftLabel = e.currentTarget.value)}
				onkeydown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur();
				}}
				onblur={commitRename}
				class="font-pixel w-full bg-transparent text-center font-bold text-black outline-none"
				style="font-size: {fontSize}; line-height: 1.8;"
				placeholder="?"
				data-testid="tier-label-input"
			/>
		</div>
		<div class="ml-auto flex items-center" data-export-exclude>
			<Popover bind:open={settingsOpen}>
				<PopoverTrigger
					class="inline-flex h-11 w-11 items-center justify-center rounded text-muted-foreground opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
					aria-label={m.tier_settings()}
				>
					<span class="icon-[pixelarticons--settings-2] h-4 w-4 sm:h-3.5 sm:w-3.5"></span>
				</PopoverTrigger>
				{#snippet content()}
					<div class="grid gap-3">
						<div class="grid gap-1.5">
							<span class="text-xs font-semibold">{m.color_scheme()}</span>
							<div class="flex flex-wrap items-center gap-1.5">
								{#each PRESETS as p, i (p)}
									<button
										type="button"
										class="pixel-border h-6 w-6 rounded-full"
										style="background: {p};"
										aria-label={COLOR_LABELS[i]()}
										title={COLOR_LABELS[i]()}
										onclick={() => onColorChange?.(p)}
									></button>
								{/each}
								<label class="pixel-border relative h-6 w-6 cursor-pointer overflow-hidden rounded-full">
									<input
										type="color"
										class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
										aria-label={m.custom_color()}
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
								onclick={() => (customSize = Math.max(0.3, (customSize ?? FIXED_FONT) - 0.1))}
							>
								−
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="h-6 w-6 p-0"
								onclick={() => (customSize = (customSize ?? FIXED_FONT) + 0.1)}
							>
								+
							</Button>
							<Button variant="ghost" size="sm" class="h-6 px-1 text-xs" onclick={() => (customSize = null)}>
								{m.reset()}
							</Button>
						</div>
						{#if canDelete}
							<Button variant="destructive" size="sm" onclick={deleteTier}>
								{m.delete_tier()}
							</Button>
						{/if}
					</div>
				{/snippet}
			</Popover>
		</div>
	</div>

	<div class="relative min-h-16">
		{#if items.length === 0}
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
				<span class="font-pixel text-[10px]" style="color: var(--drop-here-color);">
					{m.drop_here()}
				</span>
			</div>
		{/if}
		<section
			use:dndzone={{ items, flipDurationMs, useCursorForDetection: true, delayTouchStart: true }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
			aria-label={title}
			class="flex min-h-16 flex-wrap content-start gap-2 p-2 pt-1"
		>
			{#each items as item (item.id)}
				<div
					animate:flip={{ duration: flipDurationMs }}
					data-is-dnd-shadow-item-hint={item.isDndShadowItem}
					data-item-id={item.id}
					aria-label={item.name_cn || item.name || ''}
				>
					<ItemCard {item} />
				</div>
			{/each}
		</section>
	</div>
</section>
