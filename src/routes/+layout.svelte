<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { applyTheme } from '$lib/states/theme.svelte';
	import { locale } from '$lib/states/locale.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import { applyAriaStrings } from '$lib/dndAria';
	import { createErrorReporter, installGlobalErrorReporting } from '$lib/utils/errorReport';

	let { children } = $props();

	onMount(() => {
		// 双轴主题类 + 语言 attr 挂到 <html>
		applyTheme();
		document.documentElement.lang = locale.current;
		// 生产环境：全局错误上报到同源 /api/log（服务端落 Vercel 日志），静默失败不干扰使用
		if (import.meta.env.PROD) {
			const report = createErrorReporter((payload) => {
				try {
					void fetch('/api/log', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(payload),
						keepalive: true,
					}).catch(() => {});
				} catch {
					/* 上报本身绝不抛错 */
				}
			});
			installGlobalErrorReporting(report);
		}
		// PWA：注册 service worker（离线壳 + 静态资源缓存），仅生产构建
		if (import.meta.env.PROD && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js').catch(() => {});
		}
	});

	$effect(() => {
		// 语言切换时刷新读屏/键盘拖拽提示（m.*() formatter 惰性取当前语言）
		void locale.current;
		applyAriaStrings();
	});
</script>

<div class="flex min-h-svh flex-col">
	{#if page.url.pathname !== '/'}
		<header
			class="neon-border sticky top-0 z-40 flex min-h-14 flex-col items-stretch gap-2 border-b-2 border-border bg-background/90 px-3 py-2 backdrop-blur sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-0"
		>
			<a href="/" class="font-pixel whitespace-nowrap text-xs tracking-wider text-foreground">BGM-xswtier</a>
			<StatusBar showToggle />
		</header>
	{/if}
	<main class="flex-1">
		{@render children()}
	</main>
</div>
