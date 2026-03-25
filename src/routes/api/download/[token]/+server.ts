import { buildDeck } from '$lib/deck-builder';
import { buildPptxFromShare } from '$lib/server/pptx-from-share';
import { getOutputDir } from '$lib/server/storage';
import { readShare, type ShareRecord, updateShare } from '$lib/share-store';
import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';
import { isRecord } from '$lib/utils';
import { json } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';

interface ShareDeckPayload extends DeckData {
	slides: SlideData[];
	theme: ThemeData;
}

const inFlightByToken = new Map<string, Promise<Buffer>>();

function getFileName(record: ShareRecord, token: string): string {
	if (typeof record.fileName === 'string' && record.fileName !== '') {
		return record.fileName;
	}
	return `pitchdeck-${token}.pptx`;
}

function isShareDeckPayload(value: unknown): value is ShareDeckPayload {
	if (!isRecord(value)) return false;
	return Array.isArray(value.slides) && isRecord(value.theme);
}

function readCachedPptx(record: ShareRecord): Buffer | null {
	const base64 = typeof record.pptxBase64 === 'string' ? record.pptxBase64 : '';
	if (base64 === '') return null;
	return Buffer.from(base64, 'base64');
}

async function renderPptx(
	token: string,
	record: ShareRecord,
	outputDir: string,
	requestUrl: URL,
): Promise<Buffer> {
	const fileName = getFileName(record, token);
	const slideData = record.slideData;
	const payload = isRecord(record.payload) ? record.payload : null;
	if (!isShareDeckPayload(slideData)) {
		throw new Error('Deck data missing for download render.');
	}

	try {
		const shareUrl = new URL(`/share/${token}?print=1`, requestUrl).toString();
		const rendered = await buildPptxFromShare({
			shareUrl,
			slideData,
			fileName,
		});
		console.info(
			`Generated PPTX on demand from share capture profile: ${rendered.profileName}`,
		);
		return rendered.bytes;
	} catch (shareRenderError) {
		console.error(
			'Share-rendered PPTX generation failed during download. Falling back to template renderer.',
			shareRenderError,
		);

		if (!payload) {
			console.error('Template fallback unavailable: share payload missing.');
			throw shareRenderError;
		}

		const deck = buildDeck(payload);
		const fallbackPath = path.join(outputDir, fileName);
		await deck.writeFile({ fileName: fallbackPath });
		try {
			return await fs.readFile(fallbackPath);
		} finally {
			await fs.unlink(fallbackPath).catch(() => undefined);
		}
	}
}

async function getOrRenderPptx(
	token: string,
	record: ShareRecord,
	outputDir: string,
	requestUrl: URL,
): Promise<Buffer> {
	const inFlight = inFlightByToken.get(token);
	if (inFlight) return inFlight;

	const pending = (async () => {
		const bytes = await renderPptx(token, record, outputDir, requestUrl);
		const updated = await updateShare(outputDir, token, {
			pptxBase64: bytes.toString('base64'),
		});
		if (!updated) {
			console.error(`Could not persist generated PPTX for token ${token}.`);
		}
		return bytes;
	})();

	inFlightByToken.set(token, pending);
	try {
		return await pending;
	} finally {
		inFlightByToken.delete(token);
	}
}

export const GET: RequestHandler = async ({ params, url }) => {
	const token: string | undefined = params.token;
	if (!token) {
		return json(
			{ success: false, message: 'Download token missing.' },
			{ status: 400 },
		);
	}

	const outputDir = getOutputDir();
	const record: ShareRecord | null = await readShare(outputDir, token);
	if (!record) {
		return json(
			{ success: false, message: 'Deck download not found.' },
			{ status: 404 },
		);
	}

	const fileName = getFileName(record, token);
	const cachedBytes = readCachedPptx(record);
	const bytes = cachedBytes
		? cachedBytes
		: await getOrRenderPptx(token, record, outputDir, url).catch((error) => {
			console.error('Deck download rendering failed unexpectedly.', error);
			return null;
		});

	if (!bytes) {
		return json(
			{ success: false, message: 'Unable to generate deck download right now.' },
			{ status: 500 },
		);
	}

	const responseBody = Uint8Array.from(bytes);
	return new Response(responseBody, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-store',
		},
	});
};
