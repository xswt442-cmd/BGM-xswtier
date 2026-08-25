import { expect, test } from '@playwright/test';
import lzString from 'lz-string';
import { makeStore, seedTierPage } from './fixtures';
import type { TierDef } from '../../src/lib/schemas/item';

const { compressToEncodedURIComponent } = lzString;

function shareHash(tiers: TierDef[]): string {
	// 与 tierSerialize 的 SharePayload 同构（渲染字段即可，条目留空）
	const payload = {
		v: 1,
		t: tiers.map((tier) => ({ id: tier.id, l: tier.label, c: tier.color, i: [] })),
		u: [],
	};
	return `#state=${compressToEncodedURIComponent(JSON.stringify(payload))}`;
}

async function openShareLink(page: import('@playwright/test').Page, hash: string) {
	await page.goto('/');
	await page.goto(`/tier${hash}`);
}

test('opening a shared link asks before replacing an existing session', async ({ page }) => {
	await seedTierPage(page);
	await expect(page.getByTestId('tier-bar')).toHaveCount(2);

	const shared = makeStore(1);
	shared.tiers[0].label = 'SHARED';
	const hash = shareHash(shared.tiers);

	// 全新导航打开分享链接：本地已有会话 → 必须先确认
	await openShareLink(page, hash);
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();

	// 取消：当前会话原样保留，hash 被清掉（刷新不再触发覆盖流程）
	await page.getByRole('button', { name: /cancel/i }).click();
	await expect(dialog).toBeHidden();
	await expect(page.getByTestId('tier-bar')).toHaveCount(2);
	await expect(page).not.toHaveURL(/#state=/);

	// 再次打开并确认：会话被分享 payload 整体替换（首档标签 A → SHARED）
	await openShareLink(page, hash);
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.getByRole('button', { name: /load & replace/i }).click();
	await expect(page.getByTestId('tier-bar')).toHaveCount(2);
	await expect(page.getByTestId('tier-label-input').first()).toHaveValue('SHARED');
	await expect(page.getByTestId('undo-button')).toBeDisabled();
});

test('refreshing a shared session restores silently without a dialog', async ({ page }) => {
	await seedTierPage(page);
	const shared = makeStore(1);
	shared.tiers[0].label = 'SHARED';
	const hash = shareHash(shared.tiers);

	// 首次打开需要确认（本地已有会话），确认后进入分享会话
	await openShareLink(page, hash);
	await page.getByRole('button', { name: /load & replace/i }).click();
	await expect(page.getByTestId('tier-label-input').first()).toHaveValue('SHARED');

	// 刷新本页：静默恢复，不弹窗
	await page.reload();
	await expect(page.getByTestId('tier-label-input').first()).toHaveValue('SHARED');
	await expect(page.getByRole('dialog')).toBeHidden();
});
