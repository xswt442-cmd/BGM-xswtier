import { persisted } from 'svelte-persisted-store';
import { get } from 'svelte/store';
import type { ItemData, TierDef, TierDraft, TierStore } from '$lib/schemas/item';

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
const draftStorage = persisted<TierDraft | null>('bgmtier-draft-v1', null, { syncTabs: false });

// $state 是 UI 活模型（可被 dndzone bindable 改），$effect 负责 flush 回 persisted store → localStorage
let tiers = $state<TierDef[]>(get(storage).tiers);
let collection = $state<ItemData[]>(get(storage).collectionTierItems);
let draft = $state<TierDraft | null>(get(draftStorage));

// JSON.stringify 遍历全部嵌套属性，任何深变更都触发重写。
// $effect.root 允许在模块作用域创建 effect（模块顶层直接 $effect 会报 effect_orphan）
// 持久化前过滤 dnd shadow 占位符（isDndShadowItem），避免污染 localStorage
function stripShadow<T extends { isDndShadowItem?: boolean }>(list: T[]): T[] {
	return list.filter((i) => !i.isDndShadowItem);
}

function uniqueItems(list: ItemData[], seen = new Set<string>()): ItemData[] {
	return stripShadow(list).filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}

function cleanStore(sourceTiers = tiers, sourceCollection = collection): TierStore {
	const seen = new Set<string>();
	const cleanTiers = sourceTiers.map((tier) => ({ ...tier, items: uniqueItems(tier.items, seen) }));
	return {
		version: 1,
		tiers: cleanTiers,
		collectionTierItems: uniqueItems(sourceCollection, seen)
	};
}
$effect.root(() => {
	$effect(() => {
		const clean = cleanStore();
		storage.set(JSON.parse(JSON.stringify(clean)));
	});
});

$effect.root(() => {
	$effect(() => {
		draftStorage.set(draft ? JSON.parse(JSON.stringify(draft)) : null);
	});
});

// getter/setter 同时保证：读取响应式（getter 读 $state 变量）、bind 可赋值（setter 写 $state 变量）
export const tierData = {
	get tiers() {
		return tiers;
	},
	set tiers(v: TierDef[]) {
		tiers = v;
	},
	get collection() {
		return collection;
	},
	set collection(v: ItemData[]) {
		collection = v;
	},
	get hasDraft() {
		return draft !== null;
	},
	get draftSavedAt() {
		return draft?.savedAt ?? null;
	},
	/** 新入口必须原子创建干净会话，避免旧排名串入。 */
	startSession(items: ItemData[]) {
		tiers = defaultTiers();
		collection = uniqueItems(items);
	},
	/** 批次加载只在请求完成时显式合并，不在拖拽期间响应式补回。 */
	mergeIntoCollection(items: ItemData[]) {
		const seen = new Set<string>([
			...tiers.flatMap((tier) => tier.items.map((item) => item.id)),
			...collection.map((item) => item.id)
		]);
		const fresh = uniqueItems(items, seen);
		if (fresh.length > 0) collection = [...collection, ...fresh];
	},
	/** 拖拽完成后清除 shadow，并确保所有容器内 ID 全局唯一。 */
	normalize() {
		const clean = cleanStore();
		tiers = clean.tiers;
		collection = clean.collectionTierItems;
	},
	saveDraft() {
		const clean = cleanStore();
		const savedAt = new Date().toISOString();
		draft = { ...JSON.parse(JSON.stringify(clean)), savedAt };
		draftStorage.set(JSON.parse(JSON.stringify(draft)));
		return savedAt;
	},
	restoreDraft() {
		if (!draft) return false;
		const clean = cleanStore(draft.tiers, draft.collectionTierItems);
		tiers = JSON.parse(JSON.stringify(clean.tiers));
		collection = JSON.parse(JSON.stringify(clean.collectionTierItems));
		return true;
	},
	clearSessionAndDraft() {
		tiers = defaultTiers();
		collection = [];
		draft = null;
		draftStorage.set(null);
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
