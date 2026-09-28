import { beforeEach, describe, expect, it, vi } from 'vitest';

// 动态 import 的目标也要被拦截，所以在这里 mock 掉渲染层
vi.mock('html-to-image', () => ({
	toPng: vi.fn(async () => 'data:image/png;base64,AAAA'),
	toSvg: vi.fn(async () => 'data:image/svg+xml,%3Csvg%2F%3E'),
}));

import { toPng, toSvg } from 'html-to-image';
import { exportTierImage } from '$lib/utils/tierImageExport';

const COVER_A = 'https://lain.bgm.tv/pic/cover/l/a.jpg';
const COVER_B = 'https://lain.bgm.tv/pic/cover/l/b.jpg';

/**
 * 造一个与真实榜单结构一致的最小节点：两个档位，其中一个为空（供 skipEmpty 用）。
 * 封面用 lain.bgm.tv（代理白名单内），这样"是否改写成代理地址"才可观测。
 */
function makeTierNode(): HTMLElement {
	const node = document.createElement('div');
	node.innerHTML = `
		<div data-testid="tier-zone">
			<div data-item-id="subject:1"><img src="${COVER_A}" loading="lazy"></div>
			<div data-item-id="subject:2"><img src="${COVER_B}" loading="lazy"></div>
		</div>
		<div data-testid="tier-zone"></div>
	`;
	document.body.appendChild(node);
	return node;
}

const srcsOf = (root: ParentNode) => [...root.querySelectorAll('img')].map((img) => img.getAttribute('src'));

beforeEach(() => {
	document.body.innerHTML = '';
	vi.clearAllMocks();
	// happy-dom 没有 CSS Font Loading API（真实浏览器都有），补上以免测的是环境差异
	if (!document.fonts) {
		Object.defineProperty(document, 'fonts', {
			value: { ready: Promise.resolve() },
			configurable: true,
		});
	}
});

describe('exportTierImage 对页面只读', () => {
	it('导出后原节点的封面地址不变——绝不能把页面留在代理地址上', async () => {
		const node = makeTierNode();
		await exportTierImage(node, { format: 'png' });
		expect(srcsOf(node)).toEqual([COVER_A, COVER_B]);
	});

	it('skipEmpty 的空档标记只写在克隆体上，不落回原节点', async () => {
		const node = makeTierNode();
		await exportTierImage(node, { format: 'png', skipEmpty: true });
		expect(node.querySelectorAll('[data-export-exclude]').length).toBe(0);
	});

	it('导出结束后离屏容器一定被清掉（无论成功还是失败）', async () => {
		const node = makeTierNode();
		await exportTierImage(node, { format: 'png' });
		expect(document.querySelector('[data-export-host]')).toBeNull();

		vi.mocked(toSvg).mockRejectedValueOnce(new Error('render boom'));
		await expect(exportTierImage(node, { format: 'svg' })).rejects.toThrow('render boom');
		expect(document.querySelector('[data-export-host]')).toBeNull();
	});

	it('封面请求挂起时，就绪等待会超时放行而不是永远卡住', async () => {
		const node = makeTierNode();
		for (const img of node.querySelectorAll('img')) {
			// 永不 settle：模拟代理无响应
			img.decode = () => new Promise<void>(() => {});
		}
		const started = Date.now();
		await exportTierImage(node, { format: 'png', timeouts: { ready: 60, render: 1_000 } });
		expect(Date.now() - started).toBeLessThan(2_000);
		expect(srcsOf(node)).toEqual([COVER_A, COVER_B]);
	});

	it('渲染超时会抛错，调用方据此复位"导出中"状态', async () => {
		const node = makeTierNode();
		vi.mocked(toPng).mockImplementationOnce(() => new Promise<string>(() => {}));
		await expect(exportTierImage(node, { format: 'png', timeouts: { ready: 10, render: 80 } })).rejects.toThrow(
			/timed out/,
		);
		expect(document.querySelector('[data-export-host]')).toBeNull();
	});
});

describe('exportTierImage 仍然完成本职改写', () => {
	it('交给渲染层的克隆体里，封面已改写成同源代理地址', async () => {
		const node = makeTierNode();
		await exportTierImage(node, { format: 'png' });
		const rendered = vi.mocked(toPng).mock.calls[0][0] as HTMLElement;
		expect(srcsOf(rendered)).toEqual([
			`/api/img?url=${encodeURIComponent(COVER_A)}`,
			`/api/img?url=${encodeURIComponent(COVER_B)}`,
		]);
	});

	it('skipEmpty 在克隆体上标出了没有条目的档位', async () => {
		const node = makeTierNode();
		await exportTierImage(node, { format: 'png', skipEmpty: true });
		const rendered = vi.mocked(toPng).mock.calls[0][0] as HTMLElement;
		expect(rendered.querySelectorAll('[data-export-exclude]').length).toBe(1);
	});
});
