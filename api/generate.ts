import fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { buildDeck } from '../src/deck-builder.ts';
import { saveShare } from '../src/share-store.ts';
import { buildSlideData } from '../src/slide-data.ts';
import { safeText, sanitizeFilename } from '../src/utils.ts';
import {
	handleOptions,
	isMethod,
	type JsonObject,
	readJsonBody,
	sendJson,
} from './_lib/http.ts';
import { getOutputDir } from './_lib/storage.ts';

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

export default function handler(req: IncomingMessage, res: ServerResponse): void {
	if (handleOptions(req, res)) {
		return;
	}

	if (!isMethod(req, 'POST')) {
		sendJson(res, 405, { success: false, message: 'Method not allowed.' });
		return;
	}

	const outputDir = getOutputDir();

	void readJsonBody(req)
		.then(async (payload: JsonObject) => {
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

			sendJson(res, 200, {
				success: true,
				fileName,
				downloadUrl: `/api/download/${shareToken}`,
				slideData,
				shareToken,
				shareUrl: `/share/${shareToken}`,
				pdfUrl: `/share/${shareToken}?print=1`,
			});
		})
		.catch((error: unknown) => {
			console.error('Deck generation failed:', error);
			sendJson(res, 500, {
				success: false,
				message: 'Could not generate the PowerPoint file.',
			});
		});
}
