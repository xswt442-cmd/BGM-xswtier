import { describe, expect, it } from 'vitest';
import type { ItemData } from '$lib/schemas/item';
import { referenceRangeText, referenceTrendline } from '$lib/utils/scoreRefs';

const item = (id: number, score?: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `Subject ${id}`,
	...(score !== undefined ? { score } : {}),
});

describe('scoreRefs', () => {
	it('首档无有分条目时返回 null', () => {
		expect(referenceTrendline([])).toBeNull();
		expect(referenceTrendline([item(1)])).toBeNull();
	});

	it('上下界取实际最小/最大值', () => {
		const ref = referenceTrendline([item(1, 9.6), item(2, 8.4), item(3, 9.1)]);
		expect(ref).toEqual({ low: 8.4, high: 9.6, count: 3 });
	});

	it('忽略非有限分数（NaN / Infinity）', () => {
		expect(referenceTrendline([item(1, Number.NaN), item(2, Number.POSITIVE_INFINITY)])).toBeNull();
	});

	it('单条目退化为等值文案，多条目给区间文案', () => {
		expect(referenceRangeText({ low: 9, high: 9, count: 1 })).toBe('9.0');
		expect(referenceRangeText({ low: 8.4, high: 9, count: 2 })).toBe('8.4 ~ 9.0');
	});
});
