import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = process.env.PITCHDECK_OUTPUT_DIR || path.join('/tmp', 'pitchdeck-generator');
const shareDir = path.join(outputDir, 'shares');
const shareToken = 'e2e-share-token';
const sharePath = path.join(shareDir, `${shareToken}.json`);

async function seedShareRecord(): Promise<void> {
	await fs.mkdir(shareDir, { recursive: true });
	await fs.writeFile(
		sharePath,
		JSON.stringify({
			token: shareToken,
			createdAt: new Date().toISOString(),
			slideData: {
				slides: [{ type: 'cover', title: 'Seeded Share Deck' }],
				deckTheme: {},
				project: {
					projectTitle: 'Seeded Share Deck',
					clientName: 'E2E Client',
				},
			},
		}),
		'utf8',
	);
}

async function removeShareRecord(): Promise<void> {
	await fs.rm(sharePath, { force: true });
}

test.beforeEach(async () => {
	await seedShareRecord();
});

test.afterEach(async () => {
	await removeShareRecord();
});

test('share page renders seeded deck', async ({ page }) => {
	const response = await page.goto(`/share/${shareToken}`);
	expect(response).not.toBeNull();
	expect(response?.status()).toBe(200);

	await expect(
		page.getByRole('banner').getByRole('heading', { name: 'Seeded Share Deck' }),
	).toBeVisible();
	await expect(page.getByText('1 / 1')).toBeVisible();

	await expect(page.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Next slide' })).toBeDisabled();

	await expect(page.getByRole('link', { name: 'Download PPTX' })).toHaveAttribute(
		'href',
		`/api/download/${shareToken}`,
	);
	await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
		'href',
		`/api/pdf/${shareToken}`,
	);
});

test('missing share token returns 404', async ({ page }) => {
	const response = await page.goto('/share/does-not-exist-e2e');
	expect(response).not.toBeNull();
	expect(response?.status()).toBe(404);
});

test('pdf endpoint returns deck pdf', async ({ request }) => {
	const response = await request.get(`/api/pdf/${shareToken}`);
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('application/pdf');

	const bytes = await response.body();
	expect(bytes.subarray(0, 4).toString('utf8')).toBe('%PDF');
});

test('share api endpoint returns tokenized download url', async ({ request }) => {
	const response = await request.get(`/api/share/${shareToken}`);
	expect(response.status()).toBe(200);

	const payload = await response.json();
	expect(payload.success).toBe(true);
	expect(payload.token).toBe(shareToken);
	expect(payload.downloadUrl).toBe(`/api/download/${shareToken}`);
});

test('download endpoint returns deck pptx', async ({ request }) => {
	const response = await request.get(`/api/download/${shareToken}`);
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain(
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	);

	const bytes = await response.body();
	expect(bytes.subarray(0, 2).toString('utf8')).toBe('PK');
});

test('share button triggers share or clipboard', async ({ page }) => {
	await page.goto(`/share/${shareToken}`);

	const shareBtn = page.locator('.share-cta');
	await expect(shareBtn).toBeVisible();

	// Click the share CTA — in Playwright's Chromium, navigator.share is
	// unsupported so it falls back to clipboard.writeText or prompt.
	// Grant clipboard permissions so the fallback succeeds.
	await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
	await shareBtn.click();

	// The button label should change to "Link copied!" on clipboard fallback
	await expect(shareBtn).toHaveText(/Link copied!/);
});
