import { expect, test } from '@playwright/test';

test('home page renders form', async ({ page }) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', { name: 'Pitch Deck Generator' }),
	).toBeVisible();
});

test('all form sections present', async ({ page }) => {
	await page.goto('/');

	// Quick Start is a <section>, always visible
	await expect(page.getByRole('heading', { name: 'Quick Start' })).toBeVisible();

	// Slide Inclusion is a <details> with summary
	await expect(page.locator('details summary', { hasText: 'Slide Inclusion' })).toBeVisible();

	// Brand Styling is a <details> with summary
	await expect(page.locator('details summary', { hasText: 'Brand Styling' })).toBeVisible();

	// Output section heading
	await expect(page.getByRole('heading', { name: 'Output' })).toBeVisible();
});
