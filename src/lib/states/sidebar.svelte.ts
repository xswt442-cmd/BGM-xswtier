// 移动端集合抽屉的共享开关（UtilBar 的 SidebarToggle 与 tier 页的 Sheet 跨组件通信）
let open = $state(false);

export const sidebar = {
	get open() {
		return open;
	},
	set open(v: boolean) {
		open = v;
	},
	toggle() {
		open = !open;
	},
};
