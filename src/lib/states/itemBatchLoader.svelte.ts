import pLimit from 'p-limit';
import { QueryClient } from '@tanstack/svelte-query';
import { fetchItemByIdentity } from '$lib/api/bgmFetchers.svelte';
import { tierData } from '$lib/states/tierData.svelte';
import { indexPool } from '$lib/states/indexPool.svelte';
import { freshById } from '$lib/utils';
import type { ItemData, ItemIdentity } from '$lib/schemas/item';

// 限流：未认证 ~30 req/min，带 token ~300 req/min → 并发压 6、批次 15
const CONCURRENCY_LIMIT = 6;
const BATCH_SIZE_DEFAULT = 15;

const client = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 30, // 30 分钟后过期
			gcTime: 1000 * 60 * 60,
			retry: 1,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false // 断网恢复不静默刷新，避免覆盖用户正在编辑的会话
		}
	}
});

export class BatchLoader {
	#limit = pLimit(CONCURRENCY_LIMIT);

	queue = $state<ItemIdentity[]>([]);
	loadedItems = $state<ItemData[]>([]);
	isLoading = $state(false);
	/** 进度统计：累计入队总数 / 成功加载数 */
	totalQueued = $state(0);
	loadedCount = $state(0);
	/** 加载结果去向：默认并入排名池（collection）；index 模式路由到目录池 */
	destination = $state<'collection' | 'indexPool'>('collection');

	setDestination(d: 'collection' | 'indexPool') {
		this.destination = d;
	}

	addItems(list: ItemIdentity[]) {
		this.queue.push(...list);
		this.totalQueued += list.length;
	}

	/** 直接注入已映射的完整条目（搜索/本季/热门路径，无需再 fetchSubject）。内部去重。 */
	seedLoaded(items: ItemData[]) {
		this.loadedItems = freshById([], items);
		this.totalQueued = this.loadedItems.length; // 全量已入池，无队列
		this.loadedCount = this.loadedItems.length;
		this.queue = [];
		this.isLoading = false;
		this.destination = 'collection'; // 防御性重置：seed 路径不经过 clear()
	}

	async loadBatch(batch = BATCH_SIZE_DEFAULT) {
		const targets = this.queue.splice(0, batch); // 同步出队，防并发重复处理
		if (targets.length === 0) return;
		this.isLoading = true;

		const results = await Promise.all(
			targets.map((item) =>
				this.#limit(async () => {
					try {
						const data = await client.fetchQuery({
							queryKey: ['item', item.category, item.bgm_id], // 自带去重/缓存
							queryFn: () => fetchItemByIdentity(item)
						});
						return { id: `${item.category}:${item.bgm_id}`, ...item, ...data } as ItemData;
					} catch (error) {
						console.warn(`[BatchLoader] Failed: ${item.bgm_id}`, error);
						return undefined; // 单条失败不阻断整批
					}
				})
			)
		);

		const valid = results.filter((i): i is ItemData => i !== undefined);
		this.loadedItems.push(...valid);
		if (this.destination === 'indexPool') {
			indexPool.addAll(valid);
		} else {
			tierData.mergeIntoCollection(valid);
		}
		this.loadedCount += valid.length;
		this.isLoading = false;
	}

	get isDone() {
		return this.queue.length === 0 && !this.isLoading;
	}

	get total() {
		return this.totalQueued;
	}

	clear() {
		this.queue = [];
		this.loadedItems = [];
		this.totalQueued = 0;
		this.loadedCount = 0;
		this.destination = 'collection';
	}
}

export const itemLoader = new BatchLoader();
