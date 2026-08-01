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

	// 自定义字号（rem）；null = 按字数自动缩放
	let customSize = $state<number | null>(null);
	const autoFont = $derived(
		draftLabel.length <= 2
			? 2
			: draftLabel.length <= 3
				? 1.5
				: draftLabel.length <= 5
					? 1.1
					: 0.85
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

<div class="group mb-2 flex w-full overflow-hidden rounded-xl border shadow-sm">
	<div class="relative flex w-20 shrink-0 items-center justify-center sm:w-24" style="background-color: {color}">
		<input
			type="text"
			value={draftLabel}
			oninput={(e) => (draftLabel = e.currentTarget.value)}
			onkeydown={(e) => {
				if (e.key === 'Enter') e.currentTarget.blur();
			}}
			onblur={commitRename}
			class="w-full bg-transparent text-center font-black text-black outline-none"
			style="font-size: {fontSize};"
			placeholder="?"
		/>
		<Popover>
			<PopoverTrigger class="absolute right-1 top-1 rounded opacity-0 transition-opacity group-hover:opacity-100">
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
									class="h-6 w-6 rounded-full border"
									style="background: {p};"
									aria-label={p}
									onclick={() => onColorChange?.(p)}
								></button>
							{/each}
							<label class="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border">
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
							onclick={() => (customSize = Math.max(0.5, (customSize ?? autoFont) - 0.15))}
						>
							−
						</Button>
						<Button
							variant="outline"
							size="sm"
							class="h-6 w-6 p-0"
							onclick={() => (customSize = (customSize ?? autoFont) + 0.15)}
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
	<div class="relative min-h-28 flex-1 bg-background/60">
		{#if items.length === 0}
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
				<span style="color: var(--drop-here-color);">{m.drop_here()}</span>
			</div>
		{/if}
		<section
			use:dndzone={{ items, flipDurationMs }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
			class="flex flex-wrap content-start gap-2 p-2"
		>
			{#each items as item (item.id)}
				<div animate:flip={{ duration: flipDurationMs }}>
					<ItemCard {item} />
				</div>
			{/each}
		</section>
	</div>
</div>
