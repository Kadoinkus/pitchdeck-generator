import { expect, test } from '@playwright/test';

const tinyPngDataUrl =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+q3sAAAAASUVORK5CYII=';

const twoSlidePayload: Record<string, unknown> = {
	clientName: 'E2E Compact Client',
	projectTitle: 'E2E Compact Deck',
	deckVersion: 'e2e',
	excludedSlides: [
		'opportunity',
		'solution',
		'what-notso-does',
		'meet-buddy',
		'experience-concept',
		'chat-flow',
		'example-interaction',
		'business-impact',
		'data-analytics',
		'what-you-get',
		'pricing',
		'timeline',
		'closing',
	],
	characterAssets: [
		{
			id: 'asset-1',
			name: 'Tiny mascot',
			dataUrl: tinyPngDataUrl,
			placement: 'all-mascot',
		},
	],
	imagePrompts: {
		problem: 'This prompt text should never appear in exported pptx.',
	},
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringField(
	record: Record<string, unknown>,
	field: string,
): string {
	const value = record[field];
	if (typeof value !== 'string' || value === '') {
		throw new Error(`Expected non-empty string field: ${field}`);
	}
	return value;
}

test('generate endpoint returns compact pptx download', async ({ request }) => {
	const generateResponse = await request.post('/api/generate', {
		data: twoSlidePayload,
	});
	expect(generateResponse.status()).toBe(200);

	const rawBody: unknown = await generateResponse.json();
	if (!isRecord(rawBody)) {
		throw new Error('Expected JSON object response.');
	}
	const body = rawBody;
	expect(body.success).toBe(true);

	const downloadUrl = readStringField(body, 'downloadUrl');
	const shareUrl = readStringField(body, 'shareUrl');
	const shareToken = readStringField(body, 'shareToken');

	expect(downloadUrl).toBe(`/api/download/${shareToken}`);
	expect(shareUrl).toBe(`/share/${shareToken}`);

	const downloadResponse = await request.get(downloadUrl);
	expect(downloadResponse.status()).toBe(200);

	const contentType = downloadResponse.headers()['content-type'] ?? '';
	expect(contentType).toContain(
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	);

	const bytes = await downloadResponse.body();
	expect(bytes.subarray(0, 2).toString('utf8')).toBe('PK');
	expect(bytes.length).toBeLessThan(12 * 1024 * 1024);
});

test('same payload returns same token (idempotent)', async ({ request }) => {
	const payload = {
		templateId: 'pitch-proposal',
		clientName: 'IdempotencyTest',
		projectTitle: 'Repeat',
		deckVersion: 'v1',
	};

	const res1 = await request.post('/api/generate', { data: payload });
	const body1 = await res1.json();

	const res2 = await request.post('/api/generate', { data: payload });
	const body2 = await res2.json();

	expect(body1.shareToken).toBe(body2.shareToken);
	expect(body1.payloadHash).toBe(body2.payloadHash);
});
