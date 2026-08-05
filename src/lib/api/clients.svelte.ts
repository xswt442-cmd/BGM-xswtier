import createClient from 'openapi-fetch';
import type { paths, Paged_SlimIndex } from '$lib/schemas/bgm-public-api';
import { apiToken } from '$lib/states/token.svelte';

// 在 fetch 层注入 token，业务代码无感；无 token 时静默降级匿名请求。
// 请求时才读 apiToken.token（$state getter），不捕获模块加载时的值。
const authFetch: typeof fetch = async (url, init) => {
	const headers = new Headers(init?.headers);
	if (apiToken.hasToken) headers.set('Authorization', `Bearer ${apiToken.token}`);
	return fetch(url, { ...init, headers });
};

export const pubClient = createClient<paths>({
	baseUrl: 'https://api.bgm.tv/',
	fetch: authFetch
});

// 同源 server 代理客户端：p1 老 API（next.bgm.tv）不返回 CORS 头，浏览器直连被挡，
// 统一走 src/routes/api/p1/... 转发，Authorization 头由服务端透传给上游。
type LocalPaths = {
	'/api/p1/users/{username}/indexes': {
		get: {
			parameters: { path: { username: string }; query?: { limit?: number; offset?: number } };
			responses: {
				200: { content: { 'application/json': Paged_SlimIndex } };
			};
		};
	};
};

export const localClient = createClient<LocalPaths>({
	baseUrl: '',
	fetch: authFetch
});
