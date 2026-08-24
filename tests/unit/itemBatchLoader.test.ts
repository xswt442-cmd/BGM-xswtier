import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemData, ItemIdentity } from '$lib/schemas/item';

vi.mock('$lib/api/bgmFetchers.svelte', () => ({ fetchItemByIdentity: vi.fn() }));

function makeItem(id: number): ItemData {
	return { id: `subject:${id}`, bgm_id: id, category: 'subject', name: `Subject ${id}` };
}
const identity = (id: number): ItemIdentity => ({ bgm_id: id, category: 'subject' });

// itemBatchLoader 依赖 tierData / importPool 单例：resetModules 后同代内一起导入，
// 确保断言看到的是同一份模块状态
async function freshModules() {
	vi.resetModules();
	localStorage.clear();
	const [batchMod, tierMod, poolMod] = await Promise.all([
		import('$lib/states/itemBatchLoader.svelte'),
		import('$lib/states/tierData.svelte'),
		import('$lib/states/importPool.svelte')
	]);
	const bgm = await import('$lib/api/bgmFetchers.svelte');
	return {
		loader: batchMod.itemLoader,
		tierData: tierMod.tierData,
		importPool: poolMod.importPool,
		fetchItemByIdentity: vi.mocked(bgm.fetchItemByIdentity)
	};
}

let loader: Awaited<ReturnType<typeof freshModules>>['loader'];
let tierData: Awaited<ReturnType<typeof freshModules>>['tierData'];
let importPool: Awaited<ReturnType<typeof freshModules>>['importPool'];
let fetchItemByIdentity: Awaited<ReturnType<typeof freshModules>>['fetchItemByIdentity'];

beforeEach(async () => {
	({ loader, tierData, importPool, fetchItemByIdentity } = await freshModules());
});

describe('itemBatchLoader state', () => {
	it('loadBatch 并发拉取、并入 collection、进度正确', async () => {
		tierData.startSession([]);
		fetchItemByIdentity.mockImplementation(async (i) => makeItem(i.bgm_id));
		loader.addItems([identity(1), identity(2)]);
		await loader.loadBatch(15);
		expect(loader.loadedItems.map((i) => i.bgm_id)).toEqual([1, 2]);
		expect(loader.loadedCount).toBe(2);
		expect(loader.isDone).toBe(true);
		expect(tierData.collection).toHaveLength(2);
	});

	it('单条失败不阻断整批，失败条目进入 failedItems', async () => {
		tierData.startSession([]);
		fetchItemByIdentity.mockImplementation(async (i) => {
			if (i.bgm_id === 2) throw new Error('network boom');
			return makeItem(i.bgm_id);
		});
		loader.addItems([identity(1), identity(2)]);
		await loader.loadBatch(15);
		expect(loader.loadedCount).toBe(1);
		expect(loader.failedCount).toBe(1);
		expect(loader.failedItems[0]?.bgm_id).toBe(2);
	});

	it('retryFailed 重试成功后清空失败列表并补齐集合', async () => {
		tierData.startSession([]);
		// 持久拒绝：QueryClient retry:1 的两次尝试都失败，才会计入 failedItems
		fetchItemByIdentity.mockRejectedValue(new Error('network down'));
		loader.addItems([identity(7)]);
		await loader.loadBatch(15);
		expect(loader.failedCount).toBe(1);

		fetchItemByIdentity.mockResolvedValue(makeItem(7));
		loader.retryFailed();
		// 等整批真正跑完（failedCount 会被 retryFailed 先同步清零，不能作为完成信号）
		await vi.waitFor(() => expect(loader.isDone).toBe(true));
		expect(loader.failedCount).toBe(0);
		expect(tierData.collection.some((i) => i.bgm_id === 7)).toBe(true);
	});

	it('clear 后旧批次响应被代际守卫丢弃，isLoading 复位', async () => {
		let resolveFetch!: (v: ItemData) => void;
		let signalFetched!: () => void;
		const fetched = new Promise<void>((resolve) => (signalFetched = resolve));
		fetchItemByIdentity.mockImplementation(() => {
			signalFetched();
			return new Promise<ItemData>((resolve) => {
				resolveFetch = resolve;
			});
		});
		loader.addItems([identity(1)]);
		const pending = loader.loadBatch(15);
		await fetched; // 等请求真正发出再 clear，保证代际守卫吃到的是在途响应
		loader.clear(); // 代际 +1：迟到的响应必须整体丢弃
		resolveFetch(makeItem(1));
		await pending;
		expect(loader.loadedItems).toHaveLength(0);
		expect(tierData.collection).toHaveLength(0);
		expect(loader.isLoading).toBe(false);
		expect(loader.queue).toHaveLength(0);
	});

	it('destination=importPool 时结果路由到导入池而不是排名池', async () => {
		tierData.startSession([makeItem(9)]); // 排名池已有别的条目
		fetchItemByIdentity.mockImplementation(async (i) => makeItem(i.bgm_id));
		loader.startImport([identity(1)]);
		await loader.loadBatch(15);
		expect(importPool.items.map((i) => i.bgm_id)).toEqual([1]);
		expect(tierData.collection.map((i) => i.bgm_id)).toEqual([9]);
	});

	it('seedLoaded 直接注入并重置计数，无队列无失败项', () => {
		loader.seedLoaded([makeItem(1), makeItem(1), makeItem(2)]);
		expect(loader.loadedItems.map((i) => i.bgm_id)).toEqual([1, 2]);
		expect(loader.totalQueued).toBe(2);
		expect(loader.loadedCount).toBe(2);
		expect(loader.isDone).toBe(true);
		expect(loader.failedCount).toBe(0);
	});
});
