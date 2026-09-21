/**
 * 浏览器下载工具：把文本或 data URL 交给一个临时 <a> 触发下载。
 * 不依赖任何 Svelte 状态，导出路径与页面无耦合。
 */

/** 触发文本文件下载；mime 统一补 charset=utf-8，避免中文内容乱码 */
export function downloadTextFile(filename: string, text: string, mime = 'text/plain'): void {
	const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
	downloadHref(filename, url);
	URL.revokeObjectURL(url);
}

/** 触发 data URL 下载（html-to-image 的产物就是 data URL，不需要 ObjectURL） */
export function downloadDataUrl(filename: string, dataUrl: string): void {
	downloadHref(filename, dataUrl);
}

function downloadHref(filename: string, href: string): void {
	const anchor = document.createElement('a');
	anchor.href = href;
	anchor.download = filename;
	anchor.click();
}

/** 日期戳 `2026-09-21`，用于 JSON / Markdown 这类按天区分就够了的名字 */
export function dateStamp(now = new Date()): string {
	return now.toISOString().slice(0, 10);
}

/**
 * 紧凑时间戳 `202609211030`（日期 + 时分，中间无分隔符），精确到分钟。
 * 图片导出用它：同一天可能导出多份，带时间才不至于互相覆盖。
 */
export function compactStamp(now = new Date()): string {
	return now.toISOString().slice(0, 16).replace(/[-T:]/g, '');
}
