<script lang="ts">
	import Entry from '$lib/components/Entry.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<div
	class="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-2xl flex-col items-center justify-center px-4 py-10"
>
	<!-- 手帐封面 -->
	<div class="pixel-border pixel-shadow relative w-full rounded-xl bg-card p-8 sm:p-10">
		<div
			class="washi-tape absolute -top-3 left-1/2 w-44 -translate-x-1/2 rotate-[-1deg]"
			style="background: var(--chart-3);"
		></div>
		<div
			class="washi-tape absolute -bottom-3 right-8 w-28 rotate-[1.5deg]"
			style="background: var(--chart-6);"
		></div>
		<div class="text-center">
			<h1 class="font-pixel text-2xl text-foreground sm:text-4xl">BGM-xswtier</h1>
			<p class="mt-4 text-muted-foreground">{m.app_description()}</p>
		</div>
		<div class="mt-8">
			<Entry />
		</div>
	</div>
</div>
