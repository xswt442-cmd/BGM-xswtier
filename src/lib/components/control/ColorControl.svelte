<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import StatusChip from './StatusChip.svelte';
	import { theme, type ColorScheme } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const schemes: ColorScheme[] = ['warm', 'dark', 'sky'];
	const SCHEME_BADGE: Record<ColorScheme, string> = { warm: 'WARM-SUN', dark: 'NIGHT', sky: 'SKY' };

	function schemeLabel(s: ColorScheme) {
		return s === 'warm' ? m.scheme_warm() : s === 'dark' ? m.scheme_dark() : m.scheme_sky();
	}
</script>

<Popover>
	<PopoverTrigger class="rounded-sm transition-opacity hover:opacity-80">
		<StatusChip label="COLOR" value={SCHEME_BADGE[theme.colorScheme]} />
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-xs font-semibold">{m.color_scheme()}</span>
			<div class="flex gap-1.5">
				{#each schemes as s (s)}
					<Button
						variant={theme.colorScheme === s ? 'default' : 'outline'}
						size="sm"
						onclick={() => theme.setColor(s)}
					>
						{schemeLabel(s)}
					</Button>
				{/each}
			</div>
		</div>
	{/snippet}
</Popover>
