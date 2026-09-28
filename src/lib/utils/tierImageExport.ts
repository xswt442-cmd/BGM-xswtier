import { downloadDataUrl, compactStamp } from '$lib/utils/download';
import { toProxiedImageUrl } from '$lib/utils/imageProxy';

/**
 * 榜单 DOM → 图片。支持光栅（PNG 2×）与矢量（SVG，印刷/无损缩放用）。
 *
 * 一切改写都在**离屏克隆体**上做，原始节点全程只读。
 *
 * 之所以不用"改原 DOM 再在 finally 里还原"：封面要改写成同源代理地址才能取到字节，
 * 而一旦某个封面请求挂起（代理慢、上游不通），等图片的 `decode()` 就永远不 settle，
 * finally 不会执行 —— 页面所有封面**永久停在代理地址**（表现为"全部变成同一张裂图"），
 * 调用方的"导出中"状态也复位不了，后续导出全部失效。克隆后导出对页面零副作用，
 * 成功、失败、挂起都不留痕。
 *
 * 失败时原样抛出，由调用方决定给用户看什么文案。
 */

/** 渲染层用这个属性把节点排除在导出之外（工具栏、占位、外链角标等） */
const EXPORT_EXCLUDE_ATTR = 'data-export-exclude';

/** 档位行的稳定标识，用于 skipEmpty 时判断档位里有没有条目 */
const TIER_ZONE_SELECTOR = '[data-testid="tier-zone"]';

/** 条目卡的标识；drag shadow 只在拖拽瞬间出现，导出时不会命中 */
const ITEM_SELECTOR = '[data-item-id]';

/** 等字体与封面就绪的上限：属于"最好等到"，等不到也必须继续 */
const READY_TIMEOUT_MS = 8_000;

/** 渲染本身的上限：保证导出函数一定会返回，否则调用方的"导出中"状态会永久卡住 */
const RENDER_TIMEOUT_MS = 30_000;

export interface TierImageExportOptions {
	format: 'png' | 'svg';
	/** 跳过没有任何条目的档位整行——比克隆 DOM 再删节点简单，也不会产生截图前后的布局抖动 */
	skipEmpty?: boolean;
	/** 就绪/渲染超时覆盖项；默认取上面的常量，测试用它把等待缩短 */
	timeouts?: { ready?: number; render?: number };
}

/** 到点就放行（不 reject）：超时只是不再等它，不代表失败 */
function settleWithin(promise: Promise<unknown>, ms: number): Promise<void> {
	return Promise.race([
		promise.then(
			() => undefined,
			() => undefined,
		),
		new Promise<void>((resolve) => setTimeout(resolve, ms)),
	]);
}

/** 到点就抛错：用于必须有结果、否则调用方状态会卡死的环节 */
function rejectAfter<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))]);
}

export async function exportTierImage(node: HTMLElement, options: TierImageExportOptions): Promise<void> {
	const { format, skipEmpty = false } = options;
	const readyMs = options.timeouts?.ready ?? READY_TIMEOUT_MS;
	const renderMs = options.timeouts?.render ?? RENDER_TIMEOUT_MS;

	// 克隆体必须离屏渲染，且显式给与原节点相同的宽度——否则 flex 布局会塌成另一种形态
	const { width } = node.getBoundingClientRect();
	const host = document.createElement('div');
	host.setAttribute('aria-hidden', 'true');
	// 导出期间克隆体也带 data-item-id，标记出来便于测试/调试把它与真实页面区分开
	host.setAttribute('data-export-host', '');
	host.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;pointer-events:none;`;
	const clone = node.cloneNode(true) as HTMLElement;
	host.appendChild(clone);
	document.body.appendChild(host);

	try {
		// lain CDN 没有 CORS 头，html-to-image 的跨域 fetch 取不到封面字节 → 导出图缺封面。
		// 只在克隆体上把图片改写成同源代理地址。
		const images = [...clone.querySelectorAll('img')];
		for (const img of images) {
			const proxied = toProxiedImageUrl(img.getAttribute('src'));
			if (proxied) img.setAttribute('src', proxied);
			// 卡片本身是 loading="lazy"：离屏容器不可见，不改 eager 就永远不开始加载
			img.loading = 'eager';
		}

		if (skipEmpty) {
			for (const zone of clone.querySelectorAll<HTMLElement>(TIER_ZONE_SELECTOR)) {
				if (!zone.querySelector(ITEM_SELECTOR)) zone.setAttribute(EXPORT_EXCLUDE_ATTR, '');
			}
		}

		await Promise.all([
			settleWithin(document.fonts.ready, readyMs),
			settleWithin(
				Promise.all(
					// decode 不是所有环境都有（happy-dom 等），缺了就当作已就绪
					images.map((img) => (typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve())),
				),
				readyMs,
			),
		]);

		// 动态引入：导出不是进页必需，避免 html-to-image 计入 tier 页首包
		const { toPng, toSvg } = await import('html-to-image');
		const baseOptions = {
			cacheBust: true,
			// 字体已全部同源自托管（Press Start 2P + Fusion Pixel），可安全嵌入导出图并保持像素观感；
			// 此前 skipFonts:true 是 Google Fonts 外链时代的权宜之计
			backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
			filter: (target: Node) => !(target instanceof HTMLElement && target.hasAttribute(EXPORT_EXCLUDE_ATTR)),
		};
		const dataUrl = await rejectAfter(
			format === 'svg' ? toSvg(clone, baseOptions) : toPng(clone, { ...baseOptions, pixelRatio: 2 }),
			renderMs,
			'tier image render timed out',
		);
		downloadDataUrl(`bgm-xswtier-${compactStamp()}.${format}`, dataUrl);
	} finally {
		host.remove();
	}
}
