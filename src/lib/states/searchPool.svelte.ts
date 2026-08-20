import { persisted } from 'svelte-persisted-store';
import { get } from 'svelte/store';
import { freshById } from '$lib/utils';
import type { ItemData } from '$lib/schemas/item';

// 排名池：跨路由持久化的核心变量。
// 用户进 START 能看到上次留的池，实时维护（加入/删除/全部删除都实时写回 localStorage）。
// 「去 tier」时 tierData.collection 整体替换为 searchPool 内容，来回切换不串数据。

function defaultPool(): ItemData[] {
	return [];
}

const storage = persisted<ItemData[]>('bgmtier-search-pool', defaultPool(), { syncTabs: false });

// $state 是 UI 活模型（可被双池增删改），$effect 负责 flush 回 persisted store → localStorage
let pool = $state<ItemData[]>(get(storage));

$effect.root(() => {
	$effect(() => {
		storage.set(JSON.parse(JSON.stringify(pool)));
	});
});

export const searchPool = {
	get items(): ItemData[] {
		return pool;
	},
	set items(v: ItemData[]) {
		pool = v;
	},
	/** 加入一个条目（已存在则忽略） */
	add(item: ItemData) {
		if (pool.some((i) => i.id === item.id)) return;
		pool = [...pool, item];
	},
	/** 移除一个条目 */
	remove(id: string) {
		pool = pool.filter((i) => i.id !== id);
	},
	/** 原子批量删除，只触发一次数组替换与持久化。 */
	removeAll(ids: Iterable<string>) {
		const targets = new Set(ids);
		if (targets.size === 0) return;
		pool = pool.filter((item) => !targets.has(item.id));
	},
	/** 批量加入（按 id 去重） */
	addAll(list: ItemData[]) {
		const fresh = freshById(pool, list);
		if (fresh.length > 0) pool = [...pool, ...fresh];
	},
	/** 一键清空 */
	clear() {
		pool = [];
	},
	has(id: string) {
		return pool.some((i) => i.id === id);
	}
};
