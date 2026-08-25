import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// p1 老 API（next.bgm.tv）不返回 CORS 头，浏览器直连会被挡。
// 此代理只做一件事：把同源 GET 转发到 next.bgm.tv 的用户目录接口，
// 客户端带上的 Authorization 头原样透传给上游（无 token 也能列公开目录）。
const MAX_LIMIT = 100;

export const GET: RequestHandler = async ({ params, url, request }) => {
	const username = params.username;
	const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
	const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit')) || 20), MAX_LIMIT);

	const headers: Record<string, string> = { 'User-Agent': 'BGM-xswtier/1.0 (dev)' };
	const auth = request.headers.get('authorization');
	if (auth) headers['Authorization'] = auth;

	const target = `https://next.bgm.tv/p1/users/${encodeURIComponent(username)}/indexes?limit=${limit}&offset=${offset}`;
	let res: Response;
	try {
		res = await fetch(target, { headers, signal: AbortSignal.timeout(15_000) });
	} catch {
		// DNS/连接失败等网络层异常：返回与下方错误分支一致的 JSON 结构，而非 SvelteKit 默认 500 页
		return json({ error: 'p1 indexes proxy: upstream unreachable' }, { status: 502 });
	}
	if (!res.ok) {
		return json({ error: `p1 indexes proxy failed: ${res.status}` }, { status: res.status });
	}
	let body: unknown;
	try {
		body = await res.json();
	} catch {
		return json({ error: 'p1 indexes proxy: invalid upstream response' }, { status: 502 });
	}
	return json(body);
};
