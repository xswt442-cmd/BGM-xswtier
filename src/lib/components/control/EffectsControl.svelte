<script lang="ts">
	import AxisControl from './AxisControl.svelte';
	import { theme, type VisualEffects } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const options: { value: VisualEffects; badge: string; label: () => string }[] = [
		{ value: 'none', badge: 'NONE', label: () => m.effect_none() },
		{ value: 'neon', badge: 'NEON', label: () => m.effect_neon() },
		{ value: 'crt', badge: 'CRT', label: () => m.effect_crt() },
	];
</script>

<AxisControl
	chipLabel="VFX"
	iconClass="icon-[pixelarticons--sparkles]"
	heading={m.visual_effects()}
	{options}
	current={theme.effects}
	onSelect={(value) => theme.setEffects(value as VisualEffects)}
/>
