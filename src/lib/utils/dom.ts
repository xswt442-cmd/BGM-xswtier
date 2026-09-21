/**
 * 零散 DOM 判断。只读查询、不持有状态，所以放在 utils 而不是某个组件里。
 */

/** 焦点是否落在可编辑元素上——此时快捷键要让位给输入框 */
export function isEditableTarget(target: EventTarget | null): boolean {
	return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

/**
 * 是否有打开的浮层。
 * 原生 dialog 与 bits-ui 浮层不是同一套机制：Popover / Sheet 内容挂 role=dialog，
 * Select 是 listbox，Menu 是 menu，三个都要一起避让，否则快捷键会穿透到浮层里的操作。
 */
export function hasOpenOverlay(): boolean {
	return Boolean(document.querySelector('dialog[open], [role="dialog"], [role="listbox"], [role="menu"]'));
}
