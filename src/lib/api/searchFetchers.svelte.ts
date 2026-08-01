import pLimit from 'p-limit';
import { pubClient } from './clients.svelte';
import { subjectLikeToItemData, fetchSubject } from './bgmFetchers.svelte';
import type { ItemData } from '$lib/schemas/item';
import type { SearchSubjectRequest } from '$lib/schemas/bgm-public-api';

export interface SearchParams {
	keyword?: string;
	tags?: string[];
	/** 分类：'TV'|'WEB'|'OVA'|'剧场版'|'动态漫画'|'其他'（'其他' 不发服务端，客户端排除已知值） */
	platform?: string;
	/** 来源/类型/地区 meta_tags（精确），如 ['日本']、['原创'] */
	metaTags?: string[];
	/** YYYY-MM-DD；to 会转成 `<to` 半开区间 */
	airDateFrom?: string;
	airDateTo?: string;
	limit?: number;
	offset?: number;
	/** match 匹配度 | heat 收藏人数 | rank 排名 | score 评分 */
	sort?: 'match' | 'heat' | 'rank' | 'score';
}

export interface SearchResult {
	/** 已按 platform 客户端二次过滤后的条目 */
	items: ItemData[];
	/** 服务端本页原始条数（未过滤）→ 组件据此递增 offset，规避二次过滤跳页 */
	rawCount: number;
	total: number;
}

/** 已知分类值（'其他' 用排除法：platform 不在其中即算其他） */
export const KNOWN_PLATFORMS = ['TV', 'WEB', 'OVA', '剧场版', '动态漫画'];

function buildAirDate(from?: string, to?: string): string[] {
	const arr: string[] = [];
	if (from) arr.push(`>=${from}`);
	if (to) arr.push(`<${to}`);
	return arr;
}

/** POST /v0/search/subjects → 完整 Subject 直接映射 ItemData（不二次请求） */
export async function searchSubjects(p: SearchParams): Promise<SearchResult> {
	const filter: NonNullable<SearchSubjectRequest['filter']> = {};
	if (p.platform && p.platform !== '其他') filter.platform = [p.platform]; // 分类
	if (p.metaTags?.length) filter.meta_tags = p.metaTags; // 来源/类型/地区
	if (p.tags?.length) filter.tag = p.tags; // 自定义标签
	const air_date = buildAirDate(p.airDateFrom, p.airDateTo);
	if (air_date.length) filter.air_date = air_date;

	const { data, error } = await pubClient.POST('/v0/search/subjects', {
		params: { query: { limit: p.limit ?? 100, offset: p.offset ?? 0 } },
		body: { keyword: p.keyword ?? '', filter, sort: p.sort }
	});
	if (error || !data) return { items: [], rawCount: 0, total: 0 };

	const raw = (data.data ?? []).map(subjectLikeToItemData).filter((i): i is ItemData => !!i);
	// 分类客户端二次过滤：服务端 platform 组合筛选可能混入其他值
	let items = raw;
	if (p.platform) {
		items = raw.filter((i) =>
			p.platform === '其他' ? !KNOWN_PLATFORMS.includes(i.platform ?? '') : i.platform === p.platform
		);
	}
	return { items, rawCount: raw.length, total: data.total ?? 0 };
}

/** 当前季首/季末日（半开区间 YYYY-MM-DD，如 2026-07-01 ~ 2026-10-01） */
export function currentSeasonRange(): [string, string] {
	const now = new Date();
	const y = now.getFullYear();
	const qStartMonth = Math.floor(now.getMonth() / 3) * 3 + 1; // 1|4|7|10
	const pad = (n: number) => String(n).padStart(2, '0');
	const start = `${y}-${pad(qStartMonth)}-01`;
	let ey = y,
		em = qStartMonth + 3;
	if (em > 12) {
		em = 1;
		ey += 1;
	}
	return [start, `${ey}-${pad(em)}-01`];
}

/** 本季在播：search + 本季 air_date + TV + 日本，客户端再滤 platform==='TV'。不传 keyword。 */
export async function fetchSeason(): Promise<ItemData[]> {
	const [from, to] = currentSeasonRange();
	const r = await searchSubjects({
		metaTags: ['日本'],
		platform: 'TV',
		airDateFrom: from,
		airDateTo: to,
		limit: 100
	});
	return r.items.filter((i) => i.platform === 'TV');
}

/** JS getDay()(0=Sun) → BGM weekday.id(1=Mon..7=Sun) */
export function getTodayWeekday(): number {
	const d = new Date().getDay();
	return d === 0 ? 7 : d;
}

/** 本日更新：calendar 今天组 → 并发取详情 → 滤 meta_tags 含「日本」。约 21 条。 */
export async function fetchToday(concurrency = 6): Promise<ItemData[]> {
	const weekdayId = getTodayWeekday();
	const { data, error } = await pubClient.GET('/calendar');
	if (error || !data) return [];
	const day = data.find((d) => d.weekday?.id === weekdayId);
	const seeds = (day?.items ?? []).map(subjectLikeToItemData).filter((i): i is ItemData => !!i);

	const limit = pLimit(concurrency); // 复用 p-limit（与 BatchLoader 同款并发控制）
	const detail = await Promise.all(
		seeds.map((s) =>
			limit(async () => {
				const full = await fetchSubject(s.bgm_id); // calendar 无地区字段 → 取详情判 meta_tags
				return full?.meta_tags?.includes('日本') ? full : undefined;
			})
		)
	);
	return detail.filter((i): i is ItemData => !!i);
}
