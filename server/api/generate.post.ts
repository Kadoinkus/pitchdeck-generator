import { defineHandler } from 'nitro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildDeck } from '../../src/deck-builder.ts';
import { saveShare } from '../../src/share-store.ts';
import { buildSlideData } from '../../src/slide-data.ts';
import { safeText, sanitizeFilename } from '../../src/utils.ts';
import { getOutputDir } from '../utils/storage.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface ShareablePayload extends Record<string, unknown> {
	aiTextApiKey?: string;
	aiImageApiKey?: string;
}

function sanitizePayloadForShare(
	input: ShareablePayload = {},
): Record<string, unknown> {
	const {
		aiTextApiKey: _aiTextApiKey,
		aiImageApiKey: _aiImageApiKey,
		...rest
	} = input;

	return rest;
}

export default defineHandler(async (event) => {
	const outputDir = getOutputDir();
	const raw = await event.req.json();
	if (!isRecord(raw)) {
		return Response.json(
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

	return {
		success: true,
		fileName,
		downloadUrl: `/api/download/${shareToken}`,
		slideData,
		shareToken,
		shareUrl: `/share/${shareToken}`,
		pdfUrl: `/share/${shareToken}?print=1`,
	};
});
