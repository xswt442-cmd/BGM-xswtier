<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
	} from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';

	/**
	 * 会话级工具栏：暂存 / 分享 / 退出 / 导入 / 导出 / 保存 Tier。
	 *
	 * 这一排只负责"把会话带进带出"的动作；动作本身的实现留在页面里，
	 * 因为它们要动用页面的 dialog 引用、隐藏 file input 和导出节点。
	 * 第二个导出项「保存 Tier」尚未实现，置灰占位。
	 */
	let {
		hasSessionItems,
		copied,
		importing,
		isExporting,
		onSaveDraft,
		onShare,
		onExit,
		onImport,
		onExportJson,
		onExportText,
		onExportImage,
	}: {
		hasSessionItems: boolean;
		copied: boolean;
		importing: boolean;
		isExporting: boolean;
		onSaveDraft: () => void;
		onShare: () => void;
		onExit: () => void;
		onImport: () => void;
		onExportJson: () => void;
		onExportText: (format: 'markdown' | 'bbcode') => void;
		onExportImage: (format: 'png' | 'svg', skipEmpty?: boolean) => void;
	} = $props();
</script>

<div class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3" data-export-exclude>
	<Button variant="outline" class="font-pixel h-11 text-[10px] sm:h-9" onclick={onSaveDraft}>
		{m.save_draft()}
	</Button>
	<Button
		class="font-pixel h-11 text-[10px] text-black hover:opacity-85 sm:h-9"
		style="background-color: var(--chart-3)"
		onclick={onShare}
		disabled={!hasSessionItems}
	>
		{copied ? m.share_copied() : m.share_tier()}
	</Button>
	<Button
		class="font-pixel h-11 bg-accent text-[10px] text-accent-foreground hover:bg-accent/85 sm:h-9"
		onclick={onExit}
	>
		{m.exit_tier()}
	</Button>
	<Button
		class="font-pixel h-11 text-[10px] text-black hover:opacity-85 sm:h-9"
		style="background-color: var(--chart-4)"
		onclick={onImport}
		disabled={importing}
	>
		{importing ? m.importing() : m.import_tier()}
	</Button>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					class="font-pixel inline-flex h-11 items-center justify-center gap-1 text-[10px] text-black transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-50 sm:h-9"
					style="background-color: var(--chart-5)"
					disabled={isExporting}
					{...props}
				>
					{isExporting ? m.exporting_image() : m.export_menu()}
					<span class="icon-[pixelarticons--chevron-down] h-3.5 w-3.5"></span>
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		{#snippet content()}
			<DropdownMenuLabel class="font-normal opacity-70">{m.export_group_data()}</DropdownMenuLabel>
			<DropdownMenuItem onSelect={onExportJson}>{m.export_tier()}</DropdownMenuItem>
			<DropdownMenuItem onSelect={() => onExportText('markdown')}>{m.export_markdown()}</DropdownMenuItem>
			<DropdownMenuItem onSelect={() => onExportText('bbcode')}>{m.export_bbcode()}</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuLabel class="font-normal opacity-70">{m.export_group_image()}</DropdownMenuLabel>
			<DropdownMenuItem onSelect={() => onExportImage('png')}>{m.export_png_all()}</DropdownMenuItem>
			<DropdownMenuItem onSelect={() => onExportImage('png', true)}>
				{m.export_png_skip_empty()}
			</DropdownMenuItem>
			<DropdownMenuItem onSelect={() => onExportImage('svg')}>{m.export_svg_all()}</DropdownMenuItem>
		{/snippet}
	</DropdownMenu>
	<Button variant="outline" class="font-pixel h-11 text-[10px] opacity-50 sm:h-9" disabled>
		{m.save_tier()}
	</Button>
</div>
