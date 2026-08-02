<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import StatusChip from './StatusChip.svelte';
	import { theme, type VisualEffects } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const effectOptions: VisualEffects[] = ['none', 'neon', 'crt'];
	const EFFECT_BADGE: Record<VisualEffects, string> = {
		none: 'NONE',
		neon: 'NEON',
		crt: 'CRT'
	};

	function effectLabel(e: VisualEffects) {
		return e === 'none'
			? m.effect_none()
			: e === 'neon'
				? m.effect_neon()
				: m.effect_crt();
	}
</script>

<Popover>
	<PopoverTrigger class="min-h-11 rounded-sm transition-opacity hover:opacity-80 sm:min-h-0">
		<StatusChip label="VFX" value={EFFECT_BADGE[theme.effects]} iconClass="icon-[pixelarticons--sparkles]" />
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-xs font-semibold">{m.visual_effects()}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each effectOptions as e (e)}
					<Button
						variant={theme.effects === e ? 'default' : 'outline'}
						size="sm"
						onclick={() => theme.setEffects(e)}
					>
						{effectLabel(e)}
					</Button>
				{/each}
			</div>
		</div>
	{/snippet}
</Popover>
