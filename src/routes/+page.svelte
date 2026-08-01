<script lang="ts">
	import Entry from '$lib/components/Entry.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<div
	class="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-xl flex-col items-center justify-center px-4 py-10"
>
	<!-- 8-bit 封面卡片 -->
	<div class="pixel-border pixel-shadow w-full overflow-hidden rounded-lg bg-card">
		<div class="px-6 py-5 text-center" style="background: var(--chart-3);">
			<h1 class="font-pixel text-xl text-black sm:text-2xl">BGM-xswtier</h1>
		</div>
		<p class="px-6 pt-4 text-center text-sm text-muted-foreground">{m.app_description()}</p>
		<div class="p-6">
			<Entry />
		</div>
	</div>
</div>
