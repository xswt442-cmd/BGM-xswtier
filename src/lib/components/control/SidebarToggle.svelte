<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { sidebar } from '$lib/states/sidebar.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<Button
	variant="ghost"
	size="icon"
	class="h-11 w-11 sm:h-9 sm:w-9 xl:hidden"
	onclick={() => sidebar.toggle()}
	aria-label={m.open_collection()}
>
	<span class="icon-[pixelarticons--arrow-bar-right] h-5 w-5"></span>
</Button>
