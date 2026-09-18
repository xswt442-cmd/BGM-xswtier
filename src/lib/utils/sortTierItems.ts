import type { ItemData, TierDef } from '$lib/schemas/item';

/** 档位内可排序字段 */
export type TierSortKey = 'score' | 'rating_total' | 'air_date' | 'name';

export const TIER_SORT_KEYS: TierSortKey[] = ['score', 'rating_total', 'air_date', 'name'];

/** 各字段的自然方向：分/人数/日期取"高者在前"，名称取 A→Z */
export const DEFAULT_SORT_DIRECTION: Record<TierSortKey, 'asc' | 'desc'> = {
	score: 'desc',
	rating_total: 'desc',
	air_date: 'desc',
	name: 'asc',
};

function sortValue(item: ItemData, key: TierSortKey): number | string | undefined {
	switch (key) {
		case 'score':
			return item.score;
		case 'rating_total':
			return item.rating_total;
		case 'air_date':
			return item.air_date; // 'YYYY-MM-DD' 字典序即时间序
		case 'name':
			return item.name_cn || item.name;
	}
}

/**
 * 对每个档位**内部**的条目就地排序，不动档位顺序、不跨档移动。
 *
 * 缺字段的条目稳定垫底（不参与比较、保持原有相对顺序）——避免"无评分条目"被当成 0
 * 排到最前，也避免 undefined 参与比较时结果不确定。
 *
 * 纯函数：返回全新数组，不改入参。
 */
export function sortItemsInTiers(
	tiers: TierDef[],
	key: TierSortKey,
	direction: 'asc' | 'desc' = DEFAULT_SORT_DIRECTION[key],
): TierDef[] {
	const sign = direction === 'asc' ? 1 : -1;

	return tiers.map((tier) => {
		const ranked: { item: ItemData; value: number | string }[] = [];
		const missing: ItemData[] = [];
		for (const item of tier.items) {
			const value = sortValue(item, key);
			if (value === undefined || value === '') missing.push(item);
			else ranked.push({ item, value });
		}
		ranked.sort((a, b) => {
			if (typeof a.value === 'number' && typeof b.value === 'number') return (a.value - b.value) * sign;
			return String(a.value).localeCompare(String(b.value), 'zh-Hans-CN') * sign;
		});
		return { ...tier, items: [...ranked.map((r) => r.item), ...missing] };
	});
}

/** 统计有多少档位真的会因为这次排序发生变化（用于播报"无变化"） */
export function countAffectedTiers(tiers: TierDef[], key: TierSortKey, direction: 'asc' | 'desc'): number {
	const next = sortItemsInTiers(tiers, key, direction);
	let changed = 0;
	for (let i = 0; i < tiers.length; i++) {
		const before = tiers[i].items.map((item) => item.id).join('|');
		const after = next[i].items.map((item) => item.id).join('|');
		if (before !== after) changed++;
	}
	return changed;
}
