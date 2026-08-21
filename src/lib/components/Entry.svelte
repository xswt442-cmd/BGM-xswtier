<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { m } from '$lib/paraglide/messages';
	import SearchPanel from './SearchPanel.svelte';
	import ImportPanel from './ImportPanel.svelte';
	import RankingPoolPanel from './RankingPoolPanel.svelte';
	import StartDock from './StartDock.svelte';

	type StartTab = 'search' | 'import' | 'ranking';
	let activeTab = $state<StartTab>('search');
	const setTab = (value: string) => (activeTab = value as StartTab);
</script>

<Tabs.Root value={activeTab} onValueChange={setTab} class="min-w-0" data-testid="start-tabs">
	<Tabs.List class="mb-4 grid grid-cols-3 border-2 border-border bg-card/70 p-1">
		<Tabs.Trigger value="search" class="font-pixel min-h-11 px-2 text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-[11px]">{m.start_tab_search()}</Tabs.Trigger>
		<Tabs.Trigger value="import" class="font-pixel min-h-11 px-2 text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-[11px]">{m.start_tab_import()}</Tabs.Trigger>
		<Tabs.Trigger value="ranking" class="font-pixel min-h-11 px-2 text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-[11px]">{m.start_tab_ranking()}</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="search"><SearchPanel active={activeTab === 'search'} /></Tabs.Content>
	<Tabs.Content value="import"><ImportPanel active={activeTab === 'import'} /></Tabs.Content>
	<Tabs.Content value="ranking"><RankingPoolPanel active={activeTab === 'ranking'} /></Tabs.Content>
</Tabs.Root>

<StartDock onViewPool={() => (activeTab = 'ranking')} />
