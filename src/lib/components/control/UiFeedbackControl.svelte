<script lang="ts">
	import AxisControl from './AxisControl.svelte';
	import { theme, type UiFeedback } from '$lib/states/theme.svelte';
	import { m } from '$lib/paraglide/messages';

	const options: { value: UiFeedback; badge: string; label: () => string }[] = [
		{ value: 'none', badge: 'NONE', label: () => m.feedback_none() },
		{ value: 'arcade', badge: 'ARCADE', label: () => m.feedback_arcade() },
		{ value: 'pulse', badge: 'PULSE', label: () => m.feedback_pulse() }
	];
</script>

<AxisControl
	chipLabel="UIFB"
	iconClass="icon-[pixelarticons--gamepad]"
	heading={m.ui_feedback()}
	options={options}
	current={theme.uiFeedback}
	onSelect={(value) => theme.setUiFeedback(value as UiFeedback)}
/>
