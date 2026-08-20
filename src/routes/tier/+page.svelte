<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dragHandleZone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import TierBar from '$lib/components/TierBar.svelte';
	import ItemList from '$lib/components/ItemList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetClose, SheetTitle } from '$lib/components/ui/sheet';
	import { tierData } from '$lib/states/tierData.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { sidebar } from '$lib/states/sidebar.svelte';
	import { fetchIndexById } from '$lib/api/indexFetchers.svelte';
	import { fetchUserCollection } from '$lib/api/bgmFetchers.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { TierHistoryAction } from '$lib/utils/tierHistory';
	import { toPng } from 'html-to-image';
	import { encodeURL, decodeURL, exportJSON, importJSON, URL_MAX_LENGTH, SHARE_HASH_PREFIX } from '$lib/utils/tierSerialize';

	let exportNode: HTMLElement;
	let statusMessage = $state('');
	let isExporting = $state(false);
	let exitDialog: HTMLDialogElement;
	let copied = $state(false);
	let shareWarning = $state('');
	let importing = $state(false);
	let importInput: HTMLInputElement | undefined = $state();
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	function allSessionItems() {
		return [
			...tierData.tiers.flatMap((tier) => tier.items),
			...tierData.collection
		];
	}

	/** 会话是否包含任何条目（控制分享/导出按钮可用性） */
	const hasSessionItems = $derived(tierData.tiers.some((t) => t.items.length > 0) || tierData.collection.length > 0);

	// 档位本身可拖拽排序：dragHandleZone 用独立 type 'tier'，与条目拖拽（默认 type）互不干扰。
	// consider/finalize 直接取 e.detail.items（含 shadow 占位档），finalize 时过滤幽灵档。
	function handleTierConsider(e: CustomEvent) {
		tierData.beginHistory('reorder_tier');
		tierData.tiers = e.detail.items;
	}
	function handleTierFinalize(e: CustomEvent) {
		tierData.tiers = e.detail.items.filter(
			(t: Record<string, any>) => !t.isDndShadowItem && t.id !== SHADOW_PLACEHOLDER_ITEM_ID
		);
		tierData.scheduleHistoryCommit();
	}

	function historyActionLabel(action: TierHistoryAction) {
		return {
			move_item: m.history_move_item(),
			reorder_tier: m.history_reorder_tier(),
			add_tier: m.history_add_tier(),
			delete_tier: m.history_delete_tier(),
			rename_tier: m.history_rename_tier(),
			recolor_tier: m.history_recolor_tier()
		}[action];
	}

	function undo() {
		const action = tierData.undo();
		if (action) statusMessage = m.undo_success({ action: historyActionLabel(action) });
		return action;
	}

	function redo() {
		const action = tierData.redo();
		if (action) statusMessage = m.redo_success({ action: historyActionLabel(action) });
		return action;
	}

	function isEditableTarget(target: EventTarget | null) {
		return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
	}

	function handleHistoryShortcut(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.altKey || isEditableTarget(event.target)) return;
		if (document.querySelector('dialog[open]')) return;

		const key = event.key.toLowerCase();
		const isUndo = key === 'z' && !event.shiftKey;
		const isRedo = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey && !event.metaKey);
		const action = isUndo ? undo() : isRedo ? redo() : null;
		if (action) event.preventDefault();
	}

	/** 复制分享链接：序列化 → 写 hash（replaceState 不留历史）→ 剪贴板，超长给警告 */
	function copyShareLink() {
		if (!hasSessionItems) return;
		try {
			const encoded = encodeURL(tierData.snapshot());
			const url = `${window.location.pathname}#${SHARE_HASH_PREFIX}${encoded}`;
			replaceState(url, {});
			shareWarning = url.length > URL_MAX_LENGTH ? m.share_url_too_long({ length: url.length }) : '';
			navigator.clipboard.writeText(url).then(
				() => {
					copied = true;
					statusMessage = m.share_tier();
					clearTimeout(copyTimer);
					copyTimer = setTimeout(() => (copied = false), 1500);
				},
				() => {
					statusMessage = m.share_failed();
				}
			);
		} catch {
			statusMessage = m.share_failed();
		}
	}

	/** 导出完整会话为 JSON 文件（备份/迁移） */
	function exportTierJson() {
		if (!hasSessionItems) return;
		try {
			const json = exportJSON(tierData.snapshot());
			const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
			const a = document.createElement('a');
			a.href = url;
			a.download = `bgm-xswtier-tier-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
			statusMessage = m.export_json_success();
		} catch {
			statusMessage = m.export_json_failed();
		}
	}

	/** 从 JSON 文件恢复会话：校验通过才 loadStore，失败只提示不动状态 */
	function onImportFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		importing = true;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const result = importJSON(String(reader.result ?? ''));
				if (result.ok) {
					tierData.loadStore(result.store);
					itemLoader.clear();
					itemLoader.seedLoaded(allSessionItems());
					// 导入的会话以本地持久化为主，清掉分享 hash，避免刷新时被旧分享覆盖
					replaceState(window.location.pathname + window.location.search, {});
					statusMessage = m.import_success();
				} else if (result.reason === 'empty') {
					statusMessage = m.import_empty();
				} else {
					statusMessage = m.import_failed();
				}
			} finally {
				importing = false;
				input.value = '';
			}
		};
		reader.onerror = () => {
			importing = false;
			statusMessage = m.import_failed();
			input.value = '';
		};
		reader.readAsText(file);
	}

	// 清理复制反馈计时器，避免页面卸载后仍触发状态更新
	onDestroy(() => clearTimeout(copyTimer));
	onMount(() => {
		window.addEventListener('keydown', handleHistoryShortcut);
		return () => window.removeEventListener('keydown', handleHistoryShortcut);
	});

	function saveDraft(exit = false) {
		tierData.saveDraft();
		statusMessage = m.draft_saved();
		if (exit) goto('/');
	}

	function clearAndExit() {
		// 清空 tier 会话（档位/集合/草稿），但保留排名池——回到首页仍能看到，重新去 tier 即重排
		exitDialog.close();
		tierData.clearSessionAndDraft();
		itemLoader.clear();
		sidebar.open = false;
		goto('/');
	}

	function saveAndExit() {
		exitDialog.close();
		saveDraft(true);
	}

	function exportFilename() {
		const stamp = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');
		return `bgm-xswtier-${stamp}.png`;
	}

	async function exportPng() {
		if (!exportNode || isExporting) return;
		isExporting = true;
		statusMessage = m.exporting_png();
		try {
			await document.fonts.ready;
			const dataUrl = await toPng(exportNode, {
				pixelRatio: 2,
				cacheBust: true,
				skipFonts: true,
				backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
				filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-export-exclude'))
			});
			const link = document.createElement('a');
			link.download = exportFilename();
			link.href = dataUrl;
			link.click();
			statusMessage = m.export_png_success();
		} catch (error) {
			console.error('[Tier export] Failed', error);
			statusMessage = m.export_png_failed();
		} finally {
			isExporting = false;
		}
	}

	// 首次进入：读 URL 参数 → 加载条目 → 分批入队
	onMount(async () => {
		const isDraft = page.url.searchParams.get('draft') === '1';
		const index = Number(page.url.searchParams.get('index'));
		const user = page.url.searchParams.get('user');
		const source = page.url.searchParams.get('source'); // pool（首页已 seed 进 loadedItems）
		if (isDraft) {
			if (!tierData.restoreDraft()) {
				goto('/');
				return;
			}
			itemLoader.clear();
			itemLoader.seedLoaded(allSessionItems());
			return;
		}
		// 分享链接恢复：hash 优先于 index/user/source（payload 自带渲染数据，无需 API 反查）
		const hash = window.location.hash;
		const shared = hash ? decodeURL(hash) : null;
		if (shared) {
			tierData.loadStore(shared);
			itemLoader.clear();
			itemLoader.seedLoaded(allSessionItems());
			return;
		}
		if (!index && !user && !source) {
			goto('/');
			return;
		}
		// 搜索/本季/热门入口：条目已由首页 seed 进 itemLoader.loadedItems，无需 clear/fetch
		if (source) {
			// 首页已原子初始化；刷新时沿用自动持久化的当前会话。
			if (itemLoader.loadedItems.length === 0 && allSessionItems().length === 0) goto('/');
			return;
		}
		itemLoader.clear();
		tierData.startSession([]);
		let identities;
		if (index) {
			identities = await fetchIndexById(index);
		} else if (user) {
			identities = await fetchUserCollection(user);
		}
		if (!identities || identities.length === 0) return;
		itemLoader.addItems(identities);
		await itemLoader.loadBatch();
	});
</script>

<div class="mx-auto grid min-h-svh w-full max-w-7xl xl:grid-cols-[minmax(0,1fr)_340px]">
	<main class="p-4 pt-6 pb-32 xl:pb-4">
		<div class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3" data-export-exclude>
			<Button variant="outline" class="font-pixel h-11 text-[10px] sm:h-9" onclick={() => saveDraft(false)}>
				{m.save_draft()}
			</Button>
			<Button class="font-pixel h-11 text-[10px] text-black hover:opacity-85 sm:h-9" style="background-color: var(--chart-3)" onclick={copyShareLink} disabled={!hasSessionItems}>
				{copied ? m.share_copied() : m.share_tier()}
			</Button>
			<Button class="font-pixel h-11 bg-accent text-[10px] text-accent-foreground hover:bg-accent/85 sm:h-9" onclick={() => exitDialog.showModal()}>
				{m.exit_tier()}
			</Button>
			<Button class="font-pixel h-11 text-[10px] text-black hover:opacity-85 sm:h-9" style="background-color: var(--chart-4)" onclick={() => importInput?.click()} disabled={importing}>
				{importing ? m.importing() : m.import_tier()}
			</Button>
			<Button class="font-pixel h-11 text-[10px] text-black hover:opacity-85 sm:h-9" style="background-color: var(--chart-5)" onclick={exportTierJson} disabled={!hasSessionItems}>
				{m.export_tier()}
			</Button>
			<Button class="font-pixel h-11 text-[10px] sm:h-9" onclick={exportPng} disabled={isExporting}>
				{isExporting ? m.exporting_png() : m.save_png()}
			</Button>
		</div>
		{#if shareWarning}
			<p class="font-pixel mb-1 text-[10px] text-destructive">{shareWarning}</p>
		{/if}
		<input bind:this={importInput} type="file" accept="application/json,.json" class="hidden" onchange={onImportFile} />
		<p class="sr-only" aria-live="polite">{statusMessage}</p>
		<div bind:this={exportNode} class="rounded-lg bg-background p-1">
		<div class="mb-6 flex items-center gap-2">
			<span class="icon-[pixelarticons--notebook] h-5 w-5 text-accent"></span>
			<span
				class="neon-text font-pixel rounded-md px-2.5 py-1 text-xs text-black"
				style="background: var(--chart-2);"
			>
				TIER LIST
			</span>
			<div class="ml-auto flex items-center gap-1" data-export-exclude>
				<Button
					variant="outline"
					size="icon"
					class="h-9 w-9"
					onclick={undo}
					disabled={!tierData.canUndo}
					aria-label={m.undo_available({ count: tierData.undoDepth })}
					title={m.undo_available({ count: tierData.undoDepth })}
				>
					<span class="icon-[pixelarticons--undo] h-4 w-4"></span>
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-9 w-9"
					onclick={redo}
					disabled={!tierData.canRedo}
					aria-label={m.redo_available({ count: tierData.redoDepth })}
					title={m.redo_available({ count: tierData.redoDepth })}
				>
					<span class="icon-[pixelarticons--redo] h-4 w-4"></span>
				</Button>
			</div>
		</div>
		<section
			use:dragHandleZone={{
				items: tierData.tiers,
				type: 'tier',
				flipDurationMs: 300,
				delayTouchStart: true
			}}
			onconsider={handleTierConsider}
			onfinalize={handleTierFinalize}
			aria-label={m.tier_reorder_zone()}
			class="flex flex-col"
		>
			{#each tierData.tiers as tier (tier.id)}
				<div
					animate:flip={{ duration: 300 }}
					data-is-dnd-shadow-item-hint={tier.id === SHADOW_PLACEHOLDER_ITEM_ID}
				>
					{#if tier.id === SHADOW_PLACEHOLDER_ITEM_ID}
						<div
							class="mb-3 rounded-lg border-2 border-dashed border-border bg-card/50"
							style="min-height: 5rem"
						></div>
					{:else}
						<TierBar
							bind:items={tier.items}
							title={tier.label}
							color={tier.color}
							onRename={(label) => tierData.renameTier(tier.id, label)}
							onColorChange={(color) => tierData.recolorTier(tier.id, color)}
							onDelete={() => tierData.removeTier(tier.id)}
							canDelete={tierData.tiers.length > 1}
						/>
					{/if}
				</div>
			{/each}
		</section>
		</div>
		<Button variant="outline" class="w-full" onclick={() => tierData.addTier()} data-export-exclude>
			<span class="icon-[pixelarticons--plus] mr-1 h-4 w-4"></span>
			{m.add_tier()}
		</Button>
	</main>

	<aside class="hidden xl:block">
		<div class="sticky top-14 h-[calc(100svh-3.5rem)] border-l">
			<ItemList bind:items={tierData.collection} onLoadMore={() => itemLoader.loadBatch()} />
		</div>
	</aside>
</div>

<!-- 移动/平板：集合面板作为底部抽屉 -->
<Sheet bind:open={sidebar.open} side="bottom" class="xl:hidden">
	{#snippet content()}
		<SheetTitle class="sr-only">{m.unranked()}</SheetTitle>
		<SheetClose class="right-6 top-6 z-10 h-11 w-11" aria-label={m.close_collection()} />
		<div class="h-[60svh]">
			<ItemList bind:items={tierData.collection} onLoadMore={() => itemLoader.loadBatch()} />
		</div>
	{/snippet}
</Sheet>

<dialog
	bind:this={exitDialog}
	aria-labelledby="exit-dialog-title"
	class="pixel-border pixel-shadow m-auto w-[min(28rem,calc(100%-2rem))] bg-card p-0 text-foreground backdrop:bg-black/55"
	onclick={(event) => {
		if (event.target === exitDialog) exitDialog.close();
	}}
>
	<div class="grid gap-4 p-5">
		<h2 id="exit-dialog-title" class="font-pixel text-sm">{m.exit_dialog_title()}</h2>
		<p class="text-sm text-muted-foreground">{m.exit_dialog_description()}</p>
		<div class="grid gap-2 sm:grid-cols-3">
			<Button variant="outline" class="font-pixel h-11 text-[9px]" onclick={saveAndExit}>{m.save_draft_exit()}</Button>
			<Button variant="destructive" class="font-pixel h-11 text-[9px]" onclick={clearAndExit}>{m.clear_exit()}</Button>
			<Button variant="secondary" class="font-pixel h-11 border border-border bg-secondary text-[9px] hover:bg-secondary/75" onclick={() => exitDialog.close()}>{m.cancel()}</Button>
		</div>
	</div>
</dialog>
