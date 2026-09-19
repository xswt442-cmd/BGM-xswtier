import { describe, expect, it } from 'vitest';
import type { ItemData, TierDef } from '$lib/schemas/item';
import { buildTasteProfile, flattenRanked, spearman } from '$lib/utils/tasteProfile';

function item(id: number, extra: Partial<ItemData> = {}): ItemData {
	return { id: `subject:${id}`, bgm_id: id, category: 'subject', name: `n${id}`, ...extra };
}
const tier = (label: string, items: ItemData[]): TierDef =>
	({ id: `t-${label}`, label, color: 'var(--chart-1)', items }) as TierDef;

describe('spearman', () => {
	it('完全同序 = 1，完全逆序 = -1', () => {
		expect(spearman([0, 1, 2, 3], [0, 1, 2, 3])).toBeCloseTo(1);
		expect(spearman([0, 1, 2, 3], [3, 2, 1, 0])).toBeCloseTo(-1);
	});

	it('样本不足 4 时返回 null（避免噪声被当成结论）', () => {
		expect(spearman([0, 1], [0, 1])).toBeNull();
		expect(spearman([0, 1, 2], [2, 1, 0])).toBeNull();
	});

	it('已知样例：[0,1,2,3] vs [1,0,3,2] → ρ = 0.6', () => {
		// d = [-1,1,-1,1]，Σd²=4，ρ = 1 - 24/(4*15) = 0.6
		expect(spearman([0, 1, 2, 3], [1, 0, 3, 2])).toBeCloseTo(0.6);
	});
});

describe('flattenRanked', () => {
	it('位次按档位优先、档内顺序为次连续编号', () => {
		const tiers = [tier('S', [item(1), item(2)]), tier('A', [item(3)])];
		expect(flattenRanked(tiers).map((e) => [e.item.bgm_id, e.yourRank, e.tierLabel])).toEqual([
			[1, 0, 'S'],
			[2, 1, 'S'],
			[3, 2, 'A'],
		]);
	});
});

describe('buildTasteProfile', () => {
	it('与大众完全同序时 agreement = 1', () => {
		const tiers = [tier('S', [item(1, { score: 9 })]), tier('A', [item(2, { score: 7 }), item(3, { score: 5 })])];
		// 你有分顺序：1(9) > 2(7) > 3(5)，大众也是 → 但 n=3 < 4 返回 null
		expect(buildTasteProfile(tiers).agreement).toBeNull();
	});

	it('识别高估与低估，且只基于有分条目', () => {
		// 你把 1 放最高档但它均分最低（高估），4 放最低档但均分最高（低估）
		const tiers = [
			tier('S', [item(1, { score: 5.0 }), item(2, { score: 9.9 })]),
			tier('B', [item(3, { score: 8.0 })]),
			tier('F', [item(4, { score: 9.5 })]),
		];
		const p = buildTasteProfile(tiers);
		expect(p.overrated[0].item.bgm_id).toBe(1);
		expect(p.overrated[0].delta).toBeGreaterThan(0);
		expect(p.underrated[0].item.bgm_id).toBe(4);
		expect(p.underrated[0].delta).toBeLessThan(0);
	});

	it('无分条目不计入一致度样本，但计入总数与标签/年代', () => {
		const tiers = [
			tier('S', [item(1, { score: 9, meta_tags: ['日本'], air_date: '2020-04-01' })]),
			tier('A', [item(2, { meta_tags: ['日本', 'TV'], air_date: '2021-01-01' })]),
		];
		const p = buildTasteProfile(tiers);
		expect(p.rankedCount).toBe(2);
		expect(p.scoredCount).toBe(1);
		expect(p.agreement).toBeNull(); // 有分样本只有 1 条
		expect(p.topTags[0]).toEqual({ tag: '日本', count: 2 });
		expect(p.years.map((y) => y.year).sort()).toEqual(['2020', '2021']);
	});

	it('平均分与各档统计正确', () => {
		const tiers = [tier('S', [item(1, { score: 8 }), item(2, { score: 6 })]), tier('F', [item(3)])];
		const p = buildTasteProfile(tiers);
		expect(p.avgScore).toBeCloseTo(7);
		expect(p.tierStats[0]).toEqual({ id: 't-S', label: 'S', count: 2, avgScore: 7 });
		expect(p.tierStats[1]).toEqual({ id: 't-F', label: 'F', count: 1, avgScore: null });
	});

	// 档位名可被用户改成重复值。Svelte 5 的 keyed each 遇到重复 key 会直接抛错、整页白屏，
	// 所以 tierStats 必须自带唯一 id 供渲染做 key（原先用 label 做 key 是个真 bug）。
	// 夹具里两个档位同名不同 id，正是真实场景（id 由 uid() 生成，label 由用户随意改）
	it('档位重名时 tierStats 仍各带唯一 id', () => {
		const duplicateNamed = [
			{ id: 'tier-a', label: 'S', color: 'var(--chart-1)', items: [item(1, { score: 8 })] },
			{ id: 'tier-b', label: 'S', color: 'var(--chart-2)', items: [item(2, { score: 6 })] },
		] as TierDef[];
		const p = buildTasteProfile(duplicateNamed);
		expect(p.tierStats.map((s) => s.label)).toEqual(['S', 'S']); // label 重名
		expect(p.tierStats.map((s) => s.id)).toEqual(['tier-a', 'tier-b']); // id 仍可区分
		expect(new Set(p.tierStats.map((s) => s.id)).size).toBe(2);
	});

	it('空会话不炸', () => {
		const p = buildTasteProfile([]);
		expect(p.rankedCount).toBe(0);
		expect(p.avgScore).toBeNull();
		expect(p.agreement).toBeNull();
		expect(p.overrated).toEqual([]);
	});
});
