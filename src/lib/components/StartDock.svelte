<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { searchPool } from '$lib/states/searchPool.svelte';
	import { tierData } from '$lib/states/tierData.svelte';

	let { onViewPool }: { onViewPool: () => void } = $props();
	let dialog: HTMLDialogElement;
	const count = $derived(searchPool.items.length);

	function newSession() {
		if (count === 0) return;
		dialog?.close();
		itemLoader.clear();
		itemLoader.seedLoaded(searchPool.items);
		tierData.startSession(searchPool.items);
		void goto('/tier?source=pool');
	}

	function continueDraft() {
		dialog?.close();
		void goto('/tier?draft=1');
	}

	function goToTier() {
		if (tierData.hasDraft && count > 0) dialog.showModal();
		else if (tierData.hasDraft) continueDraft();
		else newSession();
	}
</script>

<div
	class="sticky bottom-2 z-20 mt-4 flex flex-wrap items-center gap-2 border-2 border-border bg-card/95 p-2 shadow-[4px_4px_0_var(--border)] backdrop-blur-sm"
	data-testid="ranking-pool-dock"
>
	<div class="mr-auto flex min-w-0 items-center gap-2">
		<span class="icon-[pixelarticons--list-box] h-5 w-5 shrink-0 text-primary"></span>
		<span class="font-pixel text-[10px]">{m.ranking_summary({ count })}</span>
	</div>
	<Button variant="outline" size="sm" class="font-pixel text-[9px]" onclick={onViewPool}>{m.view_ranking_pool()}</Button
	>
	<Button size="sm" class="font-pixel text-[9px]" onclick={goToTier} disabled={!tierData.hasDraft && count === 0}
		>{m.go_to_tier({ count })}</Button
	>
</div>

<dialog
	bind:this={dialog}
	class="pixel-border w-[min(92vw,31rem)] bg-card p-0 text-card-foreground backdrop:bg-black/55"
>
	<div class="grid gap-4 p-5">
		<div>
			<h2 class="font-pixel text-sm">{m.start_choice_title()}</h2>
			<p class="mt-2 text-sm text-muted-foreground">{m.start_choice_description()}</p>
		</div>
		<div class="grid gap-2 sm:grid-cols-3">
			<Button variant="outline" class="font-pixel text-[9px]" onclick={continueDraft}>{m.continue_draft()}</Button>
			<Button class="font-pixel text-[9px]" onclick={newSession}>{m.new_from_pool({ count })}</Button>
			<Button variant="secondary" class="font-pixel text-[9px]" onclick={() => dialog.close()}>{m.cancel()}</Button>
		</div>
	</div>
</dialog>
