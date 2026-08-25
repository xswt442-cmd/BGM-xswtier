// PNG 导出的封面代理工具：lain CDN（Cloudflare）不返回任何 CORS 头，
// html-to-image 的跨域 fetch 拿不到图片字节，导出图会整块缺封面。
// 解法：导出期间把 <img> 的 src 临时改写到同源 /api/img 代理，由服务端取回字节。

const ALLOWED_HOSTS = new Set(['lain.bgm.tv']);

export function isAllowedImageHost(url: string): boolean {
	try {
		const u = new URL(url);
		return (u.protocol === 'https:' || u.protocol === 'http:') && ALLOWED_HOSTS.has(u.hostname);
	} catch {
		return false;
	}
}

/** 浏览器端：把图片地址改写为同源代理 URL；不在允许名单/已是本地引用时返回 null（保留原图） */
export function toProxiedImageUrl(src: string | null | undefined): string | null {
	if (!src || src.startsWith('data:') || src.startsWith('/')) return null;
	if (!isAllowedImageHost(src)) return null;
	return `/api/img?url=${encodeURIComponent(src)}`;
}

/** 服务端：校验 ?url= 查询参数并还原上游地址；非法/越权返回 null */
export function resolveProxiedTarget(raw: string | null): string | null {
	if (!raw) return null;
	if (!isAllowedImageHost(raw)) return null;
	return raw;
}
