import { buildDeck } from '$lib/deck-builder';
import { buildPptxFromShare } from '$lib/server/pptx-from-share';
import { getOutputDir } from '$lib/server/storage';
import { saveShare, updateShare } from '$lib/share-store';
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

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const outputDir = getOutputDir();
		const raw: unknown = await request.json();
		if (!isRecord(raw)) {
			return json(
				{ success: false, message: 'Invalid request body.' },
				{ status: 400 },
			);
		}

		await fs.mkdir(outputDir, { recursive: true });

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

		const slideData = buildSlideData(raw);
		const shareToken = await saveShare(outputDir, {
			payload: sanitizePayloadForShare(raw),
			slideData,
			fileName,
			pptxBase64: '',
		});

		let pptxBytes: Buffer;
		try {
			const shareUrl = new URL(`/share/${shareToken}?print=1`, url).toString();
			const rendered = await buildPptxFromShare({
				shareUrl,
				slideData,
				fileName,
			});
			console.info(
				`Generated PPTX from share capture profile: ${rendered.profileName}`,
			);
			pptxBytes = rendered.bytes;
		} catch (error) {
			console.error(
				'Share-rendered PPTX generation failed. Falling back to template renderer.',
				error,
			);
			const deck = buildDeck(raw);
			const fallbackPath = path.join(outputDir, fileName);
			await deck.writeFile({ fileName: fallbackPath });
			pptxBytes = await fs.readFile(fallbackPath);
			await fs.unlink(fallbackPath);
		}

		const updated = await updateShare(outputDir, shareToken, {
			pptxBase64: pptxBytes.toString('base64'),
		});

		if (!updated) {
			return json(
				{ success: false, message: 'Could not save generated deck.' },
				{ status: 500 },
			);
		}

		return json({
			success: true,
			fileName,
			downloadUrl: `/api/download/${shareToken}`,
			slideData,
			shareToken,
			shareUrl: `/share/${shareToken}`,
			pdfUrl: `/api/pdf/${shareToken}`,
		});
	} catch (error) {
		console.error('Deck generation failed unexpectedly.', error);
		const message = error instanceof Error
			? error.message
			: 'Internal error while generating deck.';
		return json({ success: false, message }, { status: 500 });
	}
};
