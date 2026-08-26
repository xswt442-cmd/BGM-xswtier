import { describe, expect, it } from 'vitest';
import type { ItemData, TierDef } from '$lib/schemas/item';
import { distributeByScore } from '$lib/utils/autoDistribute';

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
