import { expect, type Page, test } from '@playwright/test';

const DECK_RESULT_STORAGE_KEY = 'proposalDeckLastResultV1';
const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';
const VIEWER_SLIDE_KEY = 'proposalDeckViewerSlide';

const SEEDED_RESULT = {
	shareToken: 'tok123',
	downloadUrl: '/api/download/tok123',
	pdfUrl: '/api/pdf/tok123',
	shareUrl: '/share/tok123',
	slideData: {
		slides: [{ type: 'cover', title: 'E2E Deck' }],
		deckTheme: {},
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
	await page.goto('/');

	const output = page.locator('section.output-section');
	await expect(output.getByRole('button', { name: 'Open viewer' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Download .pptx' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Download PDF' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Open share page' })).toBeDisabled();
	await expect(output.getByRole('button', { name: 'Copy share link' })).toBeDisabled();
});

test('output actions are enabled with a stored deck result', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/');

	const output = page.locator('section.output-section');
	await expect(output.getByRole('button', { name: 'Open viewer' })).toBeEnabled();
	await expect(output.getByRole('button', { name: 'Copy share link' })).toBeEnabled();

	await expect(output.getByRole('link', { name: 'Download .pptx' })).toHaveAttribute(
		'href',
		/\/api\/download\/tok123$/,
	);
	await expect(output.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
		'href',
		/\/api\/pdf\/tok123$/,
	);
	await expect(output.getByRole('link', { name: 'Open share page' })).toHaveAttribute(
		'href',
		/\/share\/tok123$/,
	);
});

test('viewer respects browser back and forward history', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/');

	await page.getByRole('button', { name: 'Open viewer' }).click();
	await expect(page).toHaveURL(/\/editor/);
	await expect(page.locator('.slide-viewer')).toBeVisible();

	await page.goBack();
	await expect(page.locator('.slide-viewer')).toBeHidden();

	await page.goForward();
	await expect(page.locator('.slide-viewer')).toBeVisible();
});

test('viewer close button navigates back to form', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/');

	await page.getByRole('button', { name: 'Open viewer' }).click();
	await expect(page).toHaveURL(/\/editor/);
	await expect(page.locator('.slide-viewer')).toBeVisible();

	await page.locator('.viewer-toolbar').getByRole('button', { name: 'Home' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('.slide-viewer')).toBeHidden();

	// Can go back to viewer via browser history
	await page.goBack();
	await expect(page).toHaveURL(/\/editor/);
	await expect(page.locator('.slide-viewer')).toBeVisible();
});

test('viewer share menu routes are token-based', async ({ page }) => {
	await seedDeckResult(page);
	await page.goto('/editor');

	await expect(page.locator('.slide-viewer')).toBeVisible();

	await page.locator('.viewer-share-dropdown').getByRole('button', { name: /Share/ }).click();
	const menu = page.locator('.viewer-share-menu');
	await expect(menu).toBeVisible();

	await expect(menu.getByRole('menuitem', { name: 'Download PPTX' })).toHaveAttribute(
		'href',
		/\/api\/download\/tok123$/,
	);
	await expect(menu.getByRole('menuitem', { name: 'Download PDF' })).toHaveAttribute(
		'href',
		/\/api\/pdf\/tok123$/,
	);
	await expect(menu.getByRole('menuitem', { name: 'Open share link' })).toHaveAttribute(
		'href',
		/\/share\/tok123$/,
	);
});

/**
 * Registers a one-shot mock for the publishDeck remote command.
 * SvelteKit remote functions route through `/_app/remote/**`.
 */
async function mockPublishOnce(
	page: Page,
	token: string,
	clientName: string,
): Promise<void> {
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				type: 'success',
				data: {
					success: true,
					shareToken: token,
					downloadUrl: `/api/download/${token}`,
					pdfUrl: `/api/pdf/${token}`,
					shareUrl: `/share/${token}`,
					payloadHash: `hash-${token}`,
					slideData: {
						slides: [{ type: 'cover', title: clientName }],
						deckTheme: {},
						project: { projectTitle: 'AI Mascot Proposal', clientName },
					},
				},
			}),
		}));
}

