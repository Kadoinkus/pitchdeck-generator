import { defineHandler } from 'nitro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildDeck } from '../../src/deck-builder.ts';
import { saveShare } from '../../src/share-store.ts';
import { buildSlideData } from '../../src/slide-data.ts';
import { safeText, sanitizeFilename } from '../../src/utils.ts';
import { getOutputDir } from '../utils/storage.ts';

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
	const payload = await event.req.json();

	await fs.mkdir(outputDir, { recursive: true });

	const deck = buildDeck(payload);
	const clientName = safeText(payload.clientName, 'client');
	const projectTitle = safeText(payload.projectTitle, 'proposal');
	const deckVersion = safeText(payload.deckVersion, 'v1').replace(
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

	const slideData = buildSlideData(payload);
	const shareToken = await saveShare(outputDir, {
		payload: sanitizePayloadForShare(payload),
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
