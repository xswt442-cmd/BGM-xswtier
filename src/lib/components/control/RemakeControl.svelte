<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';

	let open = $state(false);

	// 一键重开：清空全部本地数据（排名池/档位/草稿/令牌/主题/语言）后重载，恢复初始状态
	function remake() {
		const keys = [
			'bgmtier-search-pool',
			'tierData-v2',
			'bgmtier-draft-v1',
			'bgmtier-token',
			'bgmtier-scheme',
			'bgmtier-vfx',
			'bgmtier-uifb',
			'bgmtier-effects', // 旧版特效键（兼容清理）
			'bgmtier-locale'
		];
		for (const key of keys) localStorage.removeItem(key);
		location.reload();
	}
</script>

<Popover bind:open>
	<PopoverTrigger class="min-h-11 rounded-sm transition-opacity hover:opacity-80 sm:min-h-0">
		<span
			class="font-pixel inline-flex items-center gap-1 whitespace-nowrap border-2 border-border bg-card px-2 py-1.5 text-[10px] leading-none text-foreground sm:px-2.5 sm:text-[11px]"
		>
			<span class="icon-[pixelarticons--reload] h-3.5 w-3.5 shrink-0 text-accent"></span>
			REMAKE
		</span>
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-sm font-semibold">REMAKE</span>
			<p class="text-xs leading-relaxed text-muted-foreground">{m.remake_confirm()}</p>
			<div class="flex items-center justify-end gap-2">
				<Button variant="outline" size="sm" onclick={() => (open = false)}>{m.cancel()}</Button>
				<Button variant="destructive" size="sm" onclick={remake}>{m.remake_confirm_action()}</Button>
			</div>
		</div>
	{/snippet}
</Popover>
