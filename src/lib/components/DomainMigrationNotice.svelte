<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { PUBLIC_SITE_ORIGIN, LEGACY_PRODUCTION_HOSTS } from '$lib/config/site';
	import { createOriginMigrationBackup, restoreOriginMigrationBackup } from '$lib/utils/domainMigration';
	import { m } from '$lib/paraglide/messages';

	let mode = $state<'legacy' | 'import' | null>(null);
	let status = $state('');
	let importInput = $state<HTMLInputElement>();
	const dismissKey = 'bgmtier-domain-migration-dismissed-v1';
	const maxBackupSize = 5 * 1024 * 1024;

	onMount(() => {
		if (sessionStorage.getItem(dismissKey)) return;
		if (LEGACY_PRODUCTION_HOSTS.has(window.location.hostname)) {
			mode = 'legacy';
			return;
		}
		if (window.location.origin === PUBLIC_SITE_ORIGIN && new URLSearchParams(window.location.search).has('migration')) {
			mode = 'import';
		}
	});

	function dismiss() {
		sessionStorage.setItem(dismissKey, '1');
		mode = null;
	}

	function downloadBackup() {
		const backup = createOriginMigrationBackup(localStorage);
		const blobUrl = URL.createObjectURL(
			new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' }),
		);
		const link = document.createElement('a');
		link.href = blobUrl;
		link.download = `bgm-xswtier-origin-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(blobUrl);
		status = m.domain_migration_exported();
	}

	async function importBackup(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const validType = file.type === '' || file.type === 'application/json';
		if (file.size > maxBackupSize || !file.name.toLowerCase().endsWith('.json') || !validType) {
			status = m.domain_migration_failed();
			return;
		}
		if (!window.confirm(m.domain_migration_import_confirm())) return;
		const restored = restoreOriginMigrationBackup(localStorage, await file.text());
		if (!restored) {
			status = m.domain_migration_failed();
			return;
		}
		status = m.domain_migration_imported();
		window.setTimeout(() => window.location.replace(PUBLIC_SITE_ORIGIN), 500);
	}
</script>

{#if mode}
	<aside
		class="pixel-border neon-border fixed right-3 bottom-3 left-3 z-[70] mx-auto max-w-3xl bg-background/95 p-4 shadow-xl backdrop-blur sm:right-5 sm:bottom-5 sm:left-5"
		role="region"
		aria-labelledby="domain-migration-title"
	>
		<div class="flex items-start gap-3">
			<div class="min-w-0 flex-1">
				<h2 id="domain-migration-title" class="font-pixel text-xs text-foreground">
					{mode === 'legacy' ? m.domain_migration_old_title() : m.domain_migration_new_title()}
				</h2>
				<p class="mt-2 text-sm leading-6 text-muted-foreground">
					{mode === 'legacy' ? m.domain_migration_old_description() : m.domain_migration_new_description()}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">{m.domain_migration_token_note()}</p>
			</div>
			<button
				type="button"
				class="grid size-9 shrink-0 place-items-center rounded border border-border bg-secondary text-foreground hover:bg-accent"
				aria-label={m.domain_migration_dismiss()}
				onclick={dismiss}>×</button
			>
		</div>

		<div class="mt-3 flex flex-col gap-2 sm:flex-row">
			{#if mode === 'legacy'}
				<Button type="button" onclick={downloadBackup}>{m.domain_migration_export()}</Button>
				<a
					class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent"
					href={`${PUBLIC_SITE_ORIGIN}/?migration=1`}>{m.domain_migration_open_new()}</a
				>
			{:else}
				<input
					bind:this={importInput}
					type="file"
					accept="application/json,.json"
					class="sr-only"
					onchange={importBackup}
				/>
				<Button type="button" onclick={() => importInput?.click()}>{m.domain_migration_import()}</Button>
			{/if}
		</div>
		{#if status}<p class="mt-2 text-xs text-foreground" aria-live="polite">{status}</p>{/if}
	</aside>
{/if}
