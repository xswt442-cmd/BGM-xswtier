import { describe, expect, it } from 'vitest';
import { createOriginMigrationBackup, restoreOriginMigrationBackup } from '../../src/lib/utils/domainMigration';

class MemoryStorage {
	data = new Map<string, string>();
	getItem(key: string) {
		return this.data.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.data.set(key, value);
	}
	removeItem(key: string) {
		this.data.delete(key);
	}
}

const tierStore = {
	version: 1 as const,
	tiers: [{ id: 'tier-a', label: 'A', color: '#f00', items: [] }],
	collectionTierItems: [],
};

describe('origin migration backup', () => {
	it('exports validated local data without the access token', () => {
		const storage = new MemoryStorage();
		storage.setItem('tierData-v2', JSON.stringify(tierStore));
		storage.setItem('bgmtier-search-pool', '[]');
		storage.setItem('bgmtier-scheme', 'dark');
		storage.setItem('bgmtier-token', 'secret');

		const backup = createOriginMigrationBackup(storage, new Date('2026-09-13T00:00:00Z'));
		expect(backup.data.tier).toEqual(tierStore);
		expect(backup.data.rankingPool).toEqual([]);
		expect(backup.data.settings?.scheme).toBe('dark');
		expect(JSON.stringify(backup)).not.toContain('secret');
	});

	it('restores a valid backup and rejects malformed data without changing storage', () => {
		const source = new MemoryStorage();
		source.setItem('tierData-v2', JSON.stringify(tierStore));
		source.setItem('bgmtier-locale', 'zh');
		const text = JSON.stringify(createOriginMigrationBackup(source));

		const target = new MemoryStorage();
		target.setItem('bgmtier-token', 'keep-me');
		expect(restoreOriginMigrationBackup(target, text)).toBe(true);
		expect(JSON.parse(target.getItem('tierData-v2') ?? '{}')).toEqual(tierStore);
		expect(target.getItem('bgmtier-locale')).toBe('zh');
		expect(target.getItem('bgmtier-token')).toBe('keep-me');

		const before = new Map(target.data);
		expect(restoreOriginMigrationBackup(target, '{"app":"other"}')).toBe(false);
		expect(target.data).toEqual(before);
	});

	it('rejects tier items that only resemble the public store shape', () => {
		const target = new MemoryStorage();
		const malformed = JSON.stringify({
			app: 'bgm-xswtier',
			type: 'origin-migration',
			version: 1,
			exportedAt: '2026-09-13T00:00:00.000Z',
			data: {
				tier: {
					version: 1,
					tiers: [{ id: 'tier-a', label: 'A', color: '#f00', items: [{ id: 'subject:1', name: 'bad' }] }],
					collectionTierItems: [],
				},
			},
		});

		expect(restoreOriginMigrationBackup(target, malformed)).toBe(false);
		expect(target.data.size).toBe(0);
	});
});
