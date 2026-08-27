import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// 前端错误上报接收端：serverless 无持久化，落地为结构化 stderr → Vercel 日志面板可查。
// 仅接受受限形状的小 JSON；聚合与限流由客户端负责（去重 + 单会话上限）。
const MAX_BODY = 4_000;

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		const text = await request.text();
		if (text.length > MAX_BODY) return json({ ok: false }, { status: 413 });
		body = JSON.parse(text);
	} catch {
		return json({ ok: false }, { status: 400 });
	}
	if (typeof body !== 'object' || body === null) return json({ ok: false }, { status: 400 });
	const o = body as Record<string, unknown>;
	const entry = {
		t: new Date().toISOString(),
		level: typeof o.level === 'string' ? o.level.slice(0, 20) : 'error',
		message: typeof o.message === 'string' ? o.message.slice(0, 600) : '(no message)',
		stack: typeof o.stack === 'string' ? o.stack.slice(0, 200) : '',
		source: typeof o.source === 'string' ? o.source.slice(0, 60) : '',
		url: typeof o.url === 'string' ? o.url.slice(0, 120) : '',
	};
	console.error('[client-error]', JSON.stringify(entry));
	return json({ ok: true });
};
