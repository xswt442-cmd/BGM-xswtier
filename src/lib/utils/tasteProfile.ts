import type { ItemData, TierDef } from '$lib/schemas/item';

/** 单条排名记录的"你给的位置" */
export type RankedEntry = {
	item: ItemData;
	tierIndex: number;
	tierLabel: string;
	/** 档内序号（0 起） */
	positionInTier: number;
	/** 综合位次：档位优先、档内顺序为次（0 = 你心里最高） */
	yourRank: number;
};

/** 一条"你 vs 大众"的偏差记录 */
export type ProfileDelta = {
	item: ItemData;
	/** 你给的位次（0 = 最高），只在本批有分条目内密集排名 */
	yourRank: number;
	/** 按 bgm 均分排的位次（0 = 最高），同上 */
	scoreRank: number;
	/** scoreRank - yourRank：正数 = 你捧得比大众高，负数 = 你亏待了它 */
	delta: number;
};

export type TierStat = {
	/** 档位 id：档位名可被用户改成重复值，渲染时必须用 id 做 key（Svelte 5 对重复 key 直接抛错） */
	id: string;
	label: string;
	count: number;
	avgScore: number | null;
};

export type TasteProfile = {
	/** 已入档条目总数 */
	rankedCount: number;
	/** 其中有 bgm 均分的条数（一致度/偏差只基于这些） */
	scoredCount: number;
	avgScore: number | null;
	/** Spearman 秩相关，1 = 与大众完全同序，-1 = 完全逆序；样本 < 4 时为 null */
	agreement: number | null;
	overrated: ProfileDelta[];
	underrated: ProfileDelta[];
	topTags: { tag: string; count: number }[];
	years: { year: string; count: number }[];
	tierStats: TierStat[];
};

/** 展平档位为带位次的排名列表（档位顺序即优先级，档内顺序即档内位次） */
export function flattenRanked(tiers: TierDef[]): RankedEntry[] {
	const out: RankedEntry[] = [];
	let cursor = 0;
	tiers.forEach((tier, tierIndex) => {
		tier.items.forEach((item, positionInTier) => {
			out.push({ item, tierIndex, tierLabel: tier.label, positionInTier, yourRank: cursor++ });
		});
	});
	return out;
}

/**
 * Spearman 秩相关。样本不足或分母为 0 时返回 null。
 *
 * ρ = 1 - 6Σd²/(n(n²-1))。简化式只在两侧都是**连续整数位次且无并列**时成立，
 * 调用方必须先把位次密集化成 0..n-1。
 */
export function spearman(rankA: number[], rankB: number[]): number | null {
	const n = rankA.length;
	if (n < 4 || n !== rankB.length) return null;
	let sumSq = 0;
	for (let i = 0; i < n; i++) {
		const d = rankA[i] - rankB[i];
		sumSq += d * d;
	}
	const denom = n * (n * n - 1);
	if (denom === 0) return null;
	return 1 - (6 * sumSq) / denom;
}

function countBy(items: ItemData[], key: (item: ItemData) => string[] | undefined): Map<string, number> {
	const counts = new Map<string, number>();
	for (const item of items) {
		for (const k of key(item) ?? []) counts.set(k, (counts.get(k) ?? 0) + 1);
	}
	return counts;
}

/**
 * 生成品味画像。
 *
 * 一致度与偏差**只基于有 bgm 均分的条目**，且两侧位次都在这一批内重新密集排名——
 * 否则"你的位次"（含无分条目）与"大众位次"（只含有分条目）尺度不同，delta 不可比；
 * 把无分条目当作 0 分也会凭空制造一堆"高估"。
 *
 * 无分条目仍计入 rankedCount / topTags / years / tierStats。
 */
export function buildTasteProfile(tiers: TierDef[]): TasteProfile {
	const ranked = flattenRanked(tiers);
	const allItems = ranked.map((r) => r.item);
	const scored = ranked.filter((r) => typeof r.item.score === 'number');

	// 同一批条目内，两侧各自密集排名为 0..n-1
	const byYourRank = [...scored].sort((a, b) => a.yourRank - b.yourRank);
	const byScore = [...scored].sort((a, b) => (b.item.score as number) - (a.item.score as number));
	const scorePosition = new Map(byScore.map((entry, i) => [entry.item.id, i]));

	const deltas: ProfileDelta[] = byYourRank.map((entry, i) => {
		const scoreRank = scorePosition.get(entry.item.id) ?? i;
		return { item: entry.item, yourRank: i, scoreRank, delta: scoreRank - i };
	});

	const scores = scored.map((r) => r.item.score as number);

	return {
		rankedCount: ranked.length,
		scoredCount: scored.length,
		avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
		agreement: spearman(
			byYourRank.map((_, i) => i),
			byYourRank.map((entry) => scorePosition.get(entry.item.id) ?? 0),
		),
		overrated: [...deltas].sort((a, b) => b.delta - a.delta).slice(0, 3),
		underrated: [...deltas].sort((a, b) => a.delta - b.delta).slice(0, 3),
		topTags: [...countBy(allItems, (i) => i.meta_tags).entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hans-CN'))
			.slice(0, 6)
			.map(([tag, count]) => ({ tag, count })),
		years: [...countBy(allItems, (i) => (i.air_date ? [i.air_date.slice(0, 4)] : undefined)).entries()]
			.sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))
			.slice(0, 6)
			.map(([year, count]) => ({ year, count })),
		tierStats: tiers.map((tier) => {
			const vals = tier.items.map((i) => i.score).filter((s): s is number => typeof s === 'number');
			return {
				id: tier.id,
				label: tier.label,
				count: tier.items.length,
				avgScore: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
			};
		}),
	};
}
