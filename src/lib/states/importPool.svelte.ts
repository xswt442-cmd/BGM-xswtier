import { freshById } from '$lib/utils';
import type { ItemData } from '$lib/schemas/item';

export type ImportSource =
	{ kind: 'index'; id: number; label: string } | { kind: 'user'; username: string; label: string };

let items = $state<ItemData[]>([]);
let source = $state<ImportSource | null>(null);
let hasLoaded = $state(false);

export const importPool = {
	get items(): ItemData[] {
		return items;
	},
	get source(): ImportSource | null {
		return source;
	},
	get loaded(): boolean {
		return hasLoaded;
	},
	/** A successful source request replaces the previous import result atomically. */
	replaceSource(nextSource: ImportSource, initial: ItemData[] = []) {
		source = nextSource;
		items = freshById([], initial);
		hasLoaded = true;
	},
	addAll(list: ItemData[]) {
		const fresh = freshById(items, list);
		if (fresh.length > 0) items = [...items, ...fresh];
	},
	clear() {
		items = [];
		source = null;
		hasLoaded = false;
	},
};
