import type { ItemData, TierStore } from '$lib/schemas/item';

export type TierHistoryAction =
	| 'move_item'
	| 'reorder_tier'
	| 'add_tier'
	| 'delete_tier'
	| 'rename_tier'
	| 'recolor_tier';

export type TierHistoryEntry = {
	store: TierStore;
	action: TierHistoryAction;
};

const cloneStore = (store: TierStore): TierStore => JSON.parse(JSON.stringify(store));
const storeKey = (store: TierStore): string => JSON.stringify(store);

function mergeItems(store: TierStore, items: ItemData[]): TierStore {
	const next = cloneStore(store);
	const seen = new Set([
		...next.tiers.flatMap((tier) => tier.items.map((item) => item.id)),
		...next.collectionTierItems.map((item) => item.id)
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
	#past: TierHistoryEntry[] = [];
	#future: TierHistoryEntry[] = [];
	// begin 时缓存快照的序列化 key：commit 判等只需序列化当前态一次，
	// 避免每次 commit 都把 begin 时的快照再 stringify 一遍（拖拽期间高频调用）
	#active: { entry: TierHistoryEntry; key: string } | null = null;

	constructor(readonly limit = 50) {}

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
		this.#past.push(active.entry);
		if (this.#past.length > this.limit) this.#past.splice(0, this.#past.length - this.limit);
		this.#future = [];
		return true;
	}

	cancel() {
		this.#active = null;
	}

	reset() {
		this.#past = [];
		this.#future = [];
		this.#active = null;
	}

	undo(current: TierStore): TierHistoryEntry | null {
		this.#active = null;
		const previous = this.#past.pop();
		if (!previous) return null;
		this.#future.push({ store: cloneStore(current), action: previous.action });
		return { store: cloneStore(previous.store), action: previous.action };
	}

	redo(current: TierStore): TierHistoryEntry | null {
		this.#active = null;
		const next = this.#future.pop();
		if (!next) return null;
		this.#past.push({ store: cloneStore(current), action: next.action });
		return { store: cloneStore(next.store), action: next.action };
	}

	/** New loader results are baseline data, so replay them into every reachable snapshot. */
	rebaseItems(items: ItemData[]) {
		if (items.length === 0) return;
		this.#past = this.#past.map((entry) => ({ ...entry, store: mergeItems(entry.store, items) }));
		this.#future = this.#future.map((entry) => ({ ...entry, store: mergeItems(entry.store, items) }));
		if (this.#active) {
			this.#active = {
				...this.#active,
				entry: { ...this.#active.entry, store: mergeItems(this.#active.entry.store, items) }
			};
		}
	}
}
