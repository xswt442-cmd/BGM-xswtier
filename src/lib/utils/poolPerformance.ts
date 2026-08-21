import type { ItemData } from '$lib/schemas/item';

export const VIRTUAL_POOL_THRESHOLD = 80;
export const VIRTUAL_POOL_ROW_HEIGHT = 134;

export function poolColumnCount(width: number): 1 | 2 {
	return width >= 640 ? 2 : 1;
}

export function virtualRowCount(itemCount: number, columns: number): number {
	return Math.ceil(itemCount / Math.max(1, columns));
}

export function virtualRowKey(items: ItemData[], row: number, columns: number): string {
	return items[row * columns]?.id ?? `row-${row}`;
}

export function toggleMutableSelection(selection: Set<string>, id: string): void {
	if (selection.has(id)) selection.delete(id);
	else selection.add(id);
}

export function selectAllMutable(selection: Set<string>, items: ItemData[]): void {
	selection.clear();
	for (const item of items) selection.add(item.id);
}

export function pruneMutableSelection(selection: Set<string>, items: ItemData[]): void {
	const valid = new Set(items.map((item) => item.id));
	for (const id of selection) if (!valid.has(id)) selection.delete(id);
}
