import { describe, expect, it } from 'vitest';
import type { ItemData } from '$lib/schemas/item';
import {
	poolColumnCount,
	pruneMutableSelection,
	selectAllMutable,
	toggleMutableSelection,
	virtualRowCount,
	virtualRowKey,
	VIRTUAL_POOL_THRESHOLD,
} from '$lib/utils/poolPerformance';

const items = (count: number): ItemData[] =>
	Array.from({ length: count }, (_, index) => ({
		id: `subject:${index + 1}`,
		bgm_id: index + 1,
		category: 'subject',
		name: `Subject ${index + 1}`,
	}));

describe('pool performance helpers', () => {
	it('groups stable virtual rows at the responsive breakpoint', () => {
		const list = items(81);
		expect(VIRTUAL_POOL_THRESHOLD).toBe(80);
		expect(poolColumnCount(390)).toBe(1);
		expect(poolColumnCount(1024)).toBe(2);
		expect(virtualRowCount(list.length, 1)).toBe(81);
		expect(virtualRowCount(list.length, 2)).toBe(41);
		expect(virtualRowKey(list, 2, 2)).toBe('subject:5');
	});

	it('mutates large selections without allocating a replacement Set', () => {
		const list = items(500);
		const selection = new Set<string>();
		const identity = selection;
		selectAllMutable(selection, list);
		expect(selection).toBe(identity);
		expect(selection.size).toBe(500);
		toggleMutableSelection(selection, 'subject:1');
		expect(selection.size).toBe(499);
		pruneMutableSelection(selection, list.slice(100));
		expect(selection.size).toBe(400);
	});
});
