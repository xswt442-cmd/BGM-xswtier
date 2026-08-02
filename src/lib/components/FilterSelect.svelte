<script lang="ts">
	// 单选筛选下拉（区域/分类/来源/类型共用）：8-bit 样式 select + 选项（label 惰性取当前语言）。
	let {
		id,
		value = $bindable(''),
		options
	}: {
		id: string;
		value: string;
		options: { value: string; label: () => string }[];
	} = $props();
</script>

<select
	{id}
	class="font-pixel h-10 w-full cursor-pointer appearance-none border-2 border-border bg-card px-2 py-1.5 text-[11px] leading-5 text-foreground outline-none"
	bind:value
>
	{#each options as opt}
		<option value={opt.value}>{opt.label()}</option>
	{/each}
</select>
