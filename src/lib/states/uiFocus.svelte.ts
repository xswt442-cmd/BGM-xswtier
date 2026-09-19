/**
 * 跨页一次性焦点：画像页点条目 → 跳回 tier 页滚动定位并高亮它。
 *
 * 刻意**不走 URL 参数**：tier 页 onMount 的 URL 解析已经有 `#state=` 分享、目录 ID、
 * 用户名等多分支，且存在「hash 分支必须排在空参数 guard 之前」这类顺序约束（见 CLAUDE.md）。
 * 再塞一个查询参数进去容易踩坑。跨页瞬态高亮用全局状态更直接，刷新即失效也符合预期
 * ——它本来就只是个视觉引导，不是可分享的状态。
 */

let focusedId = $state<string | null>(null);

export const uiFocus = {
	get id() {
		return focusedId;
	},
	focus(id: string) {
		focusedId = id;
	},
	clear() {
		focusedId = null;
	},
};
