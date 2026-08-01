<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { applyTheme } from '$lib/states/theme.svelte';
	import { locale } from '$lib/states/locale.svelte';
	import UtilBar from '$lib/components/UtilBar.svelte';

	let { children } = $props();

	onMount(() => {
		// 双轴主题类 + 语言 attr 挂到 <html>
		applyTheme();
		document.documentElement.lang = locale.current;
	});
</script>

<div class="flex min-h-svh flex-col">
	<header
		class="sticky top-0 z-40 flex h-14 items-center justify-between border-b-2 border-border bg-background/90 px-4 backdrop-blur"
	>
		<a href="/" class="font-pixel text-xs tracking-wider text-foreground">BGM-xswtier</a>
		<UtilBar />
	</header>
	<main class="flex-1">
		{@render children()}
	</main>
</div>
