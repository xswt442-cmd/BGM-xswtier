import { expect, test } from '@playwright/test';
import { mockSubject } from './fixtures';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
	await page.route('https://api.bgm.tv/**', async (route) => {
		const url = new URL(route.request().url());
		if (url.pathname.endsWith('/v0/indices/123/subjects')) {
			return route.fulfill({ status: 200, contentType: 'application/json', json: { data: [{ id: 1 }, { id: 2 }], total: 2, limit: 50, offset: 0 } });
		}
		if (url.pathname.endsWith('/v0/indices/999/subjects')) return route.fulfill({ status: 500, contentType: 'application/json', json: { error: 'failed' } });
		if (url.pathname.endsWith('/v0/users/demo/collections')) return route.fulfill({ status: 200, contentType: 'application/json', json: { data: [{ subject_id: 3 }], total: 1, limit: 50, offset: 0 } });
		const subjectMatch = url.pathname.match(/\/v0\/subjects\/(\d+)$/);
		if (subjectMatch) return route.fulfill({ status: 200, contentType: 'application/json', json: mockSubject(Number(subjectMatch[1])) });
		return route.abort();
	});
	await page.goto('/');
	await page.getByRole('button', { name: /click to start/i }).click();
});

test('START tabs support keyboard navigation and keep form state', async ({ page }) => {
	await page.getByRole('textbox', { name: 'Search' }).fill('persistent query');
	const searchTab = page.getByRole('tab', { name: 'SEARCH' });
	await searchTab.focus();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('tab', { name: 'IMPORT' })).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('ArrowLeft');
	await expect(searchTab).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('persistent query');
});

test('successful imports replace the source while failures preserve it', async ({ page }) => {
	await page.getByRole('tab', { name: 'IMPORT' }).click();
	await page.getByLabel('Enter an Index ID - rank the entries in an index').fill('123');
	await page.getByRole('button', { name: 'Load index' }).click();
	await expect(page.getByTestId('import-row')).toHaveCount(2);
	await expect(page.getByTestId('import-pool-panel')).toContainText('#123');

	await page.getByLabel('Enter an Index ID - rank the entries in an index').fill('999');
	await page.getByRole('button', { name: 'Load index' }).click();
	await expect(page.getByRole('alert')).toBeVisible();
	await expect(page.getByTestId('import-row')).toHaveCount(2);
	await expect(page.getByTestId('import-pool-panel')).toContainText('#123');

	await page.getByLabel("Enter a User ID - rank TA's collection").fill('demo');
	await page.getByRole('button', { name: 'Load user collection' }).click();
	await expect(page.getByTestId('import-row')).toHaveCount(1);
	await expect(page.getByTestId('import-pool-panel')).toContainText('@demo');
});

test('sticky ranking summary opens the ranking pool', async ({ page }) => {
	const dock = page.getByTestId('ranking-pool-dock');
	await expect(dock).toBeVisible();
	await dock.getByRole('button', { name: 'VIEW POOL' }).click();
	await expect(page.getByRole('tab', { name: 'RANKING POOL' })).toHaveAttribute('aria-selected', 'true');
});
