import type { ItemData } from '$lib/schemas/item';

// 评分参照系：「推荐什么分进什么档」由用户自己手动排出来的首档现况反推。
// 好处是不引入任何主观常量——首档是用户亲手划的，它就是用户心里的标准。

/** 首档现况：最低分、最高分、有分条数 */
export interface IReferenceTrendline {
	low: number;
	high: number;
	count: number;
}

/**
 * 从首档条目反推参照线。首档无有效评分时返回 null（调用方据此降级为"暂不可用"）。
 * 上下界取实际最小/最大值而非写死区间，避免"首档全是 9 分以上"这种极端榜单被拉偏。
 */
export function referenceTrendline(topItems: readonly ItemData[]): IReferenceTrendline | null {
	let low = Infinity;
	let high = -Infinity;
	let count = 0;
	for (const item of topItems) {
		const score = item.score;
		if (typeof score !== 'number' || !Number.isFinite(score)) continue;
		low = Math.min(low, score);
		high = Math.max(high, score);
		count += 1;
	}
	return count === 0 ? null : { low, high, count };
}

function fmt(score: number): string {
	return Number.isInteger(score) ? score.toFixed(1) : String(score);
}

/** 参照文案：单条目退化为等值表述（"9.0"），多条目给区间 */
export function referenceRangeText(ref: IReferenceTrendline): string {
	if (ref.low === ref.high) return fmt(ref.low);
	return `${fmt(ref.low)} ~ ${fmt(ref.high)}`;
}
