import type { ItemData, TierStore } from '$lib/schemas/item';

export type TierHistoryAction =
	'move_item' | 'reorder_tier' | 'add_tier' | 'delete_tier' | 'rename_tier' | 'recolor_tier';

export type TierHistoryEntry = {
	store: TierStore;
	action: TierHistoryAction;
};

/** 内部条目：size 为该快照的序列化字符长度近似值（淘汰启发式用，非精确字节） */
type SizedEntry = TierHistoryEntry & { size: number };

const cloneStore = (store: TierStore): TierStore => JSON.parse(JSON.stringify(store));
const storeKey = (store: TierStore): string => JSON.stringify(store);

function mergeItems(store: TierStore, items: ItemData[]): TierStore {
	const next = cloneStore(store);
	const seen = new Set([
		...next.tiers.flatMap((tier) => tier.items.map((item) => item.id)),
		...next.collectionTierItems.map((item) => item.id),
	]);
	for (const item of items) {
		if (!seen.has(item.id)) {
			seen.add(item.id);
			next.collectionTierItems.push(JSON.parse(JSON.stringify(item)));
		}
	}
	return next;
}

export class TierHistory {
	#past: SizedEntry[] = [];
	#future: SizedEntry[] = [];
	// begin 时缓存快照的序列化 key：commit 判等只需序列化当前态一次，
	// 避免每次 commit 都把 begin 时的快照再 stringify 一遍（拖拽期间高频调用）
	#active: { entry: TierHistoryEntry; key: string } | null = null;
	// past 栈内所有快照的 size 总和，用于字节预算淘汰的 O(1) 判定
	#pastBytes = 0;
	readonly #minKeep: number;

	/**
	 * limit：条数硬上限；maxSnapshotChars：past 快照序列化字符总预算（≈2×字节数）。
	 * 数百条目的大会话单份快照可达百 KB 级，50 份全量克隆在移动端内存偏重；
	 * 超预算时从最旧开始淘汰，但始终保留近 minKeep 条保证可撤销性。
	 */
	constructor(
		readonly limit = 50,
		readonly maxSnapshotChars = 2_000_000,
		minKeep = 10,
	) {
		this.#minKeep = Math.max(1, Math.min(minKeep, limit));
	}

	get pastDepth() {
		return this.#past.length;
	}

	get futureDepth() {
		return this.#future.length;
	}

	get active() {
		return this.#active !== null;
	}

	begin(store: TierStore, action: TierHistoryAction) {
		if (this.#active) return;
		this.#active = { entry: { store: cloneStore(store), action }, key: storeKey(store) };
	}

	commit(store: TierStore): boolean {
		const active = this.#active;
		this.#active = null;
		if (!active || active.key === storeKey(store)) return false;
		// 该步的 size 即 begin 时缓存的起点序列化长度，无需再次 stringify
		const size = active.key.length;
		this.#past.push({ ...active.entry, size });
		this.#pastBytes += size;
		// 新分支：redo 栈作废
		this.#future = [];
		this.#evictOverflow();
		return true;
	}

	/** 双重淘汰：条数超 limit 必裁；序列化总量超预算时裁到剩 minKeep 为止。 */
	#evictOverflow() {
		while (
			this.#past.length > 0 &&
			(this.#past.length > this.limit || (this.#pastBytes > this.maxSnapshotChars && this.#past.length > this.#minKeep))
		) {
			this.#pastBytes -= this.#past[0].size;
			this.#past.shift();
		}
	}

	cancel() {
		this.#active = null;
	}

	reset() {
		this.#past = [];
		this.#future = [];
		this.#active = null;
		this.#pastBytes = 0;
	}

	undo(current: TierStore): TierHistoryEntry | null {
		this.#active = null;
		const previous = this.#past.pop();
		if (!previous) return null;
		this.#pastBytes -= previous.size;
		// future 条目沿用原 size（同一快照来回搬移，量级不变）
		this.#future.push({ store: cloneStore(current), action: previous.action, size: previous.size });
		return { store: cloneStore(previous.store), action: previous.action };
	}

	redo(current: TierStore): TierHistoryEntry | null {
		this.#active = null;
		const next = this.#future.pop();
		if (!next) return null;
		// 回压 past 时复用被弹出入口的 size 作当前态近似（省一次 stringify）
		this.#past.push({ store: cloneStore(current), action: next.action, size: next.size });
		this.#pastBytes += next.size;
		return { store: cloneStore(next.store), action: next.action };
	}

	/** New loader results are baseline data, so replay them into every reachable snapshot. */
	rebaseItems(items: ItemData[]) {
		if (items.length === 0) return;
		// merge 后实际体积略增，size 仍按原值近似（淘汰是启发式，不追求精确）
		this.#past = this.#past.map((entry) => ({ ...entry, store: mergeItems(entry.store, items) }));
		this.#future = this.#future.map((entry) => ({ ...entry, store: mergeItems(entry.store, items) }));
		if (this.#active) {
			this.#active = {
				...this.#active,
				entry: { ...this.#active.entry, store: mergeItems(this.#active.entry.store, items) },
			};
		}
	}
}
