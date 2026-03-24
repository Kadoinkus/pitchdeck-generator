import { buildDeck } from '$lib/deck-builder';
import { getOutputDir } from '$lib/server/storage';
import { saveShare } from '$lib/share-store';
import { buildSlideData } from '$lib/slide-data';
import { isRecord, safeText, sanitizeFilename } from '$lib/utils';
import { json } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';

interface ShareablePayload extends Record<string, unknown> {
	aiTextApiKey?: string;
	aiImageApiKey?: string;
}

function sanitizePayloadForShare(
	input: ShareablePayload = {},
): Record<string, unknown> {
	const cleaned = { ...input };
	delete cleaned.aiTextApiKey;
	delete cleaned.aiImageApiKey;
	return cleaned;
}

export const POST: RequestHandler = async ({ request }) => {
	const outputDir = getOutputDir();
	const raw: unknown = await request.json();
	if (!isRecord(raw)) {
		return json(
			{ success: false, message: 'Invalid request body.' },
			{ status: 400 },
		);
	}

	await fs.mkdir(outputDir, { recursive: true });

	const deck = buildDeck(raw);
	const clientName = safeText(raw.clientName, 'client');
	const projectTitle = safeText(raw.projectTitle, 'proposal');
	const deckVersion = safeText(raw.deckVersion, 'v1').replace(
		/[^a-z0-9.-]/gi,
		'-',
	);
	const fileBase = sanitizeFilename(
		`${clientName}-${projectTitle}-${deckVersion}`,
	);
	const fileName = `${fileBase}-${Date.now()}.pptx`;
	const filePath = path.join(outputDir, fileName);

	await deck.writeFile({ fileName: filePath });
	const pptxBytes = await fs.readFile(filePath);
	await fs.unlink(filePath);

	const slideData = buildSlideData(raw);
	const shareToken = await saveShare(outputDir, {
		payload: sanitizePayloadForShare(raw),
		slideData,
		fileName,
		pptxBase64: pptxBytes.toString('base64'),
	});

	return json({
		success: true,
		fileName,
		downloadUrl: `/api/download/${shareToken}`,
		slideData,
		shareToken,
		shareUrl: `/share/${shareToken}`,
		pdfUrl: `/share/${shareToken}?print=1`,
	});
};
