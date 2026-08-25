import pLimit from 'p-limit';
import { pubClient } from './clients.svelte';
import type { Subject, SlimSubject, LegacySubjectSmall } from '$lib/schemas/bgm-public-api';
import type { ItemData, ItemIdentity } from '$lib/schemas/item';

/** 目录/收藏分页拉取的并发上限（匿名额度 ~30 req/min，全并发易触发 429） */
const PAGE_FETCH_CONCURRENCY = 4;

/** 任意 Subject 变体（完整 Subject / SlimSubject / Legacy_SubjectSmall）→ ItemData */
export type SubjectLike = Pick<
	Partial<Subject>,
	'id' | 'name' | 'name_cn' | 'date' | 'images' | 'eps' | 'platform' | 'meta_tags'
> &
	Partial<Pick<SlimSubject, 'score'>> &
	Partial<Pick<LegacySubjectSmall, 'air_date' | 'eps_count'>> & {
		rating?: { score?: number; total?: number };
	};

export function subjectLikeToItemData(s: SubjectLike): ItemData | undefined {
	if (!s.id) return undefined;
	return {
		bgm_id: s.id,
		category: 'subject',
		id: `subject:${s.id}`,
		name: s.name || 'Unknown',
		name_cn: s.name_cn || undefined,
		image: s.images?.small,
		score: s.score ?? s.rating?.score, // SlimSubject 顶层 score；Subject/Legacy 用 rating.score
		rating_total: s.rating?.total,
		eps: s.eps ?? s.eps_count,
		air_date: s.date ?? s.air_date,
		platform: s.platform, // calendar 条目 LegacySubjectSmall 无此字段 → undefined
		meta_tags: s.meta_tags,
	};
}

export async function fetchSubject(subject_id: number): Promise<ItemData | undefined> {
	const { data, error } = await pubClient.GET('/v0/subjects/{subject_id}', {
		params: { path: { subject_id } },
	});
	if (error || !data) return undefined;
	return subjectLikeToItemData(data);
}

/** 按 ItemIdentity 加载完整条目（当前仅 subject 一类，category 为扩展保留） */
export async function fetchItemByIdentity(item: ItemIdentity): Promise<ItemData | undefined> {
	if (item.category === 'subject') return fetchSubject(item.bgm_id);
	return undefined;
}

/**
 * 用户名模式：拉取该用户「已看完」的动画收藏（type=2 看过, subject_type=2 动画），全量不分年份。
 * 早期版本只收「当前年」条目（subject.date 以当年开头）导致 pool 几乎为空，改为全量。
 * 分页：先取首页拿 total，再并发拉剩余页。并发用 p-limit 压制（匿名 ~30 req/min，
 * 大收藏几十页若全并发会瞬间触发 429）；个别页失败只跳过该页，不整体作废。
 */
export async function fetchUserCollection(username: string): Promise<ItemIdentity[] | undefined> {
	const limit = 50;
	const query = { type: 2, subject_type: 2, limit, offset: 0 } as const;
	const { data: firstPage, error } = await pubClient.GET('/v0/users/{username}/collections', {
		params: { path: { username }, query },
	});
	if (error || !firstPage) return undefined;
	const total = firstPage?.total ?? 0;
	const items: ItemIdentity[] = [];

	function collect(page: { data?: { subject_id: number }[] } | undefined) {
		for (const c of page?.data ?? []) {
			items.push({ bgm_id: c.subject_id, category: 'subject' });
		}
	}
	collect(firstPage);

	if (total > limit) {
		const pageCount = Math.ceil(total / limit) - 1;
		const plimit = pLimit(PAGE_FETCH_CONCURRENCY);
		const pages = await Promise.all(
			Array.from({ length: pageCount }, (_, i) =>
				plimit(() =>
					pubClient.GET('/v0/users/{username}/collections', {
						params: { path: { username }, query: { ...query, offset: (i + 1) * limit } },
					}),
				),
			),
		);
		for (const page of pages) collect(page.data);
	}
	return items;
}
