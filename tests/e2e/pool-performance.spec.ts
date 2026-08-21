import { expect, test } from '@playwright/test';
import { mockSubject } from './fixtures';

async function openStart(page: import('@playwright/test').Page) {
	await page.addInitScript(() => localStorage.clear());
	await page.route('https://lain.bgm.tv/**', (route) => route.abort());
	await page.goto('/');
	await page.getByRole('button', { name: /click to start/i }).click();
}

test('500 search and ranking items stay virtualized while batch operations remain atomic', async ({ page }) => {
	await page.route('https://api.bgm.tv/**', async (route) => {
		const url = new URL(route.request().url());
		if (!url.pathname.endsWith('/v0/search/subjects')) return route.abort();
		const offset = Number(url.searchParams.get('offset') ?? 0);
		const data = Array.from({ length: 500 }, (_, index) => mockSubject(index + 1)).slice(offset, offset + 20);
		await route.fulfill({ status: 200, contentType: 'application/json', json: { data, total: 500, limit: 20, offset } });
	});
	await openStart(page);
	const searchPanel = page.getByRole('tabpanel', { name: 'SEARCH' });
	await searchPanel.getByRole('button', { name: 'SEARCH', exact: true }).click();
	await searchPanel.getByRole('button', { name: 'LOAD ALL' }).click();
	await expect(searchPanel).toContainText('Results: 500');
	await expect(page.getByTestId('search-row-render-count')).toContainText('loaded 500');
	const searchDomCount = await page.getByTestId('search-row').count();
	expect(searchDomCount).toBeGreaterThan(0);
	expect(searchDomCount).toBeLessThanOrEqual(40);
	expect(await searchPanel.locator('img').count()).toBeLessThanOrEqual(40);
	await page.getByTestId('search-row-list').evaluate((element) => { element.scrollTop = element.scrollHeight; });
	await expect(searchPanel.locator('img[alt="Subject 500"]')).toBeVisible();

	await searchPanel.getByRole('button', { name: 'ADD ALL' }).click();
	await expect(page.getByTestId('ranking-pool-dock')).toContainText('500');
	await page.getByRole('tab', { name: 'RANKING POOL' }).click();
	await expect(page.getByTestId('pool-row-render-count')).toContainText('loaded 500');
	expect(await page.getByTestId('pool-row').count()).toBeLessThanOrEqual(40);
	await page.getByRole('tabpanel', { name: 'RANKING POOL' }).getByRole('button', { name: 'SELECT ALL' }).click();
	await page.getByRole('tabpanel', { name: 'RANKING POOL' }).getByRole('button', { name: 'DEL SELECTED' }).click();
	await expect(page.getByTestId('ranking-pool-dock')).toContainText('0');
});

test('200 imported items virtualize and add to the ranking pool', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.route('https://api.bgm.tv/**', async (route) => {
		const url = new URL(route.request().url());
		if (url.pathname.endsWith('/v0/indices/200/subjects')) {
			const offset = Number(url.searchParams.get('offset') ?? 0);
			const data = Array.from({ length: 200 }, (_, index) => ({ id: index + 1 })).slice(offset, offset + 50);
			return route.fulfill({ status: 200, contentType: 'application/json', json: { data, total: 200, limit: 50, offset } });
		}
		const match = url.pathname.match(/\/v0\/subjects\/(\d+)$/);
		if (match) return route.fulfill({ status: 200, contentType: 'application/json', json: mockSubject(Number(match[1])) });
		return route.abort();
	});
	await openStart(page);
	await page.getByRole('tab', { name: 'IMPORT' }).click();
	const importPanel = page.getByRole('tabpanel', { name: 'IMPORT' });
	await importPanel.getByLabel('Enter an Index ID - rank the entries in an index').fill('200');
	await importPanel.getByRole('button', { name: 'Load index' }).click();
	await page.getByTestId('import-pool-panel').getByRole('button', { name: 'ADD ALL' }).click();
	await expect(page.getByTestId('import-row-render-count')).toContainText('loaded 200');
	expect(await page.getByTestId('import-row').count()).toBeLessThanOrEqual(40);
	await expect(page.getByTestId('ranking-pool-dock')).toContainText('200');
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});
