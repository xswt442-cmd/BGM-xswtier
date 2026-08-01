<script lang="ts">
	import Entry from '$lib/components/Entry.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import { m } from '$lib/paraglide/messages';

	let started = $state(false);
</script>

<!-- 整页即一块游戏屏幕：上/下 ==== 双线横贯，内容居中悬浮于主题背景上 -->
<div class="flex min-h-svh flex-col">
	<!-- 顶部 ==== 屏幕边框 -->
	<div class="border-t-4 border-double border-foreground/50"></div>

	<div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-9 px-4 py-10">
		<!-- 盒装像素标题 -->
		<div class="pixel-border neon-border bg-chart-2 px-10 py-4">
			<h1 class="font-pixel neon-text text-xl text-black sm:text-2xl">BGM-XSWTIER</h1>
		</div>

		<!-- 闪烁光标 + 标语 -->
		<p class="font-pixel neon-text text-xs text-foreground sm:text-sm">
			<span class="blink text-accent">▮</span> {m.app_description()}
		</p>

		<!-- 状态栏徽章条（横贯居中） -->
		<div class="pixel-border neon-border w-full max-w-2xl bg-background/60 px-4 py-2.5">
			<StatusBar centered />
		</div>

		<!-- PRESS START / 输入区 -->
		<div class="min-w-0 w-full max-w-2xl text-center">
			{#if !started}
				<button
					onclick={() => (started = true)}
					class="font-pixel neon-text neon-border border-4 border-dashed border-foreground px-10 py-5 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background sm:text-base"
				>
					<span class="blink">▶</span> {m.press_start()}
				</button>
			{:else}
				<div
					class="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-border/70 bg-background/70 p-3 text-left shadow-sm backdrop-blur-[2px] sm:p-4"
				>
					<Entry />
				</div>
			{/if}
		</div>
	</div>

	<!-- 底部 ==== 屏幕边框 -->
	<div class="border-b-4 border-double border-foreground/50"></div>
</div>
