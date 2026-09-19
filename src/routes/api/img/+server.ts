import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveProxiedTarget } from '$lib/utils/imageProxy';

// 封面图同源代理：lain CDN 不返回 CORS 头，浏览器端 html-to-image 无法跨域取字节，
// PNG 导出会缺封面。此路由仅放行 allowlist 主机的 GET，透传 content-type，15s 超时。
// 注意：这是公开端点，allowlist 是唯一防线，勿放宽为任意 URL。
export const GET: RequestHandler = async ({ url }) => {
	const target = resolveProxiedTarget(url.searchParams.get('url'));
	if (!target) {
		return json({ error: 'img proxy: host not allowed' }, { status: 400 });
	}
	let res: Response;
	try {
		res = await fetch(target, {
			headers: { 'User-Agent': 'BGM-xswtier/1.0 (dev)' },
			// 必须禁用重定向跟随：resolveProxiedTarget 只校验了首个 URL 的 host，
			// follow 时上游（或其被污染的 CDN 配置）能用 302 把本代理变成任意地址的取字节工具。
			// 目录封面是直链，无需重定向。
			redirect: 'manual',
			signal: AbortSignal.timeout(15_000),
		});
	} catch {
		return json({ error: 'img proxy: upstream unreachable' }, { status: 502 });
	}
	if (res.status >= 300 && res.status < 400) {
		// 不把 3xx 回给浏览器（会让它自行跳转，绕过 allowlist）
		return json({ error: 'img proxy: upstream redirect refused' }, { status: 502 });
	}
	if (!res.ok || !res.body) {
		// 归一为 502：对客户端而言语义是"本代理没能取到图"，不是上游自己的状态含义
		return json({ error: `img proxy failed: ${res.status}` }, { status: 502 });
	}
	const headers = new Headers();
	const contentType = res.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	headers.set('cache-control', 'public, max-age=86400');
	return new Response(res.body, { status: 200, headers });
};
