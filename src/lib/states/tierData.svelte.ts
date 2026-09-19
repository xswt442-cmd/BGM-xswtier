import { persisted } from 'svelte-persisted-store';
import { get } from 'svelte/store';
import { SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
import type { ItemData, TierDef, TierDraft, TierStore } from '$lib/schemas/item';
import { TierHistory, type TierHistoryAction } from '$lib/utils/tierHistory';
import { migrateStore } from '$lib/utils/tierSerialize';
import {
	distributeByScore,
	distributeByThresholds,
	THRESHOLD_PRESETS,
	type ThresholdPreset,
} from '$lib/utils/autoDistribute';
import { sortItemsInTiers, DEFAULT_SORT_DIRECTION, type TierSortKey } from '$lib/utils/sortTierItems';
import { storageWarning } from '$lib/states/storageWarning.svelte';
import { m } from '$lib/paraglide/messages';

export function uid(): string {
	return crypto.randomUUID();
}

/**
 * 默认档位。标签走 i18n（中文：夯/顶级/人上人/NPC/拉完了；英文：GOATED/TOP/…），
 * 但只在**建会话这一刻**取一次——档位名是用户可改的数据，持久化后不再随语言切换变化。
 */
export function defaultTiers(): TierDef[] {
	return [
		{ id: uid(), label: m.default_tier_1(), color: 'var(--chart-1)', items: [] },
		{ id: uid(), label: m.default_tier_2(), color: 'var(--chart-2)', items: [] },
		{ id: uid(), label: m.default_tier_3(), color: 'var(--chart-3)', items: [] },
		{ id: uid(), label: m.default_tier_4(), color: 'var(--chart-4)', items: [] },
		{ id: uid(), label: m.default_tier_5(), color: 'var(--chart-5)', items: [] },
	];
}

function defaultStore(): TierStore {
	return { version: 1, tiers: defaultTiers(), collectionTierItems: [] };
}

const STORE_KEY = 'tierData-v2';
const DRAFT_KEY = 'bgmtier-draft-v1';
const storage = persisted<TierStore>(STORE_KEY, defaultStore(), { syncTabs: false });
const draftStorage = persisted<TierDraft | null>(DRAFT_KEY, null, { syncTabs: false });

// $state 是 UI 活模型（可被 dndzone bindable 改），$effect 负责 flush 回 persisted store → localStorage
// 初始化经 migrateStore：旧版本数据自动沿阶梯升级，未来版本/损坏数据回落默认会话
const initialStore = migrateStore(get(storage)) ?? defaultStore();
let tiers = $state<TierDef[]>(initialStore.tiers);
let collection = $state<ItemData[]>(initialStore.collectionTierItems);
let draft = $state<TierDraft | null>(migrateStore(get(draftStorage)) as TierDraft | null);
const history = new TierHistory(50);
let historyDepth = $state({ past: 0, future: 0 });
let historyCommitTimer: ReturnType<typeof setTimeout> | undefined;

function syncHistoryDepth() {
	historyDepth = { past: history.pastDepth, future: history.futureDepth };
}

function resetHistory() {
	clearTimeout(historyCommitTimer);
	historyCommitTimer = undefined;
	history.reset();
	syncHistoryDepth();
}

// JSON.stringify 遍历全部嵌套属性，任何深变更都触发重写。
// $effect.root 允许在模块作用域创建 effect（模块顶层直接 $effect 会报 effect_orphan）
// 持久化前过滤 dnd shadow 占位符（isDndShadowItem），避免污染 localStorage
function stripShadow<T extends { id: string; isDndShadowItem?: boolean }>(list: T[]): T[] {
	return list.filter((i) => !i.isDndShadowItem && i.id !== SHADOW_PLACEHOLDER_ITEM_ID);
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
	// 档位本身也可拖拽排序：拖拽中间态 e.detail.items 会含 shadow 占位档，持久化前过滤掉
	const cleanTiers = sourceTiers
		.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID)
		.map((tier) => ({ ...tier, items: uniqueItems(tier.items, seen) }));
	return {
		version: 1,
		tiers: cleanTiers,
		collectionTierItems: uniqueItems(sourceCollection, seen),
	};
}

function applyStore(store: TierStore) {
	const clean = cleanStore(store.tiers, store.collectionTierItems);
	tiers = JSON.parse(JSON.stringify(clean.tiers));
	collection = JSON.parse(JSON.stringify(clean.collectionTierItems));
}

