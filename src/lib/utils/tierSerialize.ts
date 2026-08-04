// tier 会话序列化：URL 分享 + JSON 导入导出共用一层。
// 纯函数，不依赖 $state / tierData（干净依赖方向：页面 → tierData.snapshot() → 本模块）。

import type { ItemData, TierDef, TierStore } from '$lib/schemas/item';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/** URL 版精简条目：只保留渲染贴纸卡所需的字段（短名控制 URL 体积，仿 opentierboy） */
export type ShareItem = { id: string; n: string; nc?: string; im?: string; s?: number };
/** l=label, c=color, i=items */
export type ShareTier = { id: string; l: string; c: string; i: ShareItem[] };
/** v=store version, t=tiers, u=unranked collection（接收方也拿到未排名池） */
export type SharePayload = { v: 1; t: ShareTier[]; u: ShareItem[] };

/** 超过该长度提示改用 JSON 导出（Chrome 单 URL 上限 ~64k，这里远低于它，仅 UX 提示） */
export const URL_MAX_LENGTH = 2000;
/** hash 形如 "#state=<compressed>" */
export const SHARE_HASH_PREFIX = 'state=';

const ITEM_ID_RE = /^subject:(\d+)$/;

function toShareItem(item: ItemData): ShareItem {
	const share: ShareItem = { id: item.id, n: item.name };
	if (item.name_cn) share.nc = item.name_cn;
	if (item.image) share.im = item.image;
	if (item.score !== undefined) share.s = item.score;
	return share;
}

function toShareTier(tier: TierDef): ShareTier {
	return { id: tier.id, l: tier.label, c: tier.color, i: tier.items.map(toShareItem) };
}

function fromShareItem(share: unknown): ItemData | null {
	if (typeof share !== 'object' || share === null) return null;
	const s = share as Record<string, unknown>;
	if (typeof s.id !== 'string') return null;
	const m = ITEM_ID_RE.exec(s.id);
	if (!m || typeof s.n !== 'string') return null;
	const item: ItemData = { id: s.id, bgm_id: Number(m[1]), category: 'subject', name: s.n };
	if (typeof s.nc === 'string') item.name_cn = s.nc;
	if (typeof s.im === 'string') item.image = s.im;
	if (typeof s.s === 'number' && Number.isFinite(s.s)) item.score = s.s;
	return item;
}

function fromShareTier(share: unknown): TierDef | null {
	if (typeof share !== 'object' || share === null) return null;
	const s = share as Record<string, unknown>;
	if (typeof s.id !== 'string' || typeof s.l !== 'string' || typeof s.c !== 'string') return null;
	if (!Array.isArray(s.i)) return null;
	const items: ItemData[] = [];
	for (const raw of s.i) {
		const item = fromShareItem(raw);
		if (!item) return null;
		items.push(item);
	}
	return { id: s.id, label: s.l, color: s.c, items };
}

function fromSharePayload(payload: unknown): TierStore | null {
	if (typeof payload !== 'object' || payload === null) return null;
	const p = payload as Record<string, unknown>;
	if (p.v !== 1) return null;
	if (!Array.isArray(p.t) || !Array.isArray(p.u)) return null;
	const tiers: TierDef[] = [];
	for (const raw of p.t) {
		const tier = fromShareTier(raw);
		if (!tier) return null;
		tiers.push(tier);
	}
	const collection: ItemData[] = [];
	for (const raw of p.u) {
		const item = fromShareItem(raw);
		if (!item) return null;
		collection.push(item);
	}
	return { version: 1, tiers, collectionTierItems: collection };
}

/** TierStore → URL 精简 payload 压缩串（直接可拼 `#state=`） */
export function encodeURL(store: TierStore): string {
	const payload: SharePayload = {
		v: 1,
		t: store.tiers.map(toShareTier),
		u: store.collectionTierItems.map(toShareItem)
	};
	return compressToEncodedURIComponent(JSON.stringify(payload));
}

/** hash 字符串（含或不含前导 #）→ TierStore；任何一步失败返回 null */
export function decodeURL(hash: string): TierStore | null {
	try {
		const raw = hash.replace(/^#/, '');
		if (!raw.startsWith(SHARE_HASH_PREFIX)) return null;
		const json = decompressFromEncodedURIComponent(raw.slice(SHARE_HASH_PREFIX.length));
		if (!json) return null;
		return fromSharePayload(JSON.parse(json));
	} catch {
		return null;
	}
}

/** URL 版导出：完整字段、美化缩进、带 app/type/version/exportedAt 校验包装 */
export function exportJSON(store: TierStore): string {
	return JSON.stringify(
		{
			...store,
			version: 1,
			app: 'bgm-xswtier',
			type: 'tier-list',
			exportedAt: new Date().toISOString()
		},
		null,
		2
	);
}

export type ImportResult =
	| { ok: true; store: TierStore }
	| { ok: false; reason: 'parse-error' | 'invalid-shape' | 'empty' };

function isItemData(v: unknown): boolean {
	if (typeof v !== 'object' || v === null) return false;
	const o = v as Record<string, unknown>;
	if (typeof o.id !== 'string' || !ITEM_ID_RE.test(o.id)) return false;
	if (typeof o.name !== 'string') return false;
	return true;
}

/** 结构守卫：兼容 exportJSON 的包装结构与裸 TierStore（多余字段宽容） */
export function validateStore(s: unknown): s is TierStore {
	if (typeof s !== 'object' || s === null) return false;
	const o = s as Record<string, unknown>;
	if (o.version !== 1) return false;
	if (!Array.isArray(o.tiers)) return false;
	if (!Array.isArray(o.collectionTierItems)) return false;
	for (const t of o.tiers) {
		if (typeof t !== 'object' || t === null) return false;
		const tier = t as Record<string, unknown>;
		if (typeof tier.id !== 'string' || typeof tier.label !== 'string' || typeof tier.color !== 'string') return false;
		if (!Array.isArray(tier.items)) return false;
		for (const it of tier.items) {
			if (!isItemData(it)) return false;
		}
	}
	for (const it of o.collectionTierItems) {
		if (!isItemData(it)) return false;
	}
	return true;
}

/** 文件文本 → 导入结果，区分「不是 JSON / 结构不对 / 空档位」 */
export function importJSON(text: string): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return { ok: false, reason: 'parse-error' };
	}
	if (!validateStore(parsed)) return { ok: false, reason: 'invalid-shape' };
	const store = parsed as TierStore;
	if (store.tiers.length === 0) return { ok: false, reason: 'empty' };
	return { ok: true, store };
}
