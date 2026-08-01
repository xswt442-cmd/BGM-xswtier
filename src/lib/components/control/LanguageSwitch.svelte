<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import StatusChip from './StatusChip.svelte';
	import { locale } from '$lib/states/locale.svelte';
	import { locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	const LANGUAGE_NAMES: Record<string, string> = { zh: '中文', en: 'English' };
</script>

<DropdownMenu>
	<DropdownMenuTrigger class="rounded-sm transition-opacity hover:opacity-80">
		<StatusChip label="LANG" value={LANGUAGE_NAMES[locale.current] ?? locale.current} />
	</DropdownMenuTrigger>
	{#snippet content()}
		<DropdownMenuLabel>{m.language()}</DropdownMenuLabel>
		<DropdownMenuSeparator />
		{#each locales as l (l)}
			<DropdownMenuItem onSelect={() => locale.set(l)}>
				<span class="flex items-center justify-between gap-4">
					{LANGUAGE_NAMES[l] ?? l}
					{#if locale.current === l}
						<span class="icon-[pixelarticons--check] h-4 w-4"></span>
					{/if}
				</span>
			</DropdownMenuItem>
		{/each}
	{/snippet}
</DropdownMenu>
