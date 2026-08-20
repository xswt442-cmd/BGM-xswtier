import { expect, test } from '@playwright/test';

test('VFX and UIFB persist independently and REMAKE clears them', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button').filter({ hasText: 'VFX:' }).click();
	await page.getByRole('button', { name: 'Neon', exact: true }).click();
	await page.getByRole('button').filter({ hasText: 'UIFB:' }).click();
	await page.getByRole('button', { name: 'Arcade', exact: true }).click();
	await expect(page.locator('html')).toHaveClass(/effects-neon/);
	await expect(page.locator('html')).toHaveClass(/feedback-arcade/);
	await page.reload();
	await expect(page.locator('html')).toHaveClass(/effects-neon/);
	await expect(page.locator('html')).toHaveClass(/feedback-arcade/);

	await page.getByRole('button').filter({ hasText: 'REMAKE' }).first().click();
	await page.getByRole('button', { name: 'REMAKE', exact: true }).last().click();
	await page.reload();
	await expect(page.locator('html')).toHaveClass(/effects-none/);
	await expect(page.locator('html')).toHaveClass(/feedback-none/);
});

test('390x844 start layout has no horizontal overflow', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: /click to start/i }).click();
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});
