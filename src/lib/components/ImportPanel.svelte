<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import MyInfoPanel from './MyInfoPanel.svelte';
	import ImportPoolPanel from './ImportPoolPanel.svelte';
	import { fetchIndexById } from '$lib/api/indexFetchers.svelte';
	import { fetchUserCollection } from '$lib/api/bgmFetchers.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { importPool, type ImportSource } from '$lib/states/importPool.svelte';
	import type { ItemIdentity } from '$lib/schemas/item';
	let { active = true }: { active?: boolean } = $props();

	let indexId = $state('');
	let username = $state('');
	let loading = $state<'index' | 'user' | null>(null);
	let error = $state<string | null>(null);
	let requestGeneration = 0;

	async function acceptSource(source: ImportSource, identities: ItemIdentity[] | undefined, generation: number) {
		if (generation !== requestGeneration) return;
		if (!identities) {
			error = m.import_source_failed();
			return;
		}
		error = null;
		importPool.replaceSource(source);
		itemLoader.startImport(identities);
		if (identities.length > 0) await itemLoader.loadBatch();
	}

	async function submitIndex() {
		const raw = indexId.trim();
		if (!/^\d+$/.test(raw)) return;
		const generation = ++requestGeneration;
		loading = 'index';
		try {
			await acceptSource({ kind: 'index', id: Number(raw), label: `#${raw}` }, await fetchIndexById(Number(raw)), generation);
		} finally {
			if (generation === requestGeneration) loading = null;
		}
	}

	async function submitUser() {
		const raw = username.trim();
		if (!raw) return;
		const generation = ++requestGeneration;
		loading = 'user';
		try {
			await acceptSource({ kind: 'user', username: raw, label: `@${raw}` }, await fetchUserCollection(raw), generation);
		} finally {
			if (generation === requestGeneration) loading = null;
		}
	}
</script>

<div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
	<MyInfoPanel onFillUsername={(value) => (username = value)} onFillIndex={(value) => (indexId = String(value))} />
	<div class="grid gap-4 sm:grid-cols-2">
		<form onsubmit={(event) => { event.preventDefault(); void submitIndex(); }} class="grid content-start gap-1.5">
			<Label for="index-id" class="font-pixel text-xs">{m.entry_index_label()}</Label>
			<div class="flex min-w-0 gap-2">
				<Input id="index-id" type="text" inputmode="numeric" placeholder={m.entry_index_placeholder()} bind:value={indexId} class="min-w-0 flex-1" />
				<Button type="submit" size="icon" disabled={loading !== null} aria-label={m.submit_index()}><span class="icon-[pixelarticons--arrow-right] h-4 w-4"></span></Button>
			</div>
			<div class="text-right"><a href="https://bgm.tv/index/create" target="_blank" rel="noreferrer" class="font-pixel text-[9px] text-primary hover:underline">{m.entry_index_create_link()} ↗</a></div>
		</form>
		<form onsubmit={(event) => { event.preventDefault(); void submitUser(); }} class="grid content-start gap-1.5">
			<Label for="username" class="font-pixel text-xs">{m.entry_user_label()}</Label>
			<div class="flex min-w-0 gap-2">
				<Input id="username" type="text" placeholder={m.entry_user_placeholder()} bind:value={username} class="min-w-0 flex-1" />
				<Button type="submit" size="icon" disabled={loading !== null} aria-label={m.submit_user()}><span class="icon-[pixelarticons--arrow-right] h-4 w-4"></span></Button>
			</div>
			<div class="text-right"><a href="https://bangumi.tv/login" target="_blank" rel="noreferrer" class="font-pixel text-[9px] text-primary hover:underline">{m.entry_user_hint()} ↗</a></div>
		</form>
	</div>
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
	<Separator />
	{#if importPool.loaded}<ImportPoolPanel {active} />{:else}<p class="font-pixel py-8 text-center text-[10px] text-muted-foreground">{m.import_empty_hint()}</p>{/if}
</div>
