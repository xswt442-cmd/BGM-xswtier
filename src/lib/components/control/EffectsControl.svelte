<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import StatusChip from './StatusChip.svelte';
	import { theme, type Effects } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const effectOptions: Effects[] = ['none', 'neon'];
	const EFFECT_BADGE: Record<Effects, string> = { none: 'NONE', neon: 'NEON ON' };

	function effectLabel(e: Effects) {
		return e === 'none' ? m.effect_none() : m.effect_neon();
	}
</script>

<Popover>
	<PopoverTrigger class="rounded-sm transition-opacity hover:opacity-80">
		<StatusChip label="FX" value={EFFECT_BADGE[theme.effects]} />
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-xs font-semibold">{m.effects()}</span>
			<div class="flex gap-1.5">
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
