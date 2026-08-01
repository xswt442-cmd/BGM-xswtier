import { persisted } from 'svelte-persisted-store';
import { get } from 'svelte/store';
import type { ItemData, TierDef, TierStore } from '$lib/schemas/item';

export function uid(): string {
	return crypto.randomUUID();
}

export function defaultTiers(): TierDef[] {
	return [
		{ id: uid(), label: '夯', color: 'var(--chart-1)', items: [] },
		{ id: uid(), label: '顶级', color: 'var(--chart-2)', items: [] },
		{ id: uid(), label: '人上人', color: 'var(--chart-3)', items: [] },
		{ id: uid(), label: 'NPC', color: 'var(--chart-4)', items: [] },
		{ id: uid(), label: '拉完了', color: 'var(--chart-5)', items: [] }
	];
}

function defaultStore(): TierStore {
	return { version: 1, tiers: defaultTiers(), collectionTierItems: [] };
}

const storage = persisted<TierStore>('tierData-v2', defaultStore(), { syncTabs: false });

// $state 是 UI 活模型（可被 dndzone bindable 改），$effect 负责 flush 回 persisted store → localStorage
let tiers = $state<TierDef[]>(get(storage).tiers);
let collection = $state<ItemData[]>(get(storage).collectionTierItems);

// JSON.stringify 遍历全部嵌套属性，任何深变更都触发重写
$effect(() => {
	storage.set(JSON.parse(JSON.stringify({ version: 1, tiers, collectionTierItems: collection })));
});

export const tierData = {
	get tiers() {
		return tiers;
	},
	get collection() {
		return collection;
	},
	/** 添加新档，默认标签「新」，色取下一 chart 变量 */
	addTier(label = '新') {
		const next = `var(--chart-${Math.min(tiers.length + 1, 8)})`;
		const t: TierDef = { id: uid(), label, color: next, items: [] };
		tiers = [...tiers, t];
		return t;
	},
	/** 删除档（至少保留 1 档），条目回流未排名集合 */
	removeTier(id: string) {
		const target = tiers.find((t) => t.id === id);
		if (!target || tiers.length <= 1) return;
		collection = [...collection, ...target.items];
		tiers = tiers.filter((t) => t.id !== id);
	},
	renameTier(id: string, label: string) {
		tiers = tiers.map((t) => (t.id === id ? { ...t, label } : t));
	},
	recolorTier(id: string, color: string) {
		tiers = tiers.map((t) => (t.id === id ? { ...t, color } : t));
	},
	/** 从集合移除某条目（拖入 tier 后调用） */
	removeFromCollection(itemId: string) {
		collection = collection.filter((i) => i.id !== itemId);
	}
};
