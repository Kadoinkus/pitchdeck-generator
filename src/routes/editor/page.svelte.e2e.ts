import { expect, type Page, test } from '@playwright/test';

const DECK_RESULT_STORAGE_KEY = 'proposalDeckLastResultV1';
const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';
const VIEWER_SLIDE_KEY = 'proposalDeckViewerSlide';

const SEEDED_RESULT = {
	shareToken: 'tok123',
	downloadUrl: '/api/download/tok123',
	pdfUrl: '/share/tok123?print=1',
	shareUrl: '/share/tok123',
	slideData: {
		slides: [{ type: 'cover', title: 'E2E Deck' }],
		theme: {},
		project: {
			projectTitle: 'E2E Deck',
			clientName: 'E2E Client',
		},
	},
};

async function clearEditorStorage(page: Page): Promise<void> {
	await page.addInitScript(({ resultKey, viewerKey, slideKey }) => {
		localStorage.removeItem(resultKey);
		sessionStorage.removeItem(viewerKey);
		sessionStorage.removeItem(slideKey);
	}, {
		resultKey: DECK_RESULT_STORAGE_KEY,
		viewerKey: VIEWER_STATE_KEY,
		slideKey: VIEWER_SLIDE_KEY,
	});
}

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

test('output actions are disabled without a generated deck', async ({ page }) => {
	await clearEditorStorage(page);
	await page.goto('/editor');

	const output = page.locator('section.output-section');
	await expect(output.getByRole('button', { name: 'Open viewer' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Download .pptx' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Download PDF' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Open share page' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Copy share link' })).toBeDisabled();
});

test('output actions are enabled with a stored deck result', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/editor');

	const output = page.locator('section.output-section');
	await expect(output.getByRole('button', { name: 'Open viewer' })).toBeEnabled();
	await expect(output.getByRole('button', { name: 'Copy share link' })).toBeEnabled();

	await expect(output.getByRole('link', { name: 'Download .pptx' })).toHaveAttribute(
		'href',
		/\/api\/download\/tok123$/,
	);
	await expect(output.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
		'href',
		/\/share\/tok123\?print=1$/,
	);
	await expect(output.getByRole('link', { name: 'Open share page' })).toHaveAttribute(
		'href',
		/\/share\/tok123$/,
	);
});

test('viewer respects browser back and forward history', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/editor');

	await page.getByRole('button', { name: 'Open viewer' }).click();
	await expect(page.locator('.slide-viewer')).toBeVisible();

	await page.goBack();
	await expect(page.locator('.slide-viewer')).toBeHidden();

	await page.goForward();
	await expect(page.locator('.slide-viewer')).toBeVisible();
});

test('viewer close button pops history entry', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/editor');

	await page.getByRole('button', { name: 'Open viewer' }).click();
	await expect(page.locator('.slide-viewer')).toBeVisible();

	await page.locator('.viewer-toolbar').getByRole('button', { name: 'Editor' }).click();
	await expect(page.locator('.slide-viewer')).toBeHidden();

	await page.goForward();
	await expect(page.locator('.slide-viewer')).toBeVisible();
});

test('viewer share menu routes are token-based', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/editor');

	await page.getByRole('button', { name: 'Open viewer' }).click();
	await expect(page.locator('.slide-viewer')).toBeVisible();

	await page.locator('.viewer-share-dropdown').getByRole('button', { name: /Share/ }).click();
	const menu = page.locator('.viewer-share-menu');
	await expect(menu).toBeVisible();

	await expect(menu.getByRole('link', { name: 'Download PPTX' })).toHaveAttribute(
		'href',
		/\/api\/download\/tok123$/,
	);
	await expect(menu.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
		'href',
		/\/share\/tok123\?print=1$/,
	);
	await expect(menu.getByRole('link', { name: 'Open share link' })).toHaveAttribute(
		'href',
		/\/share\/tok123$/,
	);
});
