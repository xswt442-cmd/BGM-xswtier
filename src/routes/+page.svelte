<script lang="ts">
	import Entry from '$lib/components/Entry.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import { m } from '$lib/paraglide/messages';

	let started = $state(false);
</script>

<div class="flex min-h-svh items-center justify-center px-4 py-10">
	<div class="w-full max-w-md">
		<!-- 顶部 ==== 装饰线 -->
		<div class="border-t-4 border-double border-border"></div>

		<!-- 开机屏主体 -->
		<div class="pixel-border border-t-0 bg-card px-6 py-8 text-center">
			<!-- 盒装像素标题 -->
			<div class="pixel-border inline-block bg-chart-2 px-6 py-3">
				<h1 class="font-pixel text-lg text-black sm:text-xl">BGM-XSWTIER</h1>
			</div>

			<!-- 闪烁光标 + 标语 -->
			<p class="mt-4 font-pixel text-[9px] text-muted-foreground">
				<span class="blink">▮</span> {m.app_description()}
			</p>

			<!-- 状态栏徽章条 -->
			<div class="pixel-border mt-6 bg-background/40 px-3 py-2">
				<StatusBar />
			</div>

			<!-- PRESS START / 输入区 -->
			<div class="mt-8">
				{#if !started}
					<button
						onclick={() => (started = true)}
						class="font-pixel border-2 border-dashed border-foreground px-6 py-4 text-[10px] text-foreground transition-colors hover:bg-foreground hover:text-background sm:text-xs"
					>
						<span class="blink">▶</span> {m.press_start()}
					</button>
				{:else}
					<div class="animate-in fade-in slide-in-from-bottom-2 text-left">
						<Entry />
					</div>
				{/if}
			</div>
		</div>

		<!-- 底部 ==== 装饰线 -->
		<div class="border-b-4 border-double border-border"></div>
	</div>
</div>
