import { downloadDataUrl, compactStamp } from '$lib/utils/download';
import { toProxiedImageUrl } from '$lib/utils/imageProxy';

/**
 * 榜单 DOM → 图片。支持光栅（PNG 2×）与矢量（SVG，印刷/无损缩放用）。
 *
 * 整个过程会临时改写传入节点的 DOM（图片 src、空档标记），并在 finally 里逐一还原：
 * 导出是只读操作，不该让页面留下任何痕迹。
 * 失败时原样抛出，由调用方决定给用户看什么文案。
 */

/** 渲染层用这个属性把节点排除在导出之外（工具栏、占位等） */
const EXPORT_EXCLUDE_ATTR = 'data-export-exclude';

/** 档位行的稳定标识，用于 skipEmpty 时判断档位里有没有条目 */
const TIER_ZONE_SELECTOR = '[data-testid="tier-zone"]';

/** 条目卡的标识；drag shadow 只在拖拽瞬间出现，导出时不会命中 */
const ITEM_SELECTOR = '[data-item-id]';

export interface TierImageExportOptions {
	format: 'png' | 'svg';
	/** 跳过没有任何条目的档位整行——比克隆 DOM 再删节点简单，也不会产生截图前后的布局抖动 */
	skipEmpty?: boolean;
}

export async function exportTierImage(node: HTMLElement, options: TierImageExportOptions): Promise<void> {
	const { format, skipEmpty = false } = options;

	// lain CDN 没有 CORS 头，html-to-image 跨域 fetch 取不到封面字节 → 导出图缺封面。
	// 导出期间把节点内图片临时改写成同源代理地址，结束后恢复原图。
	const images = [...node.querySelectorAll('img')];
	const originalSrcs = images.map((img) => img.getAttribute('src'));
	images.forEach((img, i) => {
		const proxied = toProxiedImageUrl(originalSrcs[i]);
		if (proxied) img.setAttribute('src', proxied);
	});

	const markedEmpty: HTMLElement[] = [];
	if (skipEmpty) {
		for (const zone of node.querySelectorAll<HTMLElement>(TIER_ZONE_SELECTOR)) {
			if (!zone.querySelector(ITEM_SELECTOR)) {
				zone.setAttribute(EXPORT_EXCLUDE_ATTR, '');
				markedEmpty.push(zone);
			}
		}
	}

	try {
		await document.fonts.ready;
		await Promise.all(images.map((img) => img.decode().catch(() => {})));
		// 动态引入：导出不是进页必需，避免 html-to-image 计入 tier 页首包
		const { toPng, toSvg } = await import('html-to-image');
		const baseOptions = {
			cacheBust: true,
			// 字体已全部同源自托管（Press Start 2P + Fusion Pixel），可安全嵌入导出图并保持像素观感；
			// 此前 skipFonts:true 是 Google Fonts 外链时代的权宜之计
			backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
			filter: (target: Node) => !(target instanceof HTMLElement && target.hasAttribute(EXPORT_EXCLUDE_ATTR)),
		};
		const dataUrl =
			format === 'svg' ? await toSvg(node, baseOptions) : await toPng(node, { ...baseOptions, pixelRatio: 2 });
		downloadDataUrl(`bgm-xswtier-${compactStamp()}.${format}`, dataUrl);
	} finally {
		for (const zone of markedEmpty) zone.removeAttribute(EXPORT_EXCLUDE_ATTR);
		images.forEach((img, i) => {
			const src = originalSrcs[i];
			if (src === null) img.removeAttribute('src');
			else img.setAttribute('src', src);
		});
	}
}
