import { expect, test } from '@playwright/test';

test.describe('mobile', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test('form renders without horizontal overflow', async ({ page }) => {
		await page.goto('/');

		const hasOverflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		);
		expect(hasOverflow).toBe(false);
	});

	test('AI Autofill and Publish buttons are at least 36px tall', async ({ page }) => {
		await page.goto('/');

		for (const id of ['ai-autofill', 'publish-button']) {
			const btn = page.locator(`#${id}`);
			await expect(btn).toBeVisible();
			const box = await btn.boundingBox();
			expect(box).not.toBeNull();
			expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
		}
	});

	test('slide selector cards wrap to at most 2 columns', async ({ page }) => {
		await page.goto('/');

		// Expand slide inclusion if collapsed
		const slideSection = page.locator('details:has(summary:text("Slide Inclusion"))');
		const isOpen = await slideSection.getAttribute('open');
		if (isOpen === null) {
			await slideSection.locator('summary').click();
		}

		const chips = page.locator('.slide-chip');
		const count = await chips.count();
		if (count < 2) return;

		const positions = await chips.evaluateAll((els) =>
			els.map((el) => {
				const rect = el.getBoundingClientRect();
				return { left: rect.left, top: rect.top };
			})
		);

		// Group by row (same top value within 5px tolerance)
		const rows = new Map<number, number>();
		for (const pos of positions) {
			const rowKey = Math.round(pos.top / 5) * 5;
			rows.set(rowKey, (rows.get(rowKey) ?? 0) + 1);
		}

		for (const [, colCount] of rows) {
			expect(colCount).toBeLessThanOrEqual(2);
		}
	});

	test('Brand Styling details toggle expands content', async ({ page }) => {
		await page.goto('/');

		const details = page.locator('details.form-section:has(> summary:text("Brand Styling"))');
		const summary = details.locator('> summary');
		await expect(details).toBeAttached();

		// Close it first if open
		const wasOpen = await details.getAttribute('open');
		if (wasOpen !== null) {
			await summary.click();
		}

		// Now click to open
		await summary.click();
		await expect(details).toHaveAttribute('open', '');
	});

	test('no element exceeds viewport width after expanding all sections', async ({ page }) => {
		await page.goto('/');

		// Expand all collapsible sections
		const detailsSections = page.locator('details.form-section');
		const detailsCount = await detailsSections.count();
		for (let i = 0; i < detailsCount; i++) {
			const section = detailsSections.nth(i);
			const isOpen = await section.getAttribute('open');
			if (isOpen === null) {
				await section.locator('> summary').click();
			}
		}

		const hasOverflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		);
		expect(hasOverflow).toBe(false);
	});
});
