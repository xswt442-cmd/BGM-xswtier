import { describe, expect, it } from 'vitest';
import type { ItemData, TierStore } from '$lib/schemas/item';
import { TierHistory, type TierHistoryAction } from '$lib/utils/tierHistory';

const item = (id: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `Subject ${id}`
});

const store = (items: ItemData[] = []): TierStore => ({
	version: 1,
	tiers: [{ id: 'tier-a', label: 'A', color: 'var(--chart-1)', items: [] }],
	collectionTierItems: items
});

const clone = (value: TierStore): TierStore => structuredClone(value);

function commit(history: TierHistory, current: TierStore, action: TierHistoryAction, change: (next: TierStore) => void) {
	history.begin(current, action);
	const next = clone(current);
	change(next);
	history.commit(next);
	return next;
}

describe('TierHistory', () => {
	it('commits changes, skips no-ops and supports undo/redo', () => {
		const history = new TierHistory();
		const baseline = store([item(1)]);
		history.begin(baseline, 'rename_tier');
		expect(history.commit(clone(baseline))).toBe(false);

		const renamed = commit(history, baseline, 'rename_tier', (next) => (next.tiers[0].label = 'S'));
		expect(history.pastDepth).toBe(1);
		expect(history.undo(renamed)?.store.tiers[0].label).toBe('A');
		expect(history.redo(baseline)?.store.tiers[0].label).toBe('S');
	});

	it('caps the past stack at 50 entries', () => {
		const history = new TierHistory(50);
		let current = store();
		for (let index = 0; index < 55; index += 1) {
			current = commit(history, current, 'rename_tier', (next) => (next.tiers[0].label = `A${index}`));
		}
		expect(history.pastDepth).toBe(50);
	});

	it('invalidates redo after a new branch and resets a new baseline', () => {
		const history = new TierHistory();
		const baseline = store();
		const renamed = commit(history, baseline, 'rename_tier', (next) => (next.tiers[0].label = 'S'));
		const previous = history.undo(renamed)!.store;
		commit(history, previous, 'recolor_tier', (next) => (next.tiers[0].color = '#fff'));
		expect(history.futureDepth).toBe(0);

		history.reset();
		expect(history.pastDepth).toBe(0);
		expect(history.futureDepth).toBe(0);
	});

	it('rebases newly loaded items into undo and redo snapshots', () => {
		const history = new TierHistory();
		const first = item(1);
		const second = item(2);
		const baseline = store([first]);
		const ranked = commit(history, baseline, 'move_item', (next) => {
			next.collectionTierItems = [];
			next.tiers[0].items = [first];
		});
		ranked.collectionTierItems.push(second);
		history.rebaseItems([second]);

		const undone = history.undo(ranked)!.store;
		expect(undone.collectionTierItems.map((entry) => entry.id)).toEqual(['subject:1', 'subject:2']);
		const redone = history.redo(undone)!.store;
		expect(redone.tiers[0].items.map((entry) => entry.id)).toEqual(['subject:1']);
		expect(redone.collectionTierItems.map((entry) => entry.id)).toEqual(['subject:2']);
	});
});
