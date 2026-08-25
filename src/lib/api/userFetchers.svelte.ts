import { pubClient, localClient } from './clients.svelte';
import type { Me, SlimIndex } from '$lib/schemas/bgm-public-api';

/** 当前 token 对应用户信息（token 缺失/无效 → undefined） */
export async function fetchMe(): Promise<Me | undefined> {
	const { data, error } = await pubClient.GET('/v0/me');
	if (error || !data) return undefined;
	return data;
}

/**
 * 某用户自建的目录列表（经同源 /api/p1 代理转发，浏览器不能直连 next.bgm.tv）。
 * 失败直接抛错（HTTP 错误或网络异常），由调用方决定降级策略。
 */
export async function fetchUserIndexes(username: string): Promise<SlimIndex[]> {
	const { data, error } = await localClient.GET('/api/p1/users/{username}/indexes', {
		params: { path: { username }, query: { limit: 100, offset: 0 } },
	});
	if (error || !data) throw new Error('p1 indexes fetch failed');
	return data.data ?? [];
}

/**
 * 某用户收藏的目录列表（年度精选等官方/他人目录在此枚举，经同源 /api/p1 代理）。
 * 失败直接抛错，由调用方决定降级策略。
 */
export async function fetchUserCollectedIndexes(username: string): Promise<SlimIndex[]> {
	const { data, error } = await localClient.GET('/api/p1/users/{username}/collections/indexes', {
		params: { path: { username }, query: { limit: 100, offset: 0 } },
	});
	if (error || !data) throw new Error('p1 collected indexes fetch failed');
	return data.data ?? [];
}
