import { expect, test } from '@playwright/test';
import { makeStore, seedTierPage } from './fixtures';

test.describe('Tier undo and redo', () => {
	test('tracks tier edits, keyboard shortcuts and redo invalidation', async ({ page }) => {
		await seedTierPage(page);
		const undo = page.getByTestId('undo-button');
		const redo = page.getByTestId('redo-button');
		await expect(undo).toBeDisabled();

		await page.getByRole('button', { name: /add tier/i }).click();
		await expect(page.getByTestId('tier-bar')).toHaveCount(3);
		await expect(undo).toBeEnabled();
		await undo.click();
		await expect(page.getByTestId('tier-bar')).toHaveCount(2);
		await expect(redo).toBeEnabled();
		await page.keyboard.press('Control+Shift+Z');
		await expect(page.getByTestId('tier-bar')).toHaveCount(3);

		await page.keyboard.press('Control+Z');
		await expect(page.getByTestId('tier-bar')).toHaveCount(2);
		const firstLabel = page.getByTestId('tier-label-input').first();
		await firstLabel.fill('S');
		await firstLabel.blur();
		await expect(firstLabel).toHaveValue('S');
		await expect(redo).toBeDisabled();
		await page.keyboard.press('Control+Z');
		await expect(firstLabel).toHaveValue('A');
		await page.keyboard.press('Control+Y');
		await expect(firstLabel).toHaveValue('S');
	});

	test('does not hijack native input undo or shortcuts inside the exit dialog', async ({ page }) => {
		await seedTierPage(page);
		const input = page.getByTestId('tier-label-input').first();
		await input.focus();
		await input.press('End');
		await input.pressSequentially('X');
		await input.press('Control+Z');
		await expect(input).toHaveValue('A');
		await expect(page.getByTestId('undo-button')).toBeDisabled();

		await page.getByRole('button', { name: /add tier/i }).click();
		await page.getByRole('button', { name: 'EXIT' }).click();
		await page.keyboard.press('Control+Z');
		await expect(page.getByTestId('tier-bar')).toHaveCount(3);
	});

	test('refresh and imported or restored sessions establish a new baseline', async ({ page }) => {
		await seedTierPage(page);
		await page.getByRole('button', { name: /add tier/i }).click();
		await expect(page.getByTestId('undo-button')).toBeEnabled();
		await page.reload();
		await expect(page.getByTestId('tier-bar')).toHaveCount(3);
		await expect(page.getByTestId('undo-button')).toBeDisabled();

		await page.getByRole('button', { name: 'SAVE DRAFT' }).click();
		await page.getByRole('button', { name: /add tier/i }).click();
		await page.goto('/tier?draft=1');
		await expect(page.getByTestId('tier-bar')).toHaveCount(3);
		await expect(page.getByTestId('undo-button')).toBeDisabled();

		const imported = makeStore(1);
		imported.tiers[0].label = 'IMPORTED';
		await page.getByRole('button', { name: 'IMPORT' }).click();
		await page.locator('input[type="file"]').setInputFiles({
			name: 'tier.json',
			mimeType: 'application/json',
			buffer: Buffer.from(JSON.stringify(imported))
		});
		await expect(page.getByTestId('tier-label-input').first()).toHaveValue('IMPORTED');
		await expect(page.getByTestId('undo-button')).toBeDisabled();

		await page.getByRole('button', { name: /add tier/i }).click();
		await page.getByRole('button', { name: 'SHARE', exact: true }).click();
		await expect(page).toHaveURL(/#state=/);
		await page.reload();
		await expect(page.getByTestId('tier-bar')).toHaveCount(3);
		await expect(page.getByTestId('undo-button')).toBeDisabled();
	});

	test('recolors and deletes a tier with one undo step each', async ({ page }) => {
		await seedTierPage(page);
		await page.getByLabel('Tier settings').first().click();
		await page.getByRole('button', { name: 'var(--chart-8)' }).click();
		await expect(page.getByTestId('undo-button')).toBeEnabled();
		await page.getByTestId('undo-button').click();
		await expect(page.getByTestId('redo-button')).toBeEnabled();

		await page.getByLabel('Tier settings').first().click();
		await page.getByRole('button', { name: /delete.*tier/i }).click();
		await expect(page.getByTestId('tier-bar')).toHaveCount(1);
		await page.getByTestId('undo-button').click();
		await expect(page.getByTestId('tier-bar')).toHaveCount(2);
	});
});
