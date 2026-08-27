import { describe, expect, it } from 'vitest';
import type { TierStore } from '$lib/schemas/item';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {
	decodeURL,
	encodeURL,
	exportJSON,
	importJSON,
	migrateStore,
	SHARE_HASH_PREFIX,
} from '$lib/utils/tierSerialize';

const fixture: TierStore = {
	version: 1,
	tiers: [
		{
			id: 'tier-a',
			label: 'S',
			color: 'var(--chart-1)',
			items: [{ id: 'subject:1', bgm_id: 1, category: 'subject', name: 'One', name_cn: '一', score: 8.7 }],
		},
	],
	collectionTierItems: [{ id: 'subject:2', bgm_id: 2, category: 'subject', name: 'Two' }],
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

	it('importJSON distinguishes the empty-store branch from shape errors', () => {
		const empty = JSON.stringify({ version: 1, tiers: [], collectionTierItems: [] });
		expect(importJSON(empty)).toEqual({ ok: false, reason: 'empty' });
		const badItem = JSON.stringify({
			version: 1,
			tiers: [{ id: 't', label: 'A', color: 'red', items: [{ id: 'char:9', name: 'X' }] }],
			collectionTierItems: [],
		});
		expect(importJSON(badItem)).toEqual({ ok: false, reason: 'invalid-shape' });
	});

	it('decodeURL returns null on every failure path instead of throwing', () => {
		expect(decodeURL('#other=whatever')).toBeNull(); // 非 state 前缀
		expect(decodeURL('#state=!!!not-a-lz-payload!!!')).toBeNull(); // 解压失败
		const hostile = JSON.stringify({
			v: 1,
			t: [{ id: 't1', l: 'A', c: 'red', i: [{ id: 'char:9', n: 'X' }] }],
			u: [],
		});
		const encoded = compressToEncodedURIComponent(hostile);
		expect(decodeURL(`#${SHARE_HASH_PREFIX}${encoded}`)).toBeNull(); // 非 subject 条目被拒
		expect(decodeURL(`#${SHARE_HASH_PREFIX}${decompressFromEncodedURIComponent(encoded)}`)).toBeNull();
	});

	it('migrateStore passes current-version data through and rejects future/broken versions', () => {
		expect(migrateStore(structuredClone(fixture))).toEqual(fixture);
		// 未来版本：旧前端明确拒绝
		expect(migrateStore({ ...structuredClone(fixture), version: 2 })).toBeNull();
		// 非法 version 形态
		expect(migrateStore({ ...structuredClone(fixture), version: '1' })).toBeNull();
		const { version: _omit, ...legacy } = structuredClone(fixture);
		void _omit;
		expect(migrateStore(legacy)).toBeNull();
		// 版本对但结构损坏 → 终检拒绝
		expect(migrateStore({ version: 1, tiers: 'nope', collectionTierItems: [] })).toBeNull();
	});

	it('importJSON routes through the migration gate (future version rejected)', () => {
		expect(importJSON(JSON.stringify({ ...structuredClone(fixture), version: 2 }))).toEqual({
			ok: false,
			reason: 'invalid-shape',
		});
	});
});
