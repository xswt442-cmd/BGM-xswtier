<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { theme, type ColorScheme, type Effects } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const schemes: ColorScheme[] = ['warm', 'dark', 'sky'];
	const effectOptions: Effects[] = ['none', 'neon'];

	function schemeLabel(s: ColorScheme) {
		return s === 'warm' ? m.scheme_warm() : s === 'dark' ? m.scheme_dark() : m.scheme_sky();
	}
	function effectLabel(e: Effects) {
		return e === 'none' ? m.effect_none() : m.effect_neon();
	}
</script>

<Popover>
	<PopoverTrigger>
		<Button variant="ghost" size="icon" aria-label={m.visual()}>
			<span class="icon-[lucide--palette] h-5 w-5"></span>
		</Button>
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-4">
			<div class="grid gap-1.5">
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
			<div class="grid gap-1.5">
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
		</div>
	{/snippet}
</Popover>
