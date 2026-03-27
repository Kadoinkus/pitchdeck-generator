import { expect, type Page, test } from '@playwright/test';

const DECK_RESULT_STORAGE_KEY = 'proposalDeckLastResultV1';
const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';
const VIEWER_SLIDE_KEY = 'proposalDeckViewerSlide';

const SEEDED_RESULT = {
	shareToken: 'tok-mobile',
	downloadUrl: '/api/download/tok-mobile',
	pdfUrl: '/api/pdf/tok-mobile',
	shareUrl: '/share/tok-mobile',
	slideData: {
		slides: [{ type: 'cover', title: 'Mobile E2E Deck' }],
		deckTheme: {},
		project: {
			projectTitle: 'Mobile E2E Deck',
			clientName: 'Mobile Client',
		},
	},
};

async function seedDeckResult(page: Page): Promise<void> {
	await page.addInitScript(({ resultKey, viewerKey, slideKey, result }) => {
		localStorage.setItem(resultKey, JSON.stringify(result));
		sessionStorage.removeItem(viewerKey);
		sessionStorage.removeItem(slideKey);
	}, {
		resultKey: DECK_RESULT_STORAGE_KEY,
		viewerKey: VIEWER_STATE_KEY,
		slideKey: VIEWER_SLIDE_KEY,
		result: SEEDED_RESULT,
	});
}

test.describe('mobile editor', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test('editor visible with no horizontal overflow', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		await expect(page.locator('.slide-viewer')).toBeVisible();

		const hasOverflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		);
		expect(hasOverflow).toBe(false);
	});

	test('active slide fits frame at mobile viewport', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		const frame = page.locator('.slide-frame').first();
		const slide = frame.locator(':scope > .slide-render');

		await expect(frame).toBeVisible();
		await expect(slide).toBeVisible();

		const bounds = await page.evaluate(() => {
			const frameEl = document.querySelector<HTMLElement>('.slide-frame');
			const slideEl = frameEl?.querySelector<HTMLElement>(':scope > .slide-render');
			if (!frameEl || !slideEl) return null;

			const frameBox = frameEl.getBoundingClientRect();
			const slideBox = slideEl.getBoundingClientRect();

			return {
				frame: {
					left: frameBox.left,
					right: frameBox.right,
					top: frameBox.top,
					bottom: frameBox.bottom,
					width: frameBox.width,
					height: frameBox.height,
				},
				slide: {
					left: slideBox.left,
					right: slideBox.right,
					top: slideBox.top,
					bottom: slideBox.bottom,
					width: slideBox.width,
					height: slideBox.height,
				},
			};
		});

		expect(bounds).not.toBeNull();
		if (!bounds) return;

		expect(bounds.slide.width).toBeLessThanOrEqual(bounds.frame.width + 1);
		expect(bounds.slide.height).toBeLessThanOrEqual(bounds.frame.height + 1);
		expect(bounds.slide.left).toBeGreaterThanOrEqual(bounds.frame.left - 1);
		expect(bounds.slide.top).toBeGreaterThanOrEqual(bounds.frame.top - 1);
		expect(bounds.slide.right).toBeLessThanOrEqual(bounds.frame.right + 1);
		expect(bounds.slide.bottom).toBeLessThanOrEqual(bounds.frame.bottom + 1);
	});

	test('output section buttons are visible and accessible at mobile', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/');

		const output = page.locator('section.output-section');
		await expect(output).toBeVisible();

		// With a seeded result the action buttons/links should be present
		await expect(output.getByRole('button', { name: 'Open viewer' })).toBeVisible();
		await expect(output.getByRole('link', { name: 'Download .pptx' })).toBeVisible();
		await expect(output.getByRole('link', { name: 'Download PDF' })).toBeVisible();
		await expect(output.getByRole('link', { name: 'Open share page' })).toBeVisible();
		await expect(output.getByRole('button', { name: 'Copy share link' })).toBeVisible();
	});

	test('viewer toolbar buttons meet 44x44 touch target', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		await expect(page.locator('.slide-viewer')).toBeVisible();

		const homeBtn = page.locator('.viewer-home-btn');
		await expect(homeBtn).toBeVisible();
		const homeBox = await homeBtn.boundingBox();
		expect(homeBox).not.toBeNull();
		expect(homeBox!.width).toBeGreaterThanOrEqual(44);
		expect(homeBox!.height).toBeGreaterThanOrEqual(44);

		const toolbarBtns = page.locator('.toolbar-btn');
		const count = await toolbarBtns.count();
		for (let i = 0; i < count; i++) {
			const btn = toolbarBtns.nth(i);
			if (!(await btn.isVisible())) continue;
			const box = await btn.boundingBox();
			if (!box) continue;
			expect(box.width).toBeGreaterThanOrEqual(44);
			expect(box.height).toBeGreaterThanOrEqual(44);
		}
	});

	test('share dropdown backdrop covers full viewport', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		await expect(page.locator('.slide-viewer')).toBeVisible();

		const shareToggle = page.locator('.viewer-share-dropdown').getByRole('button', {
			name: /Share/,
		});
		await shareToggle.click();

		const backdrop = page.locator('.share-backdrop');
		await expect(backdrop).toBeVisible();

		const box = await backdrop.boundingBox();
		expect(box).not.toBeNull();
		// Backdrop should cover approximately the full viewport
		expect(box!.width).toBeGreaterThanOrEqual(370);
		expect(box!.height).toBeGreaterThanOrEqual(800);
	});

	test('share menu items are left-aligned', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		await expect(page.locator('.slide-viewer')).toBeVisible();

		await page.locator('.viewer-share-dropdown').getByRole('button', { name: /Share/ }).click();
		const menu = page.locator('.viewer-share-menu');
		await expect(menu).toBeVisible();

		const textAlign = await menu.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return style.textAlign;
		});
		// Text should be start or left aligned
		expect(['start', 'left', '-webkit-auto']).toContain(textAlign);
	});

	test('thumbnail strip uses row direction at mobile', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		await expect(page.locator('.slide-viewer')).toBeVisible();

		const thumbnails = page.locator('.thumbnails');
		if ((await thumbnails.count()) === 0) return;

		const flexDirection = await thumbnails.evaluate((el) => {
			return window.getComputedStyle(el).flexDirection;
		});
		expect(flexDirection).toBe('row');
	});

	test('chat launcher meets 44x44 touch target', async ({ page }) => {
		await seedDeckResult(page);
		await page.goto('/editor');

		await expect(page.locator('.slide-viewer')).toBeVisible();

		const launcher = page.locator('.launcher');
		if ((await launcher.count()) === 0) return;

		await expect(launcher).toBeVisible();
		const box = await launcher.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.width).toBeGreaterThanOrEqual(44);
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});
});
