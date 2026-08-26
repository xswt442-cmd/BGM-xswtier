// localStorage 写盘失败（配额溢出等）的共享信号：
// 各持久化 flush 捕获异常后 trigger，成功落盘后 clear；StatusBar 负责展示。
let active = $state(false);

export const storageWarning = {
	get active() {
		return active;
	},
	trigger() {
		active = true;
	},
	clear() {
		active = false;
	},
};
