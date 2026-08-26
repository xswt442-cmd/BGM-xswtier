import type { ItemData, TierDef } from '$lib/schemas/item';

/**
 * 按评分把未排名集合预分档：
 * - 有分条目按得分降序均匀切到当前各档（首档拿最高分段，条数略头重脚轻属预期）
 * - 无分条目整体垫在最后一档末尾（不静默留在池里，用户可再拖出）
 * - 各档已有内容保持在前，新条目追加在后，手动排名不被打乱
 * 纯函数：返回全新数组，不改入参。
 */
export function distributeByScore(
	tiers: TierDef[],
	collection: ItemData[],
): { tiers: TierDef[]; leftover: ItemData[] } {
	const n = Math.max(1, tiers.length);
	const scored = collection
		.filter((i) => typeof i.score === 'number')
		.sort((a, b) => (b.score as number) - (a.score as number));
	const unscored = collection.filter((i) => typeof i.score !== 'number');

	const chunks: ItemData[][] = Array.from({ length: n }, () => []);
	scored.forEach((item, idx) => {
		chunks[Math.min(n - 1, Math.floor((idx * n) / scored.length))].push(item);
	});
	chunks[n - 1].push(...unscored);

	const nextTiers = tiers.map((tier, i) => ({ ...tier, items: [...tier.items, ...chunks[i]] }));
	return { tiers: nextTiers, leftover: [] };
}