test.fixme('publish flow: navigates to editor, shows stale after edit, clears on republish', async ({ page }) => {
	// Clear storage once before the first load (not on every navigation)
	await page.addInitScript(({ resultKey, viewerKey, slideKey }) => {
		if (sessionStorage.getItem('__e2e_cleared')) return;
		sessionStorage.setItem('__e2e_cleared', '1');
		localStorage.removeItem(resultKey);
		sessionStorage.removeItem(viewerKey);
		sessionStorage.removeItem(slideKey);
	}, {
		resultKey: DECK_RESULT_STORAGE_KEY,
		viewerKey: VIEWER_STATE_KEY,
		slideKey: VIEWER_SLIDE_KEY,
	});
	await mockPublishOnce(page, 'tok-flow-1', 'Flow Client');

	await page.goto('/');

	const outputSection = page.locator('section.output-section');

	// Unpublished: default prompt text
	await expect(outputSection.locator('p')).toContainText(
		'Publish a deck to unlock links and exports.',
	);

	// Set clientName and publish
	const clientNameInput = page.locator('#clientName');
	await clientNameInput.fill('Flow Client');
	await clientNameInput.dispatchEvent('input');

	await page.locator('#publish-button').click();

	// handlePublish → onOpenViewer() → goto('/editor')
	await expect(page).toHaveURL(/\/editor/);

	// Navigate back — result is stored with matching signature: no stale
	await page.goto('/');
	await expect(outputSection.locator('p')).toContainText('Deck published.');
	await expect(outputSection.locator('p')).not.toContainText(
		'Content changed since last publish.',
	);

	// Edit clientName — signature diverges → stale
	await clientNameInput.fill('Edited Client Name');
	await clientNameInput.dispatchEvent('input');

	await expect(outputSection.locator('p')).toContainText(
		'Content changed since last publish.',
	);

	// Republish with updated name
	await page.unroute('**/_app/remote/**');
	await mockPublishOnce(page, 'tok-flow-2', 'Edited Client Name');

	await page.locator('#publish-button').click();
	await expect(page).toHaveURL(/\/editor/);

	// Navigate back — stale indicator must be gone
	await page.goto('/');
	await expect(outputSection.locator('p')).toContainText('Deck published.');
	await expect(outputSection.locator('p')).not.toContainText(
		'Content changed since last publish.',
	);
});

const TWO_SLIDE_RESULT = {
	shareToken: 'tok-nav',
	downloadUrl: '/api/download/tok-nav',
	pdfUrl: '/api/pdf/tok-nav',
	shareUrl: '/share/tok-nav',
	slideData: {
		slides: [
			{ type: 'cover', title: 'Slide One' },
			{ type: 'problem', title: 'Slide Two' },
		],
		deckTheme: {},
		project: {
			projectTitle: 'Nav Deck',
			clientName: 'Nav Client',
		},
	},
};

async function seedTwoSlideResult(page: Page): Promise<void> {
	await page.addInitScript(({ resultKey, viewerKey, slideKey, result }) => {
		localStorage.setItem(resultKey, JSON.stringify(result));
		sessionStorage.removeItem(viewerKey);
		sessionStorage.removeItem(slideKey);
	}, {
		resultKey: DECK_RESULT_STORAGE_KEY,
		viewerKey: VIEWER_STATE_KEY,
		slideKey: VIEWER_SLIDE_KEY,
		result: TWO_SLIDE_RESULT,
	});
}

test('viewer slide navigation', async ({ page }) => {
	await seedTwoSlideResult(page);
	await page.goto('/editor');

	await expect(page.locator('.slide-viewer')).toBeVisible();
	await expect(page.locator('.slide-counter')).toHaveText('1 / 2');

	await page.getByRole('button', { name: 'Next slide' }).click();
	await expect(page.locator('.slide-counter')).toHaveText('2 / 2');
});

test('viewer keyboard navigation', async ({ page }) => {
	await seedTwoSlideResult(page);
	await page.goto('/editor');

	await expect(page.locator('.slide-viewer')).toBeVisible();
	await expect(page.locator('.slide-counter')).toHaveText('1 / 2');

	await page.keyboard.press('ArrowRight');
	await expect(page.locator('.slide-counter')).toHaveText('2 / 2');
});

test('footer brand is editable and shared across slides', async ({ page }) => {
	await seedTwoSlideResult(page);
	await page.goto('/editor');

	await expect(page.locator('.slide-viewer')).toBeVisible();
	await expect(page.locator('.slide-counter')).toHaveText('1 / 2');

	const footer = page.locator('.slide-page.is-active .deck-footer').first();
	await expect(footer).toBeVisible();
	await footer.click();
	await expect(footer).toBeFocused();
	await footer.press('ControlOrMeta+A');
	await page.keyboard.type('Nova Brand Labs');
	await expect(page.locator('.slide-counter')).toHaveText('1 / 2');
	await footer.press('Enter');
	await expect(page.locator('.slide-counter')).toHaveText('1 / 2');

	await expect(footer).toHaveText('Nova Brand Labs');

	await page.getByRole('button', { name: 'Next slide' }).click();
	const nextFooter = page.locator('.slide-page.is-active .deck-footer').first();
	await expect(nextFooter).toHaveText('Nova Brand Labs');
});

test('escape in project title input cancels edit without closing viewer', async ({ page }) => {
	await seedTwoSlideResult(page);
	await page.goto('/editor');

	await expect(page.locator('.slide-viewer')).toBeVisible();
	await expect(page).toHaveURL(/\/editor$/);

	const titleInput = page.getByLabel('Project name');
	await expect(titleInput).toBeVisible();
	const original = await titleInput.inputValue();

	await titleInput.click();
	await titleInput.fill('Temporary title');
	await titleInput.press('Escape');

	await expect(page.locator('.slide-viewer')).toBeVisible();
	await expect(page).toHaveURL(/\/editor$/);
	await expect(titleInput).toHaveValue(original);
});

test('footer uses text cursor while editable', async ({ page }) => {
	await seedTwoSlideResult(page);
	await page.goto('/editor');

	const footer = page.locator('.slide-page.is-active .deck-footer').first();
	await expect(footer).toBeVisible();

	const cursor = await footer.evaluate((el) => getComputedStyle(el).cursor);
	expect(cursor).toBe('text');
});
