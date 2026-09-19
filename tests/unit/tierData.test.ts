import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemData } from '$lib/schemas/item';

function makeItem(id: number): ItemData {
	return {
		id: `subject:${id}`,
		bgm_id: id,
		category: 'subject',
		name: `Subject ${id}`,
	};
}

// 状态模块是单例：每个用例前重置模块注册表并清空 localStorage，保证拿到干净的初始实例
async function freshTierData() {
	vi.resetModules();
	localStorage.clear();
	return await import('$lib/states/tierData.svelte');
}

let tierData: Awaited<ReturnType<typeof freshTierData>>['tierData'];

beforeEach(async () => {
	tierData = (await freshTierData()).tierData;
});

describe('tierData state', () => {
	it('startSession 原子重置：默认五档、集合适度去重、历史清零', () => {
		tierData.startSession([makeItem(1), makeItem(1), makeItem(2)]);
		expect(tierData.tiers).toHaveLength(5);
		expect(tierData.collection.map((i) => i.bgm_id)).toEqual([1, 2]);
		expect(tierData.canUndo).toBe(false);
		expect(tierData.canRedo).toBe(false);
	});

	it('mergeIntoCollection 只并入未排名的新条目，已入档条目不回流', () => {
		tierData.startSession([makeItem(1)]);
		tierData.tiers[0].items.push(makeItem(1)); // 模拟已拖入档位
		tierData.collection = [];
		tierData.mergeIntoCollection([makeItem(1), makeItem(3)]);
		expect(tierData.collection.map((i) => i.bgm_id)).toEqual([3]);
	});

	it('removeTier 把档内条目回流到未排名集合', () => {
		tierData.startSession([makeItem(1)]);
		tierData.tiers[0].items.push(makeItem(1));
		tierData.removeTier(tierData.tiers[0].id);
		expect(tierData.tiers).toHaveLength(4);
		expect(tierData.collection.some((i) => i.bgm_id === 1)).toBe(true);
	});

	it('removeTier 在只剩一档时拒绝删除', () => {
		tierData.startSession([]);
		while (tierData.tiers.length > 1) tierData.removeTier(tierData.tiers[0].id);
		tierData.removeTier(tierData.tiers[0].id);
		expect(tierData.tiers).toHaveLength(1);
	});

	it('addTier 走事务：undo 移除、redo 恢复', () => {
		tierData.startSession([]);
		tierData.addTier();
		expect(tierData.tiers).toHaveLength(6);
		expect(tierData.canUndo).toBe(true);
		tierData.undo();
		expect(tierData.tiers).toHaveLength(5);
		tierData.redo();
		expect(tierData.tiers).toHaveLength(6);
	});

	it('草稿保存→变更→恢复→清除 全链路', () => {
		tierData.startSession([makeItem(1)]);
		tierData.addTier();
		const savedAt = tierData.saveDraft();
		expect(savedAt).toBeTruthy();
		expect(tierData.draftSavedAt).toBe(savedAt);

		tierData.undo(); // 会话变回 5 档
		expect(tierData.tiers).toHaveLength(5);
		expect(tierData.restoreDraft()).toBe(true);
		expect(tierData.tiers).toHaveLength(6);

		tierData.clearSessionAndDraft();
		expect(tierData.hasDraft).toBe(false);
		expect(tierData.collection).toHaveLength(0);
		expect(tierData.tiers).toHaveLength(5);
	});

	it('moveItemsToTier 把选中条目移入目标档，其余留在未排名', () => {
		tierData.startSession([makeItem(1), makeItem(2), makeItem(3)]);
		const target = tierData.tiers[1].id;
		const moved = tierData.moveItemsToTier(['subject:3', 'subject:1'], target);

		expect(moved).toBe(2);
		// 按集合中的现有顺序，而非 ids 的传入（点击）顺序——后者会让档内出现随机序
		expect(tierData.tiers[1].items.map((i) => i.bgm_id)).toEqual([1, 3]);
		expect(tierData.tiers[0].items).toHaveLength(0); // 其他档不受影响
		expect(tierData.collection.map((i) => i.bgm_id)).toEqual([2]);
	});

	it('moveItemsToTier 追加到目标档末尾，不覆盖已有内容', () => {
		tierData.startSession([makeItem(1), makeItem(2)]);
		const target = tierData.tiers[0].id;
		tierData.moveItemsToTier(['subject:1'], target);
		tierData.moveItemsToTier(['subject:2'], target);
		expect(tierData.tiers[0].items.map((i) => i.bgm_id)).toEqual([1, 2]);
	});

	it('moveItemsToTier 对不存在的 id 静默跳过，返回实际移动数', () => {
		tierData.startSession([makeItem(1)]);
		expect(tierData.moveItemsToTier(['subject:999'], tierData.tiers[0].id)).toBe(0);
		expect(tierData.collection).toHaveLength(1);
	});

	it('moveItemsToTier 是单事务：一次 undo 完全回滚', () => {
		tierData.startSession([makeItem(1), makeItem(2)]);
		tierData.moveItemsToTier(['subject:1', 'subject:2'], tierData.tiers[0].id);
		expect(tierData.collection).toHaveLength(0);

		tierData.undo();
		expect(tierData.collection.map((i) => i.bgm_id)).toEqual([1, 2]);
		expect(tierData.tiers[0].items).toHaveLength(0);
	});
});
