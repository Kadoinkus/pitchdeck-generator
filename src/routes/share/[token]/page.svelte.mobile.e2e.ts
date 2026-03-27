import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = process.env.PITCHDECK_OUTPUT_DIR || path.join('/tmp', 'pitchdeck-generator');
const shareDir = path.join(outputDir, 'shares');
const shareToken = 'e2e-mobile-share';
const sharePath = path.join(shareDir, `${shareToken}.json`);

async function seedShareRecord(): Promise<void> {
	await fs.mkdir(shareDir, { recursive: true });
	await fs.writeFile(
		sharePath,
		JSON.stringify({
			token: shareToken,
			createdAt: new Date().toISOString(),
			slideData: {
				slides: [{ type: 'cover', title: 'Mobile Share Deck' }],
				deckTheme: {},
				project: {
					projectTitle: 'Mobile Share Deck',
					clientName: 'Mobile Client',
				},
			},
		}),
		'utf8',
	);
}

async function removeShareRecord(): Promise<void> {
	await fs.rm(sharePath, { force: true });
}

test.describe('mobile share', () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test.beforeEach(async () => {
		await seedShareRecord();
	});

	test.afterEach(async () => {
		await removeShareRecord();
	});

	test('.share-main height is greater than zero', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const height = await page.locator('.share-main').evaluate((el) =>
			el.getBoundingClientRect().height
		);
		expect(height).toBeGreaterThan(0);
	});

	test('.share-slide-frame width is greater than zero', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const frame = page.locator('.share-slide-frame').first();
		await expect(frame).toBeVisible();

		const width = await frame.evaluate((el) => el.getBoundingClientRect().width);
		expect(width).toBeGreaterThan(0);
	});

	test('rendered slide stays contained inside share frame on mobile', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const frame = page.locator('.share-slide-frame').first();
		const slide = frame.locator(':scope > .slide-render');

		await expect(frame).toBeVisible();
		await expect(slide).toBeVisible();

		const bounds = await page.evaluate(() => {
			const frameEl = document.querySelector<HTMLElement>('.share-slide-frame');
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

	test('nav buttons are hidden at mobile viewport', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const navBtns = page.locator('.share-nav-btn');
		const count = await navBtns.count();
		for (let i = 0; i < count; i++) {
			await expect(navBtns.nth(i)).not.toBeVisible();
		}
	});

	test('topbar has no horizontal overflow', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const topbar = page.locator('.share-topbar');
		await expect(topbar).toBeVisible();

		const hasOverflow = await topbar.evaluate(
			(el) => el.scrollWidth > el.clientWidth,
		);
		expect(hasOverflow).toBe(false);
	});

	test('share CTA button is visible and tappable', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const cta = page.locator('.share-cta');
		await expect(cta).toBeVisible();

		const box = await cta.boundingBox();
		expect(box).not.toBeNull();
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(32);
	});

	test('download links are visible with correct hrefs', async ({ page }) => {
		await page.goto(`/share/${shareToken}`);

		const pptxLink = page.getByRole('link', { name: 'Download PPTX' });
		await expect(pptxLink).toBeVisible();
		await expect(pptxLink).toHaveAttribute('href', `/api/download/${shareToken}`);

		const pdfLink = page.getByRole('link', { name: 'Download PDF' });
		await expect(pdfLink).toBeVisible();
		await expect(pdfLink).toHaveAttribute('href', `/api/pdf/${shareToken}`);
	});
});
