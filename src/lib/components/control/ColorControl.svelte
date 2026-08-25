<script lang="ts">
	import AxisControl from './AxisControl.svelte';
	import { theme, type ColorScheme } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const options: { value: ColorScheme; badge: string; label: () => string }[] = [
		{ value: 'sun', badge: 'SUN', label: () => m.scheme_sun() },
		{ value: 'dark', badge: 'NIGHT', label: () => m.scheme_dark() },
		{ value: 'sky', badge: 'SKY', label: () => m.scheme_sky() },
	];
</script>

<AxisControl
	chipLabel="COLOR"
	iconClass="icon-[pixelarticons--paint-bucket]"
	heading={m.color_scheme()}
	{options}
	current={theme.colorScheme}
	onSelect={(value) => theme.setColor(value as ColorScheme)}
/>
