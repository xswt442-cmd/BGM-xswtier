import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// p1 老 API（next.bgm.tv）不返回 CORS 头，浏览器直连会被挡。
// 与同目录 /indexes 代理同构，转发的是「用户收藏的目录」——年度精选等
// 官方/他人目录走这里枚举（自建目录走 /indexes），客户端无需再手动输 ID。
const MAX_LIMIT = 100;

export const GET: RequestHandler = async ({ params, url, request }) => {
	const username = params.username;
	const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
	const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit')) || 20), MAX_LIMIT);

	const headers: Record<string, string> = { 'User-Agent': 'BGM-xswtier/1.0 (dev)' };
	const auth = request.headers.get('authorization');
	if (auth) headers['Authorization'] = auth;

	const target = `https://next.bgm.tv/p1/users/${encodeURIComponent(username)}/collections/indexes?limit=${limit}&offset=${offset}`;
	let res: Response;
	try {
		res = await fetch(target, { headers, signal: AbortSignal.timeout(15_000) });
	} catch {
		return json({ error: 'p1 collected indexes proxy: upstream unreachable' }, { status: 502 });
	}
	if (!res.ok) {
		return json({ error: `p1 collected indexes proxy failed: ${res.status}` }, { status: res.status });
	}
	let body: unknown;
	try {
		body = await res.json();
	} catch {
		return json({ error: 'p1 collected indexes proxy: invalid upstream response' }, { status: 502 });
	}
	return json(body);
};
