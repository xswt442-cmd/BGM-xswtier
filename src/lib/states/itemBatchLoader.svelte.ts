import pLimit from 'p-limit';
import { QueryClient } from '@tanstack/svelte-query';
import { fetchItemByIdentity } from '$lib/api/bgmFetchers.svelte';
import { tierData } from '$lib/states/tierData.svelte';
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
			refetchOnWindowFocus: false
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

	addItems(list: ItemIdentity[]) {
		this.queue.push(...list);
		this.totalQueued += list.length;
	}

	/** 直接注入已映射的完整条目（搜索/本季/热门路径，无需再 fetchSubject）。内部去重。 */
	seedLoaded(items: ItemData[]) {
		const seen = new Set<string>();
		this.loadedItems = items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
		this.totalQueued = this.loadedItems.length; // 全量已入池，无队列
		this.loadedCount = this.loadedItems.length;
		this.queue = [];
		this.isLoading = false;
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
	}
}

export const itemLoader = new BatchLoader();

// 已加载条目 → tier 集合桥接：增量合并，按 id 去重
// （collection + 所有 tier 已含的 id 不再追加 → 拖进 tier 的条目不会回流）
$effect.root(() => {
	$effect(() => {
		const loaded = itemLoader.loadedItems;
		const col = tierData.collection;
		const tiers = tierData.tiers;
		const seen = new Set<string>([
			...col.map((i) => i.id),
			...tiers.flatMap((t) => t.items.map((i) => i.id))
		]);
		const fresh = loaded.filter((i) => !seen.has(i.id));
		if (fresh.length > 0) tierData.collection = [...col, ...fresh];
	});
});
