import { describe, expect, it } from 'vitest';
import type { ItemData, TierDef } from '$lib/schemas/item';
import { distributeByScore, distributeByThresholds, THRESHOLD_PRESETS } from '$lib/utils/autoDistribute';

const scored = (id: number, score: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `S${id}`,
	score,
});
const plain = (id: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `S${id}`,
});
const tier = (id: string, items: ItemData[] = []): TierDef => ({
	id,
	label: id,
	color: 'var(--chart-1)',
	items,
});

describe('distributeByScore', () => {
	it('按得分降序均匀切档，首档拿最高分段', () => {
		const tiers = [tier('a'), tier('b'), tier('c')];
		const pool = [7, 3, 9, 5, 8, 6, 4].map((s, i) => scored(i + 1, s)); // 乱序输入
		const result = distributeByScore(tiers, pool);
		expect(result.tiers[0].items.map((x) => x.score)).toEqual([9, 8, 7]);
		expect(result.tiers[1].items.map((x) => x.score)).toEqual([6, 5]);
		expect(result.tiers[2].items.map((x) => x.score)).toEqual([4, 3]);
	});

	it('无分条目垫底最后档末尾', () => {
		const tiers = [tier('a'), tier('b')];
		const pool = [scored(1, 8), plain(2), scored(3, 5), plain(4)];
		const result = distributeByScore(tiers, pool);
		expect(result.tiers[0].items.map((x) => x.id)).toEqual(['subject:1']);
		expect(result.tiers[1].items.map((x) => x.id)).toEqual(['subject:3', 'subject:2', 'subject:4']);
	});

	it('保留各档已有内容与属性，新条目追加在后', () => {
		const existing = scored(99, 9.9);
		const tiers = [tier('a', [existing]), tier('b')];
		const result = distributeByScore(tiers, [scored(1, 5)]);
		expect(result.tiers[0].items[0]).toBe(existing);
		expect(result.tiers[0].label).toBe('a');
		expect(result.tiers[0].items.at(-1)?.id).toBe('subject:1');
		expect(result.tiers[1].items).toHaveLength(0);
	});

	it('空集合为无害 no-op，单档也不炸', () => {
		const tiers = [tier('a', [plain(1)])];
		const result = distributeByScore(tiers, []);
		expect(result.tiers[0].items.map((x) => x.id)).toEqual(['subject:1']);
		expect(distributeByScore([tier('only')], [scored(1, 7), scored(2, 3)]).tiers[0].items).toHaveLength(2);
	});
});

describe('distributeByThresholds', () => {
	const fiveTiers = () => [tier('s'), tier('a'), tier('b'), tier('c'), tier('d')];

	it('按绝对阈值落档，等于阈值的算进上一档', () => {
		const pool = [9.3, 8.5, 8.4, 8.0, 7.9, 7.5, 7.4, 5.0].map((s, i) => scored(i + 1, s));
		const result = distributeByThresholds(fiveTiers(), pool, THRESHOLD_PRESETS.standard);
		// standard = [8.5, 8.0, 7.5, 7.0]
		expect(result.tiers[0].items.map((x) => x.score)).toEqual([9.3, 8.5]);
		expect(result.tiers[1].items.map((x) => x.score)).toEqual([8.4, 8.0]);
		expect(result.tiers[2].items.map((x) => x.score)).toEqual([7.9, 7.5]);
		expect(result.tiers[3].items.map((x) => x.score)).toEqual([7.4]);
		expect(result.tiers[4].items.map((x) => x.score)).toEqual([5.0]);
	});

	// 这条钉住两种口径的差别：同为 8.5 分，强榜里均分模式会掉进末档，阈值模式仍在首档
	it('绝对口径不受榜单整体水平影响（与均分模式的关键差异）', () => {
		const strong = [9.5, 9.4, 9.3, 9.2, 9.1, 9.0, 8.5].map((s, i) => scored(i + 1, s));
		const even = distributeByScore(fiveTiers(), strong);
		const byThreshold = distributeByThresholds(fiveTiers(), strong, THRESHOLD_PRESETS.standard);
		expect(even.tiers[4].items.some((x) => x.score === 8.5)).toBe(true);
		expect(byThreshold.tiers[0].items.some((x) => x.score === 8.5)).toBe(true);
	});

	it('无分条目垫底最后档末尾', () => {
		const result = distributeByThresholds(fiveTiers(), [scored(1, 9), plain(2)], THRESHOLD_PRESETS.standard);
		expect(result.tiers[0].items.map((x) => x.id)).toEqual(['subject:1']);
		expect(result.tiers[4].items.map((x) => x.id)).toEqual(['subject:2']);
	});

	it('保留各档已有内容与属性', () => {
		const existing = scored(99, 9.9);
		const tiers = fiveTiers();
		tiers[0] = tier('s', [existing]);
		const result = distributeByThresholds(tiers, [scored(1, 5)], THRESHOLD_PRESETS.standard);
		expect(result.tiers[0].items[0]).toBe(existing);
		expect(result.tiers[1].items).toHaveLength(0);
	});

	// 调用方靠「返回的 tiers 是不是原引用」判断有没有真的分档，据此决定要不要清空集合。
	// 若这里改成返回新数组，tierData.autoDistribute 会把条目凭空清掉。
	it('阈值数量与档位数不符时原样返回同一个 tiers 引用', () => {
		const tiers = [tier('a'), tier('b'), tier('c')]; // 3 档，但预设是 4 个分界
		const result = distributeByThresholds(tiers, [scored(1, 9), scored(2, 5)], THRESHOLD_PRESETS.standard);
		expect(result.tiers).toBe(tiers);
		expect(result.leftover).toEqual([]);
	});

	it('单档无法表达阈值，同样原样返回', () => {
		const tiers = [tier('only')];
		expect(distributeByThresholds(tiers, [scored(1, 9)], THRESHOLD_PRESETS.standard).tiers).toBe(tiers);
	});
});
