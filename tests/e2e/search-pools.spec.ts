import { expect, test } from '@playwright/test';
import { mockSubject } from './fixtures';

async function openSearch(page: import('@playwright/test').Page) {
	await page.route('https://api.bgm.tv/**', async (route) => {
		const url = new URL(route.request().url());
		if (!url.pathname.endsWith('/v0/search/subjects')) return route.abort();
		const offset = Number(url.searchParams.get('offset') ?? 0);
		const data = Array.from({ length: 45 }, (_, index) => mockSubject(index + 1)).slice(offset, offset + 20);
		await route.fulfill({ status: 200, contentType: 'application/json', json: { data, total: 45, limit: 20, offset } });
	});
	await page.goto('/');
	await page.getByRole('button', { name: /click to start/i }).click();
	await page.getByRole('tabpanel', { name: 'SEARCH' }).getByRole('button', { name: 'SEARCH', exact: true }).click();
	await expect(page.getByTestId('search-row')).toHaveCount(20);
}

test('Load More and Load All scan pages without changing the ranking pool', async ({ page }) => {
	await openSearch(page);
	await page.getByRole('button', { name: /load more/i }).click();
	await expect(page.getByTestId('search-row')).toHaveCount(40);
	await page.getByRole('button', { name: /load all/i }).click();
	await expect(page.getByTestId('search-row')).toHaveCount(45);
	await expect(page.getByTestId('pool-row')).toHaveCount(0);

	await page.getByRole('button', { name: 'SELECT ALL' }).click();
	await page.getByRole('button', { name: 'ADD SELECTED' }).click();
	await page.getByRole('tab', { name: 'RANKING POOL' }).click();
	await expect(page.getByTestId('pool-row')).toHaveCount(45);
	await page.getByTestId('pool-row').nth(0).getByRole('checkbox').check();
	await page.getByTestId('pool-row').nth(1).getByRole('checkbox').check();
	await page.getByRole('button', { name: 'DEL SELECTED' }).click();
	await expect(page.getByTestId('pool-row')).toHaveCount(43);
});

test('Add All scans and adds every unique match', async ({ page }) => {
	await openSearch(page);
	await page.getByRole('button', { name: 'ADD ALL' }).click();
	await expect(page.getByTestId('search-row')).toHaveCount(45);
	await page.getByRole('tab', { name: 'RANKING POOL' }).click();
	await expect(page.getByTestId('pool-row')).toHaveCount(45);
});