function transact(action: TierHistoryAction, mutation: () => void) {
	clearTimeout(historyCommitTimer);
	historyCommitTimer = undefined;
	if (history.active) history.commit(cleanStore());
	history.begin(cleanStore(), action);
	mutation();
	history.commit(cleanStore());
	syncHistoryDepth();
}
// 持久化去抖：拖拽悬停期间 consider 事件高频触发，全量深序列化 + 同步写盘会逐帧卡顿。
// 变更只做依赖追踪并合并到 300ms trailing 写入；pagehide / 页面隐藏时立即 flush，
// 保证「改完立刻刷新/关标签」不丢尾部数据。
let persistTimer: ReturnType<typeof setTimeout> | undefined;
// 写盘校验：svelte-persisted-store 内部会吞掉写盘异常（仅 console.error），
// 配额溢出靠「回读比对」检测。比对含全量 stringify，为不拖累拖拽热路径
// 改成 5s 间隔的脏检查（pagehide / 页面隐藏时同步强制校验一次）。
let lastSnapshot: TierStore | undefined;
let dirtySinceVerify = false;

function flushPersist() {
	if (persistTimer === undefined) return;
	clearTimeout(persistTimer);
	persistTimer = undefined;
	storage.set((lastSnapshot = cleanStore()));
	dirtySinceVerify = true;
}

function verifyPersisted() {
	if (!dirtySinceVerify || typeof localStorage === 'undefined' || !lastSnapshot) return;
	dirtySinceVerify = false;
	if (localStorage.getItem(STORE_KEY) === JSON.stringify(lastSnapshot)) {
		storageWarning.clear();
	} else {
		console.warn('[tierData] persist verification failed (quota?)');
		storageWarning.trigger();
	}
}

function schedulePersist() {
	if (persistTimer !== undefined) return; // 已有排程：保持最早到期时间，持续编辑期间周期性落盘
	persistTimer = setTimeout(flushPersist, 300);
}

function persistNow() {
	flushPersist();
	verifyPersisted();
}

$effect.root(() => {
	$effect(() => {
		void cleanStore(); // 只为建立响应式依赖；真正的深序列化推迟到合并后的 flush
		schedulePersist();
	});
});

