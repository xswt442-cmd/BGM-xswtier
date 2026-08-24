import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemData } from '$lib/schemas/item';

function makeItem(id: number): ItemData {
	return { id: `subject:${id}`, bgm_id: id, category: 'subject', name: `Subject ${id}` };
}

async function freshSearchPool() {
	vi.resetModules();
	localStorage.clear();
	return await import('$lib/states/searchPool.svelte');
}

let searchPool: Awaited<ReturnType<typeof freshSearchPool>>['searchPool'];

beforeEach(async () => {
	searchPool = (await freshSearchPool()).searchPool;
});

describe('searchPool state', () => {
	it('add 幂等：同 id 重复加入被忽略，has 同步反映成员关系', () => {
		searchPool.add(makeItem(1));
		searchPool.add(makeItem(1));
		expect(searchPool.items).toHaveLength(1);
		expect(searchPool.has('subject:1')).toBe(true);
		searchPool.remove('subject:1');
		expect(searchPool.has('subject:1')).toBe(false);
	});

	it('remove 对不存在的 id 是无害 no-op', () => {
		searchPool.remove('subject:404');
		expect(searchPool.items).toHaveLength(0);
	});

	it('addAll 只并入新条目并保持顺序', () => {
		searchPool.addAll([makeItem(1), makeItem(2)]);
		searchPool.addAll([makeItem(2), makeItem(3)]);
		expect(searchPool.items.map((i) => i.bgm_id)).toEqual([1, 2, 3]);
	});

	it('removeAll 原子批量删除，只触发一次替换', () => {
		searchPool.addAll([makeItem(1), makeItem(2), makeItem(3)]);
		const before = searchPool.items;
		searchPool.removeAll(['subject:1', 'subject:3']);
		expect(searchPool.items).not.toBe(before);
		expect(searchPool.items.map((i) => i.bgm_id)).toEqual([2]);
	});

	it('clear 清空全部', () => {
		searchPool.addAll([makeItem(1)]);
		searchPool.clear();
		expect(searchPool.items).toHaveLength(0);
	});
});
