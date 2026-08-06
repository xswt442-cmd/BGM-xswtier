<script lang="ts">
	import { goto } from '$app/navigation';
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { locale } from '$lib/states/locale.svelte';
	import { m } from '$lib/paraglide/messages';

	let open = $state(false);

	// 一键重开：应用独占其 origin，清空全部 localStorage（排名池/档位/草稿/令牌/主题/语言）后回首页，恢复初始状态
	function remake() {
		localStorage.clear();
		locale.reset(); // 内存 locale 同步回默认（英文），否则 clear 后 SPA 内仍显示旧语言
		goto('/');
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
