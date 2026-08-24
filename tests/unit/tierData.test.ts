import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemData } from '$lib/schemas/item';

function makeItem(id: number): ItemData {
	return {
		id: `subject:${id}`,
		bgm_id: id,
		category: 'subject',
		name: `Subject ${id}`
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
});
