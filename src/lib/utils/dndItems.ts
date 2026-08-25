import { SHADOW_ITEM_MARKER_PROPERTY_NAME, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
import type { ItemData } from '$lib/schemas/item';

/** Commit only stable DnD items. The temporary source shadow may carry the real item's ID. */
export function cleanFinalizedItems(items: ItemData[]): ItemData[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (item[SHADOW_ITEM_MARKER_PROPERTY_NAME] || item.id === SHADOW_PLACEHOLDER_ITEM_ID) return false;
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}
