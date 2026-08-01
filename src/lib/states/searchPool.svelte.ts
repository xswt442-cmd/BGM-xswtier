import { persisted } from 'svelte-persisted-store';
import { get } from 'svelte/store';
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
	/** 批量加入（按 id 去重） */
	addAll(list: ItemData[]) {
		const existing = new Set(pool.map((i) => i.id));
		const fresh = list.filter((i) => !existing.has(i.id));
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
