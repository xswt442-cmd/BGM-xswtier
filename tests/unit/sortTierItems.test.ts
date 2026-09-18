import { describe, expect, it } from 'vitest';
import type { ItemData, TierDef } from '$lib/schemas/item';
import {
	countAffectedTiers,
	DEFAULT_SORT_DIRECTION,
	sortItemsInTiers,
} from '$lib/utils/sortTierItems';

function item(id: number, extra: Partial<ItemData> = {}): ItemData {
	return { id: `subject:${id}`, bgm_id: id, category: 'subject', name: `n${id}`, ...extra };
}
const tier = (label: string, items: ItemData[]): TierDef =>
	({ id: `t-${label}`, label, color: 'var(--chart-1)', items }) as TierDef;

const tiers = [
	tier('S', [item(1, { score: 6.1 }), item(2, { score: 8.8 }), item(3, { score: 7.5 })]),
	tier('A', [item(4, { score: 5.0 })]),
];

const ids = (t: TierDef[]) => t.map((x) => x.items.map((i) => i.bgm_id));

describe('sortItemsInTiers', () => {
	it('按评分降序重排（自然方向），不跨档移动', () => {
		const next = sortItemsInTiers(tiers, 'score');
		expect(ids(next)).toEqual([
			[2, 3, 1],
			[4],
		]);
		expect(next[0].label).toBe('S'); // 档位本身不动
	});

	it('缺字段的条目稳定垫底，不当成 0 排到最前', () => {
		const mixed = [tier('S', [item(1), item(2, { score: 7.0 }), item(3)])];
		const next = sortItemsInTiers(mixed, 'score');
		expect(ids(next)).toEqual([[2, 1, 3]]); // 无分条目保序垫底
	});

	it('按开播日期降序（新在前）', () => {
		const t = [tier('S', [item(1, { air_date: '2020-01-01' }), item(2, { air_date: '2024-07-01' })])];
		expect(ids(sortItemsInTiers(t, 'air_date'))).toEqual([[2, 1]]);
	});

	it('按名称升序时中文名优先', () => {
		const t = [tier('S', [item(1, { name: 'B', name_cn: '乙' }), item(2, { name: 'A', name_cn: '甲' })])];
		expect(ids(sortItemsInTiers(t, 'name'))).toEqual([[2, 1]]); // 甲 < 乙
	});

	it('纯函数：不改入参', () => {
		const snapshot = JSON.stringify(tiers);
		sortItemsInTiers(tiers, 'score');
		expect(JSON.stringify(tiers)).toBe(snapshot);
	});

	it('countAffectedTiers 只统计真正变化的档位', () => {
		const already = [tier('S', [item(1, { score: 9 }), item(2, { score: 7 })]), tier('A', [item(3, { score: 5 })])];
		expect(countAffectedTiers(already, 'score', DEFAULT_SORT_DIRECTION.score)).toBe(0);
		expect(countAffectedTiers(tiers, 'score', DEFAULT_SORT_DIRECTION.score)).toBe(1); // 只有 S 档变
	});
});
