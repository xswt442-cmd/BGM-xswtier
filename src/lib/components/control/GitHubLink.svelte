<script lang="ts">
	import StatusChip from './StatusChip.svelte';
	import { m } from '$lib/paraglide/messages';

	// 开源项目入口：指向公开仓库，让落地页呈现软件项目身份
	const GITHUB_URL = 'https://github.com/xswt442-cmd/BGM-xswtier';
</script>

<a
	href={GITHUB_URL}
	target="_blank"
	rel="noreferrer"
	aria-label={m.github_view_source()}
	class="min-h-11 rounded-sm transition-opacity hover:opacity-80 sm:min-h-0"
>
	<StatusChip label="GH" value="GitHub" iconClass="icon-[pixelarticons--github]" />
</a>
