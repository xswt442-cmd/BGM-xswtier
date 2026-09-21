import { afterEach, describe, expect, it } from 'vitest';
import { hasOpenOverlay, isEditableTarget } from '$lib/utils/dom';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('isEditableTarget', () => {
	it('输入类元素内为 true——快捷键要让位', () => {
		for (const tag of ['input', 'textarea', 'select']) {
			expect(isEditableTarget(document.createElement(tag))).toBe(true);
		}
	});

	it('contenteditable 容器及其子节点为 true', () => {
		const box = document.createElement('div');
		box.setAttribute('contenteditable', 'true');
		const child = document.createElement('span');
		box.append(child);
		document.body.append(box);
		expect(isEditableTarget(box)).toBe(true);
		expect(isEditableTarget(child)).toBe(true);
	});

	it('普通元素与非 Element 为 false', () => {
		expect(isEditableTarget(document.createElement('button'))).toBe(false);
		expect(isEditableTarget(null)).toBe(false);
		expect(isEditableTarget(window)).toBe(false);
	});
});

describe('hasOpenOverlay', () => {
	it('无浮层时为 false', () => {
		expect(hasOpenOverlay()).toBe(false);
	});

	it('原生 dialog[open] 为 true', () => {
		const dialog = document.createElement('dialog');
		dialog.setAttribute('open', '');
		document.body.append(dialog);
		expect(hasOpenOverlay()).toBe(true);
	});

	it('未打开的 dialog 为 false', () => {
		document.body.append(document.createElement('dialog'));
		expect(hasOpenOverlay()).toBe(false);
	});

	it('bits-ui 浮层 role=dialog / listbox / menu 均为 true', () => {
		for (const role of ['dialog', 'listbox', 'menu']) {
			document.body.innerHTML = '';
			const el = document.createElement('div');
			el.setAttribute('role', role);
			document.body.append(el);
			expect(hasOpenOverlay()).toBe(true);
		}
	});
});
