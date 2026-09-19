<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
	} from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { tierData } from '$lib/states/tierData.svelte';

	/** 未排名集合的多选批量入档入口：下拉列出全部档位，选一个即批量移入 */
	let { moveSelectedTo, disabled = false }: { moveSelectedTo: (tierId: string) => void; disabled?: boolean } =
		$props();
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				size="sm"
				class="font-pixel h-6 px-2 text-[8px]"
				{disabled}
				data-testid="bulk-move-trigger"
				{...props}
			>
				{m.bulk_move_to()}
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	{#snippet content()}
		<DropdownMenuLabel>{m.bulk_move_to()}</DropdownMenuLabel>
		<DropdownMenuSeparator />
		{#each tierData.tiers as tier (tier.id)}
			<DropdownMenuItem onSelect={() => moveSelectedTo(tier.id)}>{tier.label}</DropdownMenuItem>
		{/each}
	{/snippet}
</DropdownMenu>
