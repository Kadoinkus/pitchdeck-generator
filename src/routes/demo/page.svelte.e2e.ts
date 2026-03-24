import { expect, test } from '@playwright/test';

test('demo page links to playwright demo route', async ({ page }) => {
	await page.goto('/demo');

	const link = page.getByRole('link', { name: 'playwright' });
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute('href', '/demo/playwright');

	await link.click();
	await expect(page).toHaveURL(/\/demo\/playwright$/);
	await expect(page.getByRole('heading', { name: 'Playwright e2e test demo' })).toBeVisible();
});
