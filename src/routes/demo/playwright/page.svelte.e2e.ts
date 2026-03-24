import { expect, test } from '@playwright/test';

test('playwright demo page renders heading', async ({ page }) => {
	await page.goto('/demo/playwright');
	await expect(page.getByRole('heading', { name: 'Playwright e2e test demo' })).toBeVisible();
});
