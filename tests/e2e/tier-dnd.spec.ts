import { expect, test } from '@playwright/test';
import { pointerDrag, seedTierPage } from './fixtures';

test('moves 20 unique items into tiers, leaves no ghost, and accepts a drag back into an empty pool', async ({
	page,
}) => {
	await seedTierPage(page, 20);
	const unranked = page.getByTestId('unranked-zone');
	const firstTier = page.getByTestId('tier-zone').first();

	for (let id = 1; id <= 20; id += 1) {
		await pointerDrag(page, unranked.locator(`[data-item-id="subject:${id}"]`), firstTier);
		await expect(unranked.locator(`[data-item-id="subject:${id}"]`)).toHaveCount(0);
	}
	await expect(unranked.locator('[data-item-id]')).toHaveCount(0);
	await expect(firstTier.locator('[data-item-id]')).toHaveCount(20);
	await expect(page.locator('[data-item-id]')).toHaveCount(20);

	await pointerDrag(page, firstTier.locator('[data-item-id="subject:20"]'), unranked);
	await expect(unranked.locator('[data-item-id="subject:20"]')).toHaveCount(1);
	await expect(firstTier.locator('[data-item-id="subject:20"]')).toHaveCount(0);
	await expect(page.getByTestId('undo-button')).toBeEnabled();
	await page.getByTestId('undo-button').click();
	await expect(firstTier.locator('[data-item-id="subject:20"]')).toHaveCount(1);
});

test('tier reordering is undoable and redoable', async ({ page }) => {
	await seedTierPage(page, 1);
	const labels = page.getByTestId('tier-label-input');
	await pointerDrag(page, page.getByTestId('tier-drag-handle').first(), page.getByTestId('tier-bar').last());
	await expect(labels.first()).toHaveValue('B');
	await page.getByTestId('undo-button').click();
	await expect(labels.first()).toHaveValue('A');
	await page.getByTestId('redo-button').click();
	await expect(labels.first()).toHaveValue('B');
});
