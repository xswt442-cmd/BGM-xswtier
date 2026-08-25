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
			signal: AbortSignal.timeout(15_000),
		});
	} catch {
		return json({ error: 'img proxy: upstream unreachable' }, { status: 502 });
	}
	if (!res.ok || !res.body) {
		return json({ error: `img proxy failed: ${res.status}` }, { status: res.status });
	}
	const headers = new Headers();
	const contentType = res.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	headers.set('cache-control', 'public, max-age=86400');
	return new Response(res.body, { status: 200, headers });
};
