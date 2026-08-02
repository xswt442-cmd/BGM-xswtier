<script lang="ts">
	import ColorControl from './control/ColorControl.svelte';
	import EffectsControl from './control/EffectsControl.svelte';
	import UiFeedbackControl from './control/UiFeedbackControl.svelte';
	import LanguageSwitch from './control/LanguageSwitch.svelte';
	import TokenSettings from './control/TokenSettings.svelte';
	import RemakeControl from './control/RemakeControl.svelte';
	import SidebarToggle from './control/SidebarToggle.svelte';
	import { cn } from '$lib/utils';

	let { showToggle = false, centered = false }: { showToggle?: boolean; centered?: boolean } = $props();
</script>

<div
	class={cn(
		'flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:w-auto',
		centered ? 'justify-center' : 'sm:justify-end'
	)}
>
	<ColorControl />
	<EffectsControl />
	<UiFeedbackControl />
	<LanguageSwitch />
	<TokenSettings />
	<RemakeControl />
	{#if showToggle}
		<SidebarToggle />
	{/if}
</div>
