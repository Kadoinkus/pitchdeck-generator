import { resolve } from '$app/paths';
import { command, getRequestEvent } from '$app/server';
import { hashPayload } from '$lib/payload-hash';
import { getOutputDir } from '$lib/server/storage';
import { findShareByHash, isDeckShareRecord, readShare, saveShare } from '$lib/share-store';
import { buildSlideData } from '$lib/slide-data';
import { sanitizeFilename } from '$lib/utils';
import { z } from 'zod';

// --- Schema ---

/** Loose record schema — detailed validation happens in buildSlideData. */
const DeckPayloadSchema = z.record(z.string(), z.unknown());

// --- Types ---

interface ShareablePayload extends Record<string, unknown> {
	aiTextApiKey?: string;
	aiImageApiKey?: string;
}

export interface PublishResult {
	success: true;
	fileName: string;
	downloadUrl: string;
	shareToken: string;
	shareUrl: string;
	pdfUrl: string;
	payloadHash: string;
	slideData: ReturnType<typeof buildSlideData>;
}

// --- Helpers ---

function sanitizePayloadForShare(input: ShareablePayload = {}): Record<string, unknown> {
	const cleaned = { ...input };
	delete cleaned.aiTextApiKey;
	delete cleaned.aiImageApiKey;
	return cleaned;
}

// --- Command ---

export const publishDeck = command(DeckPayloadSchema, async (payload): Promise<PublishResult> => {
	const { url } = getRequestEvent();
	const outputDir = getOutputDir();
	const payloadHash = hashPayload(payload);

	// Idempotent: return existing snapshot if payload unchanged
	const existingToken = await findShareByHash(outputDir, payloadHash);
	if (existingToken) {
		const existing = await readShare(outputDir, existingToken);
		if (existing && isDeckShareRecord(existing)) {
			return {
				success: true,
				fileName: existing.fileName,
				downloadUrl: new URL(resolve('/api/download/[token]', { token: existingToken }), url).toString(),
				slideData: existing.slideData,
				shareToken: existingToken,
				shareUrl: new URL(resolve('/share/[token]', { token: existingToken }), url).toString(),
				pdfUrl: new URL(resolve('/api/pdf/[token]', { token: existingToken }), url).toString(),
				payloadHash,
			};
		}
	}

	const slideData = buildSlideData(payload);
	const { clientName, projectTitle, deckVersion } = slideData.project;
	const fileBase = sanitizeFilename(`${clientName}-${projectTitle}-${deckVersion}`);
	const fileName = `${fileBase}-${Date.now()}.pptx`;
	const shareToken = await saveShare(outputDir, {
		payload: sanitizePayloadForShare(payload),
		slideData,
		fileName,
		pptxBase64: '',
		payloadHash,
		publishedAt: new Date().toISOString(),
	});

	return {
		success: true,
		fileName,
		downloadUrl: new URL(resolve('/api/download/[token]', { token: shareToken }), url).toString(),
		slideData,
		shareToken,
		shareUrl: new URL(resolve('/share/[token]', { token: shareToken }), url).toString(),
		pdfUrl: new URL(resolve('/api/pdf/[token]', { token: shareToken }), url).toString(),
		payloadHash,
	};
});
