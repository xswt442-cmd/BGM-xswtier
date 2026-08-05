import { freshById } from '$lib/utils';
import type { ItemData } from '$lib/schemas/item';

// 目录池：START 页「输入目录 ID」加载的目录条目先落在这里（source 角色，复刻检索池），
// 用户点 ADD 才进排名池（searchPool）。与检索池（SearchPanel 内部 results）互不干涉。
// 条目加载来自 itemBatchLoader 的 destination 路由，本池只累积 + 清空。
let items = $state<ItemData[]>([]);
let hasLoaded = $state(false);

export const indexPool = {
	get items(): ItemData[] {
		return items;
	},
	/** 是否已提交过目录 ID（控制目录池面板显隐，同检索池 hasSearched 语义） */
	get loaded(): boolean {
		return hasLoaded;
	},
	/** 增量合并（按 id 去重） */
	addAll(list: ItemData[]) {
		items = freshById(items, list);
	},
	markLoaded() {
		hasLoaded = true;
	},
	clear() {
		items = [];
		hasLoaded = false;
	}
};
