import createClient from 'openapi-fetch';
import type { paths } from '$lib/schemas/bgm-public-api';
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
