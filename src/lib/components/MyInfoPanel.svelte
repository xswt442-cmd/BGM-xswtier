<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { apiToken } from '$lib/states/token.svelte';
	import { fetchMe, fetchUserIndexes, fetchUserCollectedIndexes } from '$lib/api/userFetchers.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		onFillUsername,
		onFillIndex,
	}: { onFillUsername: (username: string) => void; onFillIndex: (indexId: number) => void } = $props();

	// username = BGM 登录名（collections/indexes 接口只认这个，如纯数字）；
	// nickname = 显示名（中文昵称，不是 API 标识，仅用于展示）。
	let username = $state<string | null>(null);
	let nickname = $state<string | null>(null);
	let indexes = $state<{ id: number; title: string }[]>([]);
	/** 收藏的目录（年度精选等官方/他人目录）——独立加载，失败只降级本区 */
	let collected = $state<{ id: number; title: string }[]>([]);
	let collectedError = $state(false);
	let loading = $state(false);
	/** /v0/me 整体失败（token 无效等），用户名不可用 */
	let error = $state<string | null>(null);
	/** p1 目录列表加载失败（网络/代理）——用户名仍可用，仅目录区降级提示 */
	let indexesError = $state(false);

	// token 变更时重新读取；用 token 快照做守卫，避免同 token 重复加载
	let loadedToken = $state<string | null>(null);

	$effect(() => {
		const t = apiToken.token;
		if (t === loadedToken) return;
		loadedToken = t;
		void load();
	});

	async function load() {
		if (!apiToken.hasToken) {
			username = null;
			nickname = null;
			indexes = [];
			collected = [];
			collectedError = false;
			error = null;
			indexesError = false;
			loading = false;
			return;
		}
		loading = true;
		error = null;
		indexesError = false;
		let me;
		try {
			me = await fetchMe();
		} catch (e) {
			console.error('[MyInfoPanel] me', e);
		}
		if (!me) {
			// /v0/me 失败（token 无效 / 网络）：整体报错，用户名不可用
			error = m.me_fetch_failed();
			loading = false;
			return;
		}
		username = me.username;
		nickname = me.nickname;
		// 目录列表走 p1 代理，失败不阻断用户名填充，仅目录区降级提示
		try {
			indexes = await fetchUserIndexes(me.username);
		} catch (e) {
			console.error('[MyInfoPanel] indexes', e);
			indexes = [];
			indexesError = true;
		}
		// 收藏的目录（年度精选等）：独立降级，失败不干扰自建目录展示
		collectedError = false;
		try {
			collected = await fetchUserCollectedIndexes(me.username);
		} catch (e) {
			console.error('[MyInfoPanel] collected indexes', e);
			collected = [];
			collectedError = true;
		} finally {
			loading = false;
		}
	}
</script>

{#if apiToken.hasToken}
	<div class="grid gap-1.5 rounded-lg border border-border/70 bg-background/70 p-2 shadow-sm">
		<div class="flex items-center justify-between">
			<span class="font-pixel text-[10px] text-primary">{m.me_my_info()}</span>
			{#if loading}
				<span class="font-pixel animate-pulse text-[9px] text-muted-foreground">{m.me_loading()}</span>
			{/if}
		</div>
		{#if error}
			<p class="text-[10px] text-destructive">{error}</p>
			<div>
				<Button variant="outline" size="sm" class="font-pixel h-7 text-[9px]" onclick={load}>
					{m.me_retry()}
				</Button>
			</div>
		{:else if username && nickname}
			{@const u = username}
			<button
				class="flex w-full items-center gap-1.5 rounded border border-border/60 bg-background/60 px-2 py-1 text-left text-[11px] transition-colors hover:bg-accent/60"
				onclick={() => onFillUsername(u)}
				title={m.me_fill_username()}
			>
				<span class="icon-[pixelarticons--user] h-3.5 w-3.5 shrink-0 text-accent"></span>
				<span class="min-w-0 flex-1 truncate font-medium">{nickname}</span>
				<span class="shrink-0 text-[9px] text-muted-foreground">@{username} · {m.me_fill_username()}</span>
			</button>
			{#if indexesError}
				<p class="text-[10px] text-destructive">{m.me_indexes_failed()}</p>
			{:else if indexes.length > 0}
				<ul class="grid max-h-36 gap-0.5 overflow-y-auto pr-0.5">
					{#each indexes as idx (idx.id)}
						<li>
							<button
								class="flex w-full items-center gap-1.5 rounded border border-border/50 bg-background/50 px-2 py-1 text-left text-[11px] transition-colors hover:bg-accent/60"
								onclick={() => onFillIndex(idx.id)}
								title={idx.title}
							>
								<span class="icon-[pixelarticons--notebook] h-3.5 w-3.5 shrink-0 text-accent"></span>
								<span class="min-w-0 flex-1 truncate">{idx.title}</span>
								<span class="shrink-0 text-[9px] text-muted-foreground">#{idx.id}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-[10px] text-muted-foreground">{m.me_no_indexes()}</p>
			{/if}
			{#if collected.length > 0}
				<p class="font-pixel mt-1 text-[9px] text-muted-foreground">{m.me_collected_indexes()}</p>
				<ul class="grid max-h-36 gap-0.5 overflow-y-auto pr-0.5">
					{#each collected as idx (idx.id)}
						<li>
							<button
								class="flex w-full items-center gap-1.5 rounded border border-border/50 bg-background/50 px-2 py-1 text-left text-[11px] transition-colors hover:bg-accent/60"
								onclick={() => onFillIndex(idx.id)}
								title={idx.title}
							>
								<span class="icon-[pixelarticons--star] h-3.5 w-3.5 shrink-0 text-accent"></span>
								<span class="min-w-0 flex-1 truncate">{idx.title}</span>
								<span class="shrink-0 text-[9px] text-muted-foreground">#{idx.id}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else if collectedError && !indexesError}
				<p class="mt-1 text-[10px] text-destructive">{m.me_indexes_failed()}</p>
			{/if}
		{:else}
			<p class="text-[10px] text-muted-foreground">{m.me_loading()}</p>
		{/if}
	</div>
{/if}
