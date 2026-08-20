import { describe, expect, it } from 'vitest';
import type { TierStore } from '$lib/schemas/item';
import { decodeURL, encodeURL, exportJSON, importJSON, SHARE_HASH_PREFIX } from '$lib/utils/tierSerialize';

const fixture: TierStore = {
	version: 1,
	tiers: [
		{
			id: 'tier-a',
			label: 'S',
			color: 'var(--chart-1)',
			items: [{ id: 'subject:1', bgm_id: 1, category: 'subject', name: 'One', name_cn: '一', score: 8.7 }]
		}
	],
	collectionTierItems: [{ id: 'subject:2', bgm_id: 2, category: 'subject', name: 'Two' }]
};

describe('tier serialization', () => {
	it('round-trips URL share payloads', () => {
		const decoded = decodeURL(`#${SHARE_HASH_PREFIX}${encodeURL(fixture)}`);
		expect(decoded).toEqual(fixture);
	});

	it('round-trips exported JSON and rejects invalid input', () => {
		const imported = importJSON(exportJSON(fixture));
		expect(imported.ok).toBe(true);
		if (imported.ok) {
			expect(imported.store.tiers).toEqual(fixture.tiers);
			expect(imported.store.collectionTierItems).toEqual(fixture.collectionTierItems);
		}
		expect(importJSON('{')).toEqual({ ok: false, reason: 'parse-error' });
		expect(importJSON('{"version":1}')).toEqual({ ok: false, reason: 'invalid-shape' });
	});
});
