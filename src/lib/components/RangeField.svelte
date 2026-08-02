<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages';

	// 区间输入（开播时间 / 评分 / 评分人数共用）：from + to，左右 1fr 半开布局。
	let {
		label,
		fromId,
		toId,
		fromValue = $bindable(''),
		toValue = $bindable(''),
		type = 'date',
		step,
		fromPlaceholder,
		toPlaceholder,
		fromMin,
		fromMax,
		toMin,
		toMax
	}: {
		label: string;
		fromId: string;
		toId: string;
		fromValue: string;
		toValue: string;
		type?: 'date' | 'number';
		step?: string;
		fromPlaceholder?: string;
		toPlaceholder?: string;
		fromMin?: string;
		fromMax?: string;
		toMin?: string;
		toMax?: string;
	} = $props();
</script>

<div class="grid gap-1.5">
	<Label class="font-pixel text-xs">{label}</Label>
	<div
		class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
	>
		<Label for={fromId} class="font-pixel text-[10px] text-muted-foreground">{m.range_from()}</Label>
		<Input
			id={fromId}
			{type}
			{step}
			min={fromMin}
			max={fromMax}
			placeholder={fromPlaceholder}
			class="min-w-0 w-full"
			bind:value={fromValue}
		/>
		<Label for={toId} class="font-pixel text-[10px] text-muted-foreground">{m.range_to()}</Label>
		<Input
			id={toId}
			{type}
			{step}
			min={toMin}
			max={toMax}
			placeholder={toPlaceholder}
			class="min-w-0 w-full"
			bind:value={toValue}
		/>
	</div>
</div>
