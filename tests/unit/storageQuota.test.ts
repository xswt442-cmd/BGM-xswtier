import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemData } from '$lib/schemas/item';

const item = (id: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `S${id}`,
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.resetModules();
	localStorage.clear();
});

afterEach(() => {
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('配额溢出兜底', () => {
	it('写盘抛 QuotaExceeded 时触发全局警告，恢复后自动清除', async () => {
		const { searchPool } = await import('$lib/states/searchPool.svelte');
		const { storageWarning } = await import('$lib/states/storageWarning.svelte');

		const failing = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
			throw new DOMException('quota exceeded', 'QuotaExceededError');
		});
		searchPool.add(item(1));
		// flush@300ms 落盘置脏，interval@5s 回读比对触发警告
		await vi.advanceTimersByTimeAsync(5500);
		expect(storageWarning.active).toBe(true);
		expect(failing).toHaveBeenCalled();

		failing.mockRestore(); // 写盘恢复可用
		searchPool.add(item(2));
		await vi.advanceTimersByTimeAsync(5500);
		expect(storageWarning.active).toBe(false);
		const stored = JSON.parse(localStorage.getItem('bgmtier-search-pool') ?? '[]');
		expect(stored.map((x: ItemData) => x.bgm_id)).toEqual([1, 2]); // 恢复后的 flush 把两条都补上了
	});
});
