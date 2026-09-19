<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { tierData } from '$lib/states/tierData.svelte';
	import { buildTasteProfile } from '$lib/utils/tasteProfile';
	import { toProxiedImageUrl } from '$lib/utils/imageProxy';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import type { ItemData } from '$lib/schemas/item';

	const profile = $derived(buildTasteProfile(tierData.tiers));
	/** 一致度展示成百分比；样本不足（null）时不显示数字，只说样本不够 */
	const agreementPct = $derived(profile.agreement === null ? null : Math.round(((profile.agreement + 1) / 2) * 100));

	let exportNode = $state<HTMLElement | null>(null);
	let isExporting = $state(false);
	let statusMessage = $state('');

	const displayName = (item: ItemData) => (getLocale() === 'zh' && item.name_cn ? item.name_cn : item.name);

	function barWidth(count: number, max: number) {
		return `${Math.max(4, Math.round((count / Math.max(1, max)) * 100))}%`;
	}

	async function exportPng() {
		if (!exportNode || isExporting) return;
		isExporting = true;
		statusMessage = m.exporting_png();
		// 与 tier 页同款处理：lain CDN 无 CORS 头，导出期间临时换成同源代理地址
		const imgs = [...exportNode.querySelectorAll('img')];
		const originalSrcs = imgs.map((img) => img.getAttribute('src'));
		imgs.forEach((img, i) => {
			const proxied = toProxiedImageUrl(originalSrcs[i]);
			if (proxied) img.setAttribute('src', proxied);
		});
		try {
			await document.fonts.ready;
			await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
			const { toPng } = await import('html-to-image');
			const dataUrl = await toPng(exportNode, {
				pixelRatio: 2,
				cacheBust: true,
				backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
				filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-export-exclude')),
			});
			const link = document.createElement('a');
			link.download = `bgm-xswtier-profile-${new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '')}.png`;
			link.href = dataUrl;
			link.click();
			statusMessage = m.export_png_success();
		} catch (error) {
			console.error('[Profile export] Failed', error);
			statusMessage = m.export_png_failed();
		} finally {
			imgs.forEach((img, i) => {
				const src = originalSrcs[i];
				if (src === null) img.removeAttribute('src');
				else img.setAttribute('src', src);
			});
			isExporting = false;
		}
	}
</script>

