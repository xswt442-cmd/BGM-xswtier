<script lang="ts">
	import LanguageSwitch from './control/LanguageSwitch.svelte';
	import VisualSettings from './control/VisualSettings.svelte';
	import TokenSettings from './control/TokenSettings.svelte';
	import SidebarToggle from './control/SidebarToggle.svelte';
</script>

<div class="flex items-center gap-0.5">
	<LanguageSwitch />
	<VisualSettings />
	<TokenSettings />
	<SidebarToggle />
</div>
