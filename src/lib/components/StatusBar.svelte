<script lang="ts">
	import ColorControl from './control/ColorControl.svelte';
	import EffectsControl from './control/EffectsControl.svelte';
	import LanguageSwitch from './control/LanguageSwitch.svelte';
	import TokenSettings from './control/TokenSettings.svelte';
	import SidebarToggle from './control/SidebarToggle.svelte';

	let { showToggle = false }: { showToggle?: boolean } = $props();
</script>

<div class="flex flex-wrap items-center gap-1.5">
	<ColorControl />
	<EffectsControl />
	<LanguageSwitch />
	<TokenSettings />
	{#if showToggle}
		<SidebarToggle />
	{/if}
</div>