<div class="flex min-h-svh flex-col">
	<div class="border-t-4 border-double border-foreground/50"></div>

	<div class="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
		<div class="mb-4 flex flex-wrap items-center gap-2" data-export-exclude>
			<h1 class="font-pixel neon-text mr-auto text-sm">{m.taste_title()}</h1>
			<Button variant="outline" class="font-pixel h-9 text-[10px]" onclick={() => goto('/tier')}>
				{m.taste_back()}
			</Button>
			<Button
				class="font-pixel h-9 text-[10px]"
				onclick={exportPng}
				disabled={profile.rankedCount === 0 || isExporting}
				data-testid="profile-export"
			>
				{m.taste_export_png()}
			</Button>
		</div>
		<p class="sr-only" aria-live="polite">{statusMessage}</p>

		{#if profile.rankedCount === 0}
			<p class="font-pixel py-16 text-center text-[11px] text-muted-foreground">{m.taste_empty()}</p>
		{:else}
			<div bind:this={exportNode} class="pixel-border bg-card/80 p-4" data-testid="profile-card">
				<div class="mb-4 flex items-center gap-2">
					<span class="icon-[pixelarticons--chart] h-5 w-5 text-accent"></span>
					<span
						class="neon-text font-pixel rounded-md px-2.5 py-1 text-xs text-black"
						style="background: var(--chart-2);"
					>
						{m.taste_title()}
					</span>
				</div>

				<!-- 三格统计 -->
				<div class="mb-4 grid grid-cols-3 gap-2">
					<div class="border-2 border-border bg-background/60 p-2.5 text-center">
						<p class="font-pixel text-lg tabular-nums">{profile.rankedCount}</p>
						<p class="mt-1 text-[10px] text-muted-foreground">{m.taste_ranked()}</p>
					</div>
					<div class="border-2 border-border bg-background/60 p-2.5 text-center" title={m.taste_agreement_hint()}>
						<p class="font-pixel text-lg tabular-nums">
							{agreementPct === null ? '—' : `${agreementPct}%`}
						</p>
						<p class="mt-1 text-[10px] text-muted-foreground">{m.taste_agreement()}</p>
					</div>
					<div class="border-2 border-border bg-background/60 p-2.5 text-center">
						<p class="font-pixel text-lg tabular-nums">
							{profile.avgScore === null ? '—' : profile.avgScore.toFixed(2)}
						</p>
						<p class="mt-1 text-[10px] text-muted-foreground">{m.taste_avg_score()}</p>
					</div>
				</div>
				<p class="mb-4 text-[10px] text-muted-foreground">
					{m.taste_scored_note({ count: profile.scoredCount })}
				</p>

				<!-- 高估 / 低估 -->
				<div class="mb-4 grid gap-3 sm:grid-cols-2">
					{#each [{ key: 'over', title: m.taste_overrated(), rows: profile.overrated }, { key: 'under', title: m.taste_underrated(), rows: profile.underrated }] as group (group.key)}
						<div class="border-2 border-border bg-background/60 p-2">
							<p class="font-pixel mb-2 text-[10px]">{group.title}</p>
							<ul class="grid gap-1.5">
								{#each group.rows as row (row.item.id)}
									<li class="flex items-center gap-2" data-testid="profile-delta-row">
										<img
											src={row.item.image ?? 'https://lain.bgm.tv/img/no_icon_subject.png'}
											alt={displayName(row.item)}
											draggable="false"
											loading="lazy"
											class="h-10 w-8 shrink-0 rounded-sm border border-border object-cover object-top"
										/>
										<div class="min-w-0 flex-1">
											<p class="truncate text-[11px]">{displayName(row.item)}</p>
											<p class="text-[10px] text-muted-foreground">
												{m.taste_your_tier()}: {tierData.tiers.find((t) => t.items.some((i) => i.id === row.item.id))
													?.label ?? ''} · {m.taste_bgm_score()}: {row.item.score?.toFixed(1)}
											</p>
										</div>
										<span
											class="font-pixel shrink-0 text-[10px] tabular-nums"
											style="color: {row.delta > 0 ? 'var(--chart-1)' : 'var(--chart-3)'};"
										>
											{row.delta > 0 ? '+' : ''}{row.delta}
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>

				<!-- 偏好标签 -->
				{#if profile.topTags.length > 0}
					<div class="mb-4 border-2 border-border bg-background/60 p-2">
						<p class="font-pixel mb-2 text-[10px]">{m.taste_top_tags()}</p>
						<ul class="grid gap-1">
							{#each profile.topTags as tag (tag.tag)}
								<li class="flex items-center gap-2">
									<span class="w-20 shrink-0 truncate text-[11px]">{tag.tag}</span>
									<span class="h-2.5 flex-1 rounded-sm bg-muted">
										<span
											class="block h-full rounded-sm"
											style="width: {barWidth(tag.count, profile.topTags[0].count)}; background: var(--chart-2);"
										></span>
									</span>
									<span class="font-pixel w-6 shrink-0 text-right text-[10px] tabular-nums">{tag.count}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- 年代 -->
				{#if profile.years.length > 0}
					<div class="mb-4 border-2 border-border bg-background/60 p-2">
						<p class="font-pixel mb-2 text-[10px]">{m.taste_years()}</p>
						<ul class="grid gap-1">
							{#each profile.years as year (year.year)}
								<li class="flex items-center gap-2">
									<span class="font-pixel w-12 shrink-0 text-[10px] tabular-nums">{year.year}</span>
									<span class="h-2.5 flex-1 rounded-sm bg-muted">
										<span
											class="block h-full rounded-sm"
											style="width: {barWidth(year.count, profile.years[0].count)}; background: var(--chart-4);"
										></span>
									</span>
									<span class="font-pixel w-6 shrink-0 text-right text-[10px] tabular-nums">{year.count}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- 各档概览 -->
				<div class="border-2 border-border bg-background/60 p-2">
					<p class="font-pixel mb-2 text-[10px]">{m.taste_tier_breakdown()}</p>
					<ul class="grid gap-1">
						{#each profile.tierStats as stat (stat.id)}
							<li class="flex items-center gap-2 text-[11px]">
								<span class="w-20 shrink-0 truncate">{stat.label}</span>
								<span class="font-pixel w-8 shrink-0 text-right text-[10px] tabular-nums">{stat.count}</span>
								<span class="text-[10px] text-muted-foreground">
									{stat.avgScore === null ? '' : `★ ${stat.avgScore.toFixed(2)}`}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>
