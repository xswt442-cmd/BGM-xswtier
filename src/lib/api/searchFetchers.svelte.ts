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
	/** 评分下界（>=from）；to 会转成 `<to` 半开区间（0.0–10.0） */
	ratingFrom?: number;
	ratingTo?: number;
	/** 评分人数下界（>=min），无上界 */
	ratingCountMin?: number;
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

	// 评分区间（半开 [from, to)）与评分人数下界，格式同 air_date：>=6 / <8
	const rating: string[] = [];
	if (p.ratingFrom != null && Number.isFinite(p.ratingFrom)) rating.push(`>=${p.ratingFrom}`);
	if (p.ratingTo != null && Number.isFinite(p.ratingTo)) rating.push(`<${p.ratingTo}`);
	if (rating.length) filter.rating = rating;

	const ratingCount: string[] = [];
	if (p.ratingCountMin != null && Number.isFinite(p.ratingCountMin))
		ratingCount.push(`>=${p.ratingCountMin}`);
	if (ratingCount.length) filter.rating_count = ratingCount;

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

/**
 * 本季在播：search + 本季 air_date + tag:['TV'] + 日本，循环分页拉全。
 * 注意：platform 服务端筛选不可靠（混入 WEB/剧场版），改用 tag:['TV']；
 * API 一页实际只返回 20 条，需按 offset 循环直到取完。
 */
export async function fetchSeason(): Promise<ItemData[]> {
	const [from, to] = currentSeasonRange();
	const filter: NonNullable<SearchSubjectRequest['filter']> = {
		type: [2],
		tag: ['TV'],
		meta_tags: ['日本'],
		air_date: [`>=${from}`, `<${to}`]
	};
	const PAGE = 20;
	const all: ItemData[] = [];
	for (let offset = 0; offset < 300; offset += PAGE) {
		const { data, error } = await pubClient.POST('/v0/search/subjects', {
			params: { query: { limit: PAGE, offset } },
			body: { keyword: '', filter, sort: 'rank' }
		});
		if (error || !data) break;
		const items = (data.data ?? [])
			.map(subjectLikeToItemData)
			.filter((i): i is ItemData => !!i);
		all.push(...items);
		// total 可能不准，用返回为空兜底；最多拉 300 条防死循环
		if (items.length < PAGE || offset >= (data.total ?? 0)) break;
	}
	// 去重（分页可能重叠）+ 客户端过滤 platform==='TV'（tag:['TV'] 基本精确但含少量非 TV）
	const seen = new Set<string>();
	return all.filter((i) => i.platform === 'TV' && (seen.has(i.id) ? false : (seen.add(i.id), true)));
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
