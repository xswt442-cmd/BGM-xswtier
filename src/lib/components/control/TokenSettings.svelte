<script lang="ts">
	import { Popover, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import StatusChip from './StatusChip.svelte';
	import { apiToken } from '$lib/states/token.svelte';
	import { m } from '$lib/paraglide/messages';

	let draft = $state(apiToken.token ?? '');
</script>

<Popover>
	<PopoverTrigger class="min-h-11 rounded-sm transition-opacity hover:opacity-80 sm:min-h-0">
		<StatusChip label="KEY" value={apiToken.hasToken ? 'TOKEN SET' : 'NO TOKEN'} iconClass="icon-[pixelarticons--lock]" />
	</PopoverTrigger>
	{#snippet content()}
		<div class="grid gap-3">
			<span class="text-sm font-semibold">{m.access_token()}</span>
			<p class="text-xs text-muted-foreground">{m.token_hint()}</p>
			<Input type="password" placeholder={m.token_placeholder()} bind:value={draft} />
			<div class="flex items-center justify-between gap-2">
				<a
					href="https://next.bgm.tv/demo/access-token"
					target="_blank"
					class="text-xs text-primary hover:underline"
				>
					{m.get_token()}
				</a>
				<div class="flex gap-2">
					{#if apiToken.hasToken}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								apiToken.clear();
								draft = '';
							}}
						>
							{m.clear()}
						</Button>
					{/if}
					<Button size="sm" onclick={() => apiToken.setToken(draft.trim() || null)}>
						{m.save()}
					</Button>
				</div>
			</div>
		</div>
	{/snippet}
</Popover>
