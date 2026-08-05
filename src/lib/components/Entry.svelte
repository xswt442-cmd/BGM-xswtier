<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import MyInfoPanel from './MyInfoPanel.svelte';
	import IndexPoolPanel from './IndexPoolPanel.svelte';
	import SearchPanel from './SearchPanel.svelte';
	import { fetchIndexById } from '$lib/api/indexFetchers.svelte';
	import { itemLoader } from '$lib/states/itemBatchLoader.svelte';
	import { indexPool } from '$lib/states/indexPool.svelte';

	let indexId = $state('');
	let username = $state('');
	let isIndexLoading = $state(false);
	let isUserLoading = $state(false);

	async function submitIndex() {
		const id = indexId.trim();
		if (!/^\d+$/.test(id)) return;
		isIndexLoading = true;
		try {
			// 加载目录条目进「目录池」（复刻检索池），不直接进 tier；ADD 后才进排名池
			indexPool.clear();
			itemLoader.clear();
			itemLoader.setDestination('indexPool');
			const identities = await fetchIndexById(Number(id));
			if (identities) {
				indexPool.markLoaded();
				if (identities.length > 0) {
					itemLoader.addItems(identities);
					await itemLoader.loadBatch();
				}
			}
		} finally {
			isIndexLoading = false;
		}
	}
	function submitUser() {
		const u = username.trim();
		if (!u) return;
		isUserLoading = true;
		goto(`/tier?user=${encodeURIComponent(u)}`).finally(() => (isUserLoading = false));
	}
</script>

<div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
	<!-- 有 token 时：我的账号 / 自建目录，点击填入下方输入框 -->
	<MyInfoPanel
		onFillUsername={(u) => (username = u)}
		onFillIndex={(id) => (indexId = String(id))}
	/>

	<!-- 搜索功能块整体上移 -->
	<SearchPanel />

	<Separator class="my-1" />
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submitIndex();
		}}
		class="grid gap-1.5"
	>
		<Label for="index-id" class="font-pixel text-xs">{m.entry_index_label()}</Label>
		<div class="flex min-w-0 gap-2">
			<Input
				id="index-id"
				type="text"
				inputmode="numeric"
				placeholder={m.entry_index_placeholder()}
				bind:value={indexId}
				class="min-w-0 flex-1"
			/>
			<Button type="submit" size="icon" disabled={isIndexLoading} aria-label={m.submit_index()}>
				<span class="icon-[pixelarticons--arrow-right] h-4 w-4"></span>
			</Button>
		</div>
		<div class="text-right">
			<a
				href="https://bgm.tv/index/create"
				target="_blank"
				rel="noreferrer"
				class="font-pixel text-[9px] text-primary hover:underline"
			>
				{m.entry_index_create_link()} ↗
			</a>
		</div>
	</form>
	{#if indexPool.loaded}
		<!-- 目录池：输入目录 ID 后加载到这里，ADD 进排名池（复刻检索池） -->
		<IndexPoolPanel />
	{/if}
	<Separator class="my-1" />
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submitUser();
		}}
		class="grid gap-1.5"
	>
		<Label for="username" class="font-pixel text-xs">{m.entry_user_label()}</Label>
		<div class="flex min-w-0 gap-2">
			<Input
				id="username"
				type="text"
				placeholder={m.entry_user_placeholder()}
				bind:value={username}
				class="min-w-0 flex-1"
			/>
			<Button type="submit" size="icon" disabled={isUserLoading} aria-label={m.submit_user()}>
				<span class="icon-[pixelarticons--arrow-right] h-4 w-4"></span>
			</Button>
		</div>
		<!-- 与目录 ID 下方链接一致，右对齐；不知道用户名 → 跳登录页查看主页 -->
		<div class="text-right">
			<a
				href="https://bangumi.tv/login"
				target="_blank"
				rel="noreferrer"
				class="font-pixel text-[9px] text-primary hover:underline"
			>
				{m.entry_user_hint()} ↗
			</a>
		</div>
	</form>
</div>
