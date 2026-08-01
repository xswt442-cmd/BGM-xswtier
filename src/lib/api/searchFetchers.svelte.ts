import { pubClient } from './clients.svelte';
import { subjectLikeToItemData } from './bgmFetchers.svelte';
import type { ItemData } from '$lib/schemas/item';
import type { SearchSubjectRequest } from '$lib/schemas/bgm-public-api';

export interface SearchParams {
	keyword?: string;
	tags?: string[];
	/** YYYY-MM-DD；to 会转成 `<to` 半开区间 */
	airDateFrom?: string;
	airDateTo?: string;
	limit?: number;
	offset?: number;
	/** match 匹配度 | heat 收藏人数 | rank 排名 | score 评分 */
	sort?: 'match' | 'heat' | 'rank' | 'score';
}

export interface SearchResult {
	items: ItemData[];
	total: number;
}

/** POST /v0/search/subjects → 完整 Subject 直接映射 ItemData（不二次请求） */
export async function searchSubjects(p: SearchParams): Promise<SearchResult> {
	const air_date: string[] = [];
	if (p.airDateFrom) air_date.push(`>=${p.airDateFrom}`);
	if (p.airDateTo) air_date.push(`<${p.airDateTo}`);
	const filter: NonNullable<SearchSubjectRequest['filter']> = {};
	if (p.tags?.length) filter.tag = p.tags;
	if (air_date.length) filter.air_date = air_date;

	const { data, error } = await pubClient.POST('/v0/search/subjects', {
		params: { query: { limit: p.limit ?? 100, offset: p.offset ?? 0 } },
		body: { keyword: p.keyword ?? '', filter, sort: p.sort }
	});
	if (error || !data) return { items: [], total: 0 };
	return {
		items: (data.data ?? []).map(subjectLikeToItemData).filter((i): i is ItemData => !!i),
		total: data.total ?? 0
	};
}

/** GET /calendar → 展平按星期分组 + 去重 → 本季在播全集 */
export async function fetchCalendar(): Promise<ItemData[]> {
	const { data, error } = await pubClient.GET('/calendar');
	if (error || !data) return [];
	const seen = new Set<string>();
	const out: ItemData[] = [];
	for (const day of data) {
		for (const s of day.items ?? []) {
			const item = subjectLikeToItemData(s);
			if (item && !seen.has(item.id)) {
				seen.add(item.id);
				out.push(item);
			}
		}
	}
	return out;
}

/**
 * 今日热门 → v0 search `sort: 'heat'`（收藏人数排序）+ 动画类型。
 * 注：老 `/p1/trending/subjects` 已废弃（返回 {"code":404}），改走 search 替代。
 */
export async function fetchTrending(limit = 50): Promise<ItemData[]> {
	const r = await searchSubjects({ sort: 'heat', limit });
	return r.items;
}
