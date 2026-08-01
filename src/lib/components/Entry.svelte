<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import SearchPanel from './SearchPanel.svelte';

	let indexId = $state('');
	let username = $state('');
	let isIndexLoading = $state(false);
	let isUserLoading = $state(false);

	function submitIndex() {
		const id = indexId.trim();
		if (!/^\d+$/.test(id)) return;
		isIndexLoading = true;
		goto(`/tier?index=${id}`).finally(() => (isIndexLoading = false));
	}
	function submitUser() {
		const u = username.trim();
		if (!u) return;
		isUserLoading = true;
		goto(`/tier?user=${encodeURIComponent(u)}`).finally(() => (isUserLoading = false));
	}
</script>

<div class="grid gap-5">
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
		<div class="flex gap-2">
			<Input
				id="index-id"
				type="text"
				inputmode="numeric"
				placeholder={m.entry_index_placeholder()}
				bind:value={indexId}
			/>
			<Button type="submit" size="icon" disabled={isIndexLoading}>
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
	<Separator class="my-1" />
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submitUser();
		}}
		class="grid gap-1.5"
	>
		<Label for="username" class="font-pixel text-xs">{m.entry_user_label()}</Label>
		<div class="flex gap-2">
			<Input
				id="username"
				type="text"
				placeholder={m.entry_user_placeholder()}
				bind:value={username}
			/>
			<Button type="submit" size="icon" disabled={isUserLoading}>
				<span class="icon-[pixelarticons--arrow-right] h-4 w-4"></span>
			</Button>
		</div>
		<!-- 与目录 ID 下方链接一致，右对齐 -->
		<p class="font-pixel text-right text-[9px] text-muted-foreground">{m.entry_user_hint()}</p>
	</form>
</div>
