<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';

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

<div class="w-full max-w-md rounded-xl border bg-card p-6 shadow-md">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submitIndex();
		}}
		class="grid gap-2"
	>
		<Label for="index-id">{m.entry_index_label()}</Label>
		<div class="flex gap-2">
			<Input
				id="index-id"
				type="text"
				inputmode="numeric"
				placeholder={m.entry_index_placeholder()}
				bind:value={indexId}
			/>
			<Button type="submit" disabled={isIndexLoading}>
				<span class="icon-[lucide--arrow-right] h-4 w-4"></span>
			</Button>
		</div>
		<a href="https://bgm.tv/index" target="_blank" class="text-xs text-muted-foreground hover:underline">
			{m.index_plaza()}
		</a>
	</form>
	<Separator class="my-4" />
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submitUser();
		}}
		class="grid gap-2"
	>
		<Label for="username">{m.entry_user_label()}</Label>
		<div class="flex gap-2">
			<Input
				id="username"
				type="text"
				placeholder={m.entry_user_placeholder()}
				bind:value={username}
			/>
			<Button type="submit" disabled={isUserLoading}>
				<span class="icon-[lucide--arrow-right] h-4 w-4"></span>
			</Button>
		</div>
		<p class="text-xs text-muted-foreground">{m.username_instruction()}</p>
	</form>
</div>
