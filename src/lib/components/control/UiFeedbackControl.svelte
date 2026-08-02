<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import StatusChip from './StatusChip.svelte';
	import { theme, type UiFeedback } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const options: UiFeedback[] = ['none', 'arcade', 'pulse'];
	const BADGE: Record<UiFeedback, string> = { none: 'NONE', arcade: 'ARCADE', pulse: 'PULSE' };

	function optionLabel(option: UiFeedback) {
		return option === 'none'
			? m.feedback_none()
			: option === 'arcade'
				? m.feedback_arcade()
				: m.feedback_pulse();
	}
</script>

<Popover>
	<PopoverTrigger class="min-h-11 rounded-sm transition-opacity hover:opacity-80 sm:min-h-0">
		<StatusChip label="UIFB" value={BADGE[theme.uiFeedback]} iconClass="icon-[pixelarticons--gamepad]" />
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-xs font-semibold">{m.ui_feedback()}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each options as option (option)}
					<Button
						variant={theme.uiFeedback === option ? 'default' : 'outline'}
						size="sm"
						onclick={() => theme.setUiFeedback(option)}
					>
						{optionLabel(option)}
					</Button>
				{/each}
			</div>
		</div>
	{/snippet}
</Popover>
