import type { ItemData, TierDef } from '$lib/schemas/item';

/**
 * 预分档公共骨架：有分条目按得分降序排列后，由 pick 决定每条进第几档。
 * - 有分条目降序排列（首档拿最高分段）
 * - 无分条目整体垫在最后一档末尾（不静默留在池里，用户可再拖出）
 * - 各档已有内容保持在前，新条目追加在后，手动排名不被打乱
 * 纯函数：返回全新数组，不改入参。
 */
type ChunkPicker = (item: ItemData, rank: number, total: number, tierCount: number) => number;

function distribute(tiers: TierDef[], collection: ItemData[], pick: ChunkPicker) {
	const n = Math.max(1, tiers.length);
	const scored = collection
		.filter((i) => typeof i.score === 'number')
		.sort((a, b) => (b.score as number) - (a.score as number));
	const unscored = collection.filter((i) => typeof i.score !== 'number');

	const chunks: ItemData[][] = Array.from({ length: n }, () => []);
	scored.forEach((item, rank) => {
		const idx = Math.min(n - 1, Math.max(0, pick(item, rank, scored.length, n)));
		chunks[idx].push(item);
	});
	chunks[n - 1].push(...unscored);

	const nextTiers = tiers.map((tier, i) => ({ ...tier, items: [...tier.items, ...chunks[i]] }));
	return { tiers: nextTiers, leftover: [] as ItemData[] };
}

/**
 * 按评分把未排名集合预分档（**相对口径**：按条数均分）：
 * 有分条目按得分降序均匀切到当前各档，条数略头重脚轻属预期。
 * 榜单整体水平会影响落档——同样 8 分，在强榜可能只进第三档。
 */
export function distributeByScore(
	tiers: TierDef[],
	collection: ItemData[],
): { tiers: TierDef[]; leftover: ItemData[] } {
	return distribute(tiers, collection, (_item, rank, total, n) => Math.floor((rank * n) / total));
}

/** 五档榜单的评分阈值预设（降序，每项长度 = 档位数 − 1，即 4 个分界） */
export const THRESHOLD_PRESETS = {
	strict: [9.0, 8.5, 8.0, 7.5],
	standard: [8.5, 8.0, 7.5, 7.0],
	loose: [8.0, 7.5, 7.0, 6.5],
} as const;

export type ThresholdPreset = keyof typeof THRESHOLD_PRESETS;

/**
 * 按**绝对评分阈值**预分档（**绝对口径**）：第 i 档收 score ≥ thresholds[i] 的条目，末档兜底收剩余。
 * 与 distributeByScore 的差别：这里无论榜单整体水平如何，"8.5 分以上进首档"始终成立，跨榜单口径一致。
 *
 * thresholds 须降序且长度恰好为 tiers.length − 1；长度不符时原样返回（无害 no-op），
 * 避免调用方改过档位数后静默产出错乱的分布。
 */
export function distributeByThresholds(
	tiers: TierDef[],
	collection: ItemData[],
	thresholds: readonly number[],
): { tiers: TierDef[]; leftover: ItemData[] } {
	if (tiers.length < 2 || thresholds.length !== tiers.length - 1) {
		return { tiers, leftover: [] };
	}
	return distribute(tiers, collection, (item, _rank, _total, n) => {
		const score = item.score as number;
		for (let i = 0; i < n - 1; i += 1) {
			if (score >= thresholds[i]) return i;
		}
		return n - 1;
	});
}
