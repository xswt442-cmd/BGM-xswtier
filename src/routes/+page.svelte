<script lang="ts">
	import Entry from '$lib/components/Entry.svelte';
	import { m } from '$lib/paraglide/messages';
	import cover from '$lib/assets/cover.jpg';
</script>

<div class="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-10" style="background-image: url({cover});"></div>

<div class="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-4xl flex-col items-center justify-center gap-10 px-4 py-10">
	<div class="text-center">
		<h1 class="title-vivid text-6xl font-black tracking-tight sm:text-7xl">BGM-xswtier</h1>
		<p class="mt-4 text-muted-foreground">{m.app_description()}</p>
	</div>
	<Entry />
</div>
