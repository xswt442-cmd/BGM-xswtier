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
const initialPool = get(storage);
let pool = $state<ItemData[]>(initialPool);
let idIndex = new Set(initialPool.map((item) => item.id));

function replacePool(next: ItemData[]) {
	pool = next;
	idIndex = new Set(next.map((item) => item.id));
}

// 持久化去抖：与 tierData 同策略（300ms trailing 合并写盘；pagehide / 页面隐藏立即落盘）。
// REMAKE 清库后无新变更即无 pending 定时器，flush 为 no-op，不会把旧池写回存储。
let persistTimer: ReturnType<typeof setTimeout> | undefined;

function flushPersist() {
	if (persistTimer === undefined) return;
	clearTimeout(persistTimer);
	persistTimer = undefined;
	storage.set(JSON.parse(JSON.stringify(pool)));
}

function schedulePersist() {
	if (persistTimer !== undefined) return; // 已有排程：保持最早到期时间，连续操作期间周期性落盘
	persistTimer = setTimeout(flushPersist, 300);
}

$effect.root(() => {
	$effect(() => {
		void pool; // 只为建立响应式依赖；深序列化推迟到合并后的 flush
		schedulePersist();
	});
});

if (typeof window !== 'undefined') {
	window.addEventListener('pagehide', flushPersist);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') flushPersist();
	});
}

export const searchPool = {
	get items(): ItemData[] {
		return pool;
	},
	set items(v: ItemData[]) {
		replacePool(freshById([], v));
	},
	/** 加入一个条目（已存在则忽略） */
	add(item: ItemData) {
		if (idIndex.has(item.id)) return;
		replacePool([...pool, item]);
	},
	/** 移除一个条目 */
	remove(id: string) {
		if (!idIndex.has(id)) return;
		replacePool(pool.filter((i) => i.id !== id));
	},
	/** 原子批量删除，只触发一次数组替换与持久化。 */
	removeAll(ids: Iterable<string>) {
		const targets = new Set(ids);
		if (targets.size === 0) return;
		replacePool(pool.filter((item) => !targets.has(item.id)));
	},
	/** 批量加入（按 id 去重） */
	addAll(list: ItemData[]) {
		const fresh = freshById(pool, list);
		if (fresh.length > 0) replacePool([...pool, ...fresh]);
	},
	/** 一键清空 */
	clear() {
		replacePool([]);
	},
	has(id: string) {
		// Keep callers reactive to pool replacements while membership stays O(1).
		void pool;
		return idIndex.has(id);
	},
};
