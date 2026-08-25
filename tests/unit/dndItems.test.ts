import { describe, expect, it } from 'vitest';
import { SHADOW_ITEM_MARKER_PROPERTY_NAME, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
import type { ItemData } from '$lib/schemas/item';
import { cleanFinalizedItems } from '$lib/utils/dndItems';

const item = (id: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `Subject ${id}`,
});

describe('cleanFinalizedItems', () => {
	it('removes shadows, placeholders and duplicate IDs', () => {
		const shadow = { ...item(1), [SHADOW_ITEM_MARKER_PROPERTY_NAME]: true };
		const placeholder = { ...item(2), id: SHADOW_PLACEHOLDER_ITEM_ID };
		const result = cleanFinalizedItems([shadow, item(1), item(1), placeholder, item(3)]);
		expect(result.map((entry) => entry.id)).toEqual(['subject:1', 'subject:3']);
	});
});
