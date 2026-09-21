import { SHADOW_ITEM_MARKER_PROPERTY_NAME, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
import type { ItemData } from '$lib/schemas/item';

/** 只提交稳定态条目：拖拽源里的临时 shadow 可能带着真实条目的 ID */
export function cleanFinalizedItems(items: ItemData[]): ItemData[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (item[SHADOW_ITEM_MARKER_PROPERTY_NAME] || item.id === SHADOW_PLACEHOLDER_ITEM_ID) return false;
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}