if (typeof window !== 'undefined') {
	window.addEventListener('pagehide', persistNow);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') persistNow();
	});
	setInterval(verifyPersisted, 5000);
}

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
	get canUndo() {
		return historyDepth.past > 0;
	},
	get canRedo() {
		return historyDepth.future > 0;
	},
	get undoDepth() {
		return historyDepth.past;
	},
	get redoDepth() {
		return historyDepth.future;
	},
	beginHistory(action: TierHistoryAction) {
		clearTimeout(historyCommitTimer);
		history.begin(cleanStore(), action);
	},
	scheduleHistoryCommit() {
		clearTimeout(historyCommitTimer);
		historyCommitTimer = setTimeout(() => {
			historyCommitTimer = undefined;
			history.commit(cleanStore());
			syncHistoryDepth();
		}, 40);
	},
	resetHistory,
	undo(): TierHistoryAction | null {
		clearTimeout(historyCommitTimer);
		historyCommitTimer = undefined;
		if (history.active) history.commit(cleanStore());
		const entry = history.undo(cleanStore());
		if (entry) applyStore(entry.store);
		syncHistoryDepth();
		return entry?.action ?? null;
	},
	redo(): TierHistoryAction | null {
		clearTimeout(historyCommitTimer);
		historyCommitTimer = undefined;
		if (history.active) history.commit(cleanStore());
		const entry = history.redo(cleanStore());
		if (entry) applyStore(entry.store);
		syncHistoryDepth();
		return entry?.action ?? null;
	},
	/** 新入口必须原子创建干净会话，避免旧排名串入。 */
	startSession(items: ItemData[]) {
		tiers = defaultTiers();
		collection = uniqueItems(items);
		resetHistory();
	},
	/** 批次加载只在请求完成时显式合并，不在拖拽期间响应式补回。 */
	mergeIntoCollection(items: ItemData[]) {
		const seen = new Set<string>([
			...tiers.flatMap((tier) => tier.items.map((item) => item.id)),
			...collection.map((item) => item.id),
		]);
		const fresh = uniqueItems(items, seen);
		if (fresh.length > 0) {
			collection = [...collection, ...fresh];
			history.rebaseItems(fresh);
			syncHistoryDepth();
		}
	},
	/** 按评分预分档：未排名集合降序均匀切到当前各档（无分垫底），单事务可撤销 */
	/**
	 * 未排名条目预分档（单事务可撤销）。
	 * - 不传 preset：按条数均分（相对口径，"排名前 N% 进首档"）
	 * - 传 preset：按该预设的绝对评分阈值分档（"X 分以上进首档"，跨榜单口径一致）
	 */
	autoDistribute(preset?: ThresholdPreset) {
		const result = preset
			? distributeByThresholds(tiers, collection, THRESHOLD_PRESETS[preset])
			: distributeByScore(tiers, collection);
		// 阈值与档位数不匹配时返回的是原 tiers 引用（未分档）。提前返回，既不能清空
		// collection（条目会凭空消失），也不该进事务（会留下一个撤销了但看不出变化的历史步）。
		if (result.tiers === tiers) return;
		transact('move_item', () => {
			tiers = result.tiers;
			collection = [];
		});
	},
	/**
	 * 批量把未排名条目移入指定档位（单事务可撤销）。
	 *
	 * 目标顺序取**未排名集合的现有顺序**而非 ids 的传入顺序：多选是逐个点击的，
	 * 按点击顺序排会让档内出现随机序；按列表序移入后视觉上与原来一致。
	 * 追加到目标档末尾；id 不存在于未排名集合时静默跳过。
	 * @returns 实际移动的条目数
	 */
	moveItemsToTier(ids: string[], tierId: string): number {
		const wanted = new Set(ids);
		const moving = collection.filter((item) => wanted.has(item.id));
		if (moving.length === 0) return 0;
		const movingIds = new Set(moving.map((item) => item.id));
		transact('move_item', () => {
			tiers = tiers.map((tier) => (tier.id === tierId ? { ...tier, items: [...tier.items, ...moving] } : tier));
			collection = collection.filter((item) => !movingIds.has(item.id));
		});
		return moving.length;
	},
	/** 档位内排序：只重排各档内部顺序，不跨档移动，单事务可撤销 */
	sortTierItems(key: TierSortKey) {
		transact('sort_tier', () => {
			tiers = sortItemsInTiers(tiers, key, DEFAULT_SORT_DIRECTION[key]);
		});
	},
	/** 拖拽完成后清除 shadow，并确保所有容器内 ID 全局唯一。 */
	normalize() {
		const clean = cleanStore();
		tiers = clean.tiers;
		collection = clean.collectionTierItems;
	},
	/** 取干净深拷贝快照（已 strip shadow/去重），供分享/导出编码前使用 */
	snapshot(): TierStore {
		return JSON.parse(JSON.stringify(cleanStore()));
	},
	/** 整体载入一个会话快照（分享链接/导入恢复），内部再 cleanStore 兜底去重 */
	loadStore(store: TierStore) {
		applyStore(store);
		resetHistory();
	},
	saveDraft() {
		const clean = cleanStore();
		const savedAt = new Date().toISOString();
		draft = { ...JSON.parse(JSON.stringify(clean)), savedAt };
		draftStorage.set(draft);
		if (typeof localStorage !== 'undefined' && localStorage.getItem(DRAFT_KEY) !== JSON.stringify(draft)) {
			console.warn('[tierData] draft persist verification failed (quota?)');
			storageWarning.trigger();
		}
		return savedAt;
	},
	restoreDraft() {
		if (!draft) return false;
		applyStore(draft);
		resetHistory();
		return true;
	},
	clearSessionAndDraft() {
		tiers = defaultTiers();
		collection = [];
		draft = null;
		draftStorage.set(null);
		resetHistory();
	},
	/** 添加新档，默认标签取当前语言（中「新」/ 英「NEW」），色取下一 chart 变量 */
	addTier(label = m.new_tier_label()) {
		const next = `var(--chart-${Math.min(tiers.length + 1, 8)})`;
		const t: TierDef = { id: uid(), label, color: next, items: [] };
		transact('add_tier', () => (tiers = [...tiers, t]));
		return t;
	},
	/** 删除档（至少保留 1 档），条目回流未排名集合 */
	removeTier(id: string) {
		const target = tiers.find((t) => t.id === id);
		if (!target || tiers.length <= 1) return;
		transact('delete_tier', () => {
			collection = [...collection, ...target.items];
			tiers = tiers.filter((t) => t.id !== id);
		});
	},
	renameTier(id: string, label: string) {
		transact('rename_tier', () => (tiers = tiers.map((t) => (t.id === id ? { ...t, label } : t))));
	},
	recolorTier(id: string, color: string) {
		transact('recolor_tier', () => (tiers = tiers.map((t) => (t.id === id ? { ...t, color } : t))));
	},
	/** 从集合移除某条目（拖入 tier 后调用） */
	removeFromCollection(itemId: string) {
		collection = collection.filter((i) => i.id !== itemId);
	},
};
