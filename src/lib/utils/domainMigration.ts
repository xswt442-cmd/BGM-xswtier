import type { ItemData, TierDraft, TierStore } from '$lib/schemas/item';
import { migrateStore } from '$lib/utils/tierSerialize';

const STORE_KEYS = {
	tier: 'tierData-v2',
	draft: 'bgmtier-draft-v1',
	rankingPool: 'bgmtier-search-pool',
	locale: 'bgmtier-locale',
	scheme: 'bgmtier-scheme',
	vfx: 'bgmtier-vfx',
	uifb: 'bgmtier-uifb',
	legacyEffects: 'bgmtier-effects',
} as const;

type MigrationSettings = {
	locale?: 'en' | 'zh';
	scheme?: 'sun' | 'dark' | 'sky';
	vfx?: 'none' | 'neon' | 'crt';
	uifb?: 'none' | 'arcade' | 'pulse';
};

export type OriginMigrationBackup = {
	app: 'bgm-xswtier';
	type: 'origin-migration';
	version: 1;
	exportedAt: string;
	data: {
		tier?: TierStore;
		draft?: TierDraft;
		rankingPool?: ItemData[];
		settings?: MigrationSettings;
	};
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function parseJSON(raw: string | null): unknown {
	if (raw === null) return undefined;
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function isItemData(value: unknown): value is ItemData {
	if (typeof value !== 'object' || value === null) return false;
	const item = value as Record<string, unknown>;
	return (
		Number.isInteger(item.bgm_id) &&
		Number(item.bgm_id) > 0 &&
		item.category === 'subject' &&
		item.id === `subject:${item.bgm_id}` &&
		typeof item.name === 'string'
	);
}

function parseRankingPool(value: unknown): ItemData[] | undefined {
	if (!Array.isArray(value) || !value.every(isItemData)) return undefined;
	const seen = new Set<string>();
	return value.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}

function parseTierStore(value: unknown): TierStore | undefined {
	const store = migrateStore(value);
	if (!store) return undefined;
	const allItems = [...store.collectionTierItems, ...store.tiers.flatMap((tier) => tier.items)];
	return allItems.every(isItemData) ? store : undefined;
}

function parseDraft(value: unknown): TierDraft | undefined {
	const store = parseTierStore(value);
	if (!store || typeof (value as { savedAt?: unknown }).savedAt !== 'string') return undefined;
	return { ...store, savedAt: (value as { savedAt: string }).savedAt };
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
	return value && allowed.includes(value as T) ? (value as T) : undefined;
}

function readSettings(storage: StorageLike): MigrationSettings | undefined {
	const legacyEffects = storage.getItem(STORE_KEYS.legacyEffects);
	const settings: MigrationSettings = {
		locale: oneOf(storage.getItem(STORE_KEYS.locale), ['en', 'zh']),
		scheme: oneOf(storage.getItem(STORE_KEYS.scheme), ['sun', 'dark', 'sky']),
		vfx: oneOf(storage.getItem(STORE_KEYS.vfx) ?? legacyEffects, ['none', 'neon', 'crt']),
		uifb: oneOf(storage.getItem(STORE_KEYS.uifb) ?? legacyEffects, ['none', 'arcade', 'pulse']),
	};
	return Object.values(settings).some(Boolean) ? settings : undefined;
}

export function createOriginMigrationBackup(storage: StorageLike, now = new Date()): OriginMigrationBackup {
	const tier = parseTierStore(parseJSON(storage.getItem(STORE_KEYS.tier)));
	const draft = parseDraft(parseJSON(storage.getItem(STORE_KEYS.draft)));
	const rankingPool = parseRankingPool(parseJSON(storage.getItem(STORE_KEYS.rankingPool)));
	const settings = readSettings(storage);
	return {
		app: 'bgm-xswtier',
		type: 'origin-migration',
		version: 1,
		exportedAt: now.toISOString(),
		data: {
			...(tier ? { tier } : {}),
			...(draft ? { draft } : {}),
			...(rankingPool ? { rankingPool } : {}),
			...(settings ? { settings } : {}),
		},
	};
}

function parseBackup(text: string): OriginMigrationBackup | null {
	const raw = parseJSON(text);
	if (typeof raw !== 'object' || raw === null) return null;
	const backup = raw as Partial<OriginMigrationBackup>;
	if (backup.app !== 'bgm-xswtier' || backup.type !== 'origin-migration' || backup.version !== 1) return null;
	if (typeof backup.data !== 'object' || backup.data === null) return null;

	const tier = backup.data.tier === undefined ? undefined : parseTierStore(backup.data.tier);
	if (backup.data.tier !== undefined && !tier) return null;
	const draft = backup.data.draft === undefined ? undefined : parseDraft(backup.data.draft);
	if (backup.data.draft !== undefined && !draft) return null;
	const rankingPool = backup.data.rankingPool === undefined ? undefined : parseRankingPool(backup.data.rankingPool);
	if (backup.data.rankingPool !== undefined && !rankingPool) return null;

	const settings = backup.data.settings;
	if (settings !== undefined) {
		if (typeof settings !== 'object' || settings === null) return null;
		if (settings.locale !== undefined && !['en', 'zh'].includes(settings.locale)) return null;
		if (settings.scheme !== undefined && !['sun', 'dark', 'sky'].includes(settings.scheme)) return null;
		if (settings.vfx !== undefined && !['none', 'neon', 'crt'].includes(settings.vfx)) return null;
		if (settings.uifb !== undefined && !['none', 'arcade', 'pulse'].includes(settings.uifb)) return null;
	}

	return {
		app: 'bgm-xswtier',
		type: 'origin-migration',
		version: 1,
		exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : '',
		data: {
			...(tier ? { tier } : {}),
			...(draft ? { draft } : {}),
			...(rankingPool ? { rankingPool } : {}),
			...(settings ? { settings } : {}),
		},
	};
}

export function restoreOriginMigrationBackup(storage: StorageLike, text: string): boolean {
	const backup = parseBackup(text);
	if (!backup) return false;
	const writes = new Map<string, string>();
	if (backup.data.tier) writes.set(STORE_KEYS.tier, JSON.stringify(backup.data.tier));
	if (backup.data.draft) writes.set(STORE_KEYS.draft, JSON.stringify(backup.data.draft));
	if (backup.data.rankingPool) writes.set(STORE_KEYS.rankingPool, JSON.stringify(backup.data.rankingPool));
	const settings = backup.data.settings;
	if (settings?.locale) writes.set(STORE_KEYS.locale, settings.locale);
	if (settings?.scheme) writes.set(STORE_KEYS.scheme, settings.scheme);
	if (settings?.vfx) writes.set(STORE_KEYS.vfx, settings.vfx);
	if (settings?.uifb) writes.set(STORE_KEYS.uifb, settings.uifb);
	if (writes.size === 0) return false;

	const previous = new Map([...writes.keys()].map((key) => [key, storage.getItem(key)]));
	try {
		for (const [key, value] of writes) storage.setItem(key, value);
		return true;
	} catch {
		try {
			for (const [key, value] of previous) {
				if (value === null) storage.removeItem(key);
				else storage.setItem(key, value);
			}
		} catch {
			// Best-effort rollback: a quota or browser policy may reject both operations.
		}
		return false;
	}
}
