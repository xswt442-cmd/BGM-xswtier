// 池内查询过滤专测：filterItemsByQuery 的匹配语义，以及它与多选状态的交互。
// 与 pool-performance.test.ts 的分工——那边管虚拟化分列/行键/选中集增删，这边管「筛选只影响渲染、不影响选中」。
import { describe, expect, it } from 'vitest';
import type { ItemData } from '$lib/schemas/item';
import { filterItemsByQuery, pruneMutableSelection } from '$lib/utils/poolPerformance';

function item(id: number, name: string, name_cn?: string): ItemData {
	return { id: `subject:${id}`, bgm_id: id, category: 'subject', name, name_cn };
}

const items = [item(1, 'Steins;Gate', '命运石之门'), item(2, 'Clannad', '团子大家族'), item(3, 'Fate/Zero')];

describe('filterItemsByQuery', () => {
	it('空查询返回原数组引用（零复制，保住虚拟列表 key 稳定）', () => {
		expect(filterItemsByQuery(items, '')).toBe(items);
		expect(filterItemsByQuery(items, '   ')).toBe(items);
	});

	it('按原名匹配，大小写不敏感', () => {
		expect(filterItemsByQuery(items, 'stein').map((i) => i.bgm_id)).toEqual([1]);
		expect(filterItemsByQuery(items, 'CLANNAD').map((i) => i.bgm_id)).toEqual([2]);
	});

	it('按中文名匹配', () => {
		expect(filterItemsByQuery(items, '命运石').map((i) => i.bgm_id)).toEqual([1]);
	});

	it('无匹配返回空数组', () => {
		expect(filterItemsByQuery(items, 'zzzz')).toEqual([]);
	});

	// 回归：筛选结果只用于渲染；若拿它去 prune selection，已选中但被筛掉的条目会被误清
	it('筛选不清掉已选项——prune 必须走全量', () => {
		const selection = new Set(['subject:1', 'subject:3']);
		const visible = filterItemsByQuery(items, 'clannad'); // 只剩 2
		pruneMutableSelection(selection, items); // 正确：用全量
		expect(selection.has('subject:1')).toBe(true);
		expect(selection.has('subject:3')).toBe(true);

		pruneMutableSelection(selection, visible); // 错误用法：会清掉 1 和 3
		expect(selection.size).toBe(0);
	});
});
