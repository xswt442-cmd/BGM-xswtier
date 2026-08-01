<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { locale } from '$lib/states/locale.svelte';
	import { locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	const LANGUAGE_NAMES: Record<string, string> = { zh: '中文', en: 'English', ja: '日本語' };
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<Button variant="ghost" size="icon" aria-label={m.language()}>
			<span class="icon-[lucide--languages] h-5 w-5"></span>
		</Button>
	</DropdownMenuTrigger>
	{#snippet content()}
		<DropdownMenuLabel>{m.language()}</DropdownMenuLabel>
		<DropdownMenuSeparator />
		{#each locales as l (l)}
			<DropdownMenuItem onSelect={() => locale.set(l)}>
				<span class="flex items-center justify-between gap-4">
					{LANGUAGE_NAMES[l] ?? l}
					{#if locale.current === l}
						<span class="icon-[lucide--check] h-4 w-4"></span>
					{/if}
				</span>
			</DropdownMenuItem>
		{/each}
	{/snippet}
</DropdownMenu>
