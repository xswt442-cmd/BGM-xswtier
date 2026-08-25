import { expect, type Locator, type Page } from '@playwright/test';
import type { ItemData, TierDef, TierStore } from '../../src/lib/schemas/item';

export const makeItem = (id: number): ItemData => ({
	id: `subject:${id}`,
	bgm_id: id,
	category: 'subject',
	name: `Subject ${id}`,
	name_cn: `条目 ${id}`,
	score: 8 + (id % 10) / 10,
	platform: 'TV',
	meta_tags: ['日本'],
});

export const makeTiers = (): TierDef[] => [
	{ id: 'tier-a', label: 'A', color: 'var(--chart-1)', items: [] },
	{ id: 'tier-b', label: 'B', color: 'var(--chart-2)', items: [] },
];

export const makeStore = (count = 3): TierStore => ({
	version: 1,
	tiers: makeTiers(),
	collectionTierItems: Array.from({ length: count }, (_, index) => makeItem(index + 1)),
});

export async function seedTierPage(page: Page, count = 3, store = makeStore(count)) {
	await page.route('https://api.bgm.tv/**', async (route) => {
		await route.fulfill({ status: 200, contentType: 'application/json', json: { data: [], total: 0 } });
	});
	await page.goto('/tier?user=e2e');
	// 高负载（多 worker 并行）下水合可能远慢于默认 30s 超时：先显式等待文件输入挂载，
	// 再执行导入，消除 tier-history 等用例的偶发定位超时
	const fileInput = page.locator('input[type="file"]');
	await fileInput.waitFor({ state: 'attached', timeout: 60_000 });
	await fileInput.setInputFiles({
		name: 'fixture.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(store)),
	});
	await expect(page.getByTestId('tier-bar')).toHaveCount(store.tiers.length);
	await page.goto('/tier?source=pool');
	await expect(page.getByTestId('tier-bar')).toHaveCount(store.tiers.length);
}

export async function pointerDrag(page: Page, source: Locator, target: Locator) {
	await source.scrollIntoViewIfNeeded();
	await target.scrollIntoViewIfNeeded();
	// 字体 swap / 迟到样式会引发微布局位移：先等字体全部就绪再取坐标，避免慢 runner 上首拖落点漂移
	await page.evaluate(() => document.fonts.ready.then(() => undefined));
	const from = await source.boundingBox();
	const to = await target.boundingBox();
	if (!from || !to) throw new Error('DnD source or target is not visible');
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10);
	await page.evaluate(
		() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
	);
	await page.mouse.move(to.x + to.width / 2, to.y + Math.max(8, to.height - 16), { steps: 20 });
	await page.evaluate(
		() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
	);
	await page.mouse.up();
}

export const mockSubject = (id: number) => ({
	id,
	type: 2,
	name: `Subject ${id}`,
	name_cn: `条目 ${id}`,
	platform: 'TV',
	meta_tags: ['日本'],
	rating: { total: 6000 + id, count: {}, score: 8.5, rank: id },
});
