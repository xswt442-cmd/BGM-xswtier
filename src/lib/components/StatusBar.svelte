<script lang="ts">
	import ColorControl from './control/ColorControl.svelte';
	import EffectsControl from './control/EffectsControl.svelte';
	import UiFeedbackControl from './control/UiFeedbackControl.svelte';
	import LanguageSwitch from './control/LanguageSwitch.svelte';
	import TokenSettings from './control/TokenSettings.svelte';
	import GitHubLink from './control/GitHubLink.svelte';
	import RemakeControl from './control/RemakeControl.svelte';
	import SidebarToggle from './control/SidebarToggle.svelte';
	import { storageWarning } from '$lib/states/storageWarning.svelte';
	import { m } from '$lib/paraglide/messages';
	import { cn } from '$lib/utils';

	let { showToggle = false, centered = false }: { showToggle?: boolean; centered?: boolean } = $props();
</script>

<div
	class={cn(
		'flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:w-auto',
		centered ? 'justify-center' : 'sm:justify-end',
	)}
>
	{#if storageWarning.active}
		<span
			class="font-pixel inline-flex cursor-help items-center whitespace-nowrap rounded-sm border-2 border-destructive px-2 py-1.5 text-[10px] leading-none text-destructive sm:py-1"
			role="alert"
			title={m.storage_quota_title()}
		>
			{m.storage_quota_exceeded()}
		</span>
	{/if}
	<ColorControl />
	<EffectsControl />
	<UiFeedbackControl />
	<LanguageSwitch />
	<TokenSettings />
	<GitHubLink />
	<RemakeControl />
	{#if showToggle}
		<SidebarToggle />
	{/if}
</div>
