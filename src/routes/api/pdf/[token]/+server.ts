import { resolve } from '$app/paths';
import { getOutputDir } from '$lib/server/storage';
import { readShare, type ShareRecord, updateShare } from '$lib/share-store';
import { sanitizeFilename } from '$lib/utils';
import chromium from '@sparticuz/chromium';
import { json, type RequestHandler } from '@sveltejs/kit';
import { type Browser, chromium as playwrightChromium, type Page } from 'playwright-core';

const PDF_WIDTH_IN = 16;
const PDF_HEIGHT_IN = 9;

const inFlightPdfByToken = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

function getPdfFileName(record: ShareRecord, token: string): string {
	const sourceName = typeof record.fileName === 'string' ? record.fileName : '';
	const baseName = sourceName.endsWith('.pptx')
		? sourceName.slice(0, sourceName.length - '.pptx'.length)
		: sourceName;
	const safeBase = sanitizeFilename(baseName === '' ? `pitchdeck-${token}` : baseName);
	return `${safeBase}.pdf`;
}

async function waitForRenderedSlides(page: Page): Promise<void> {
	await page.waitForLoadState('networkidle');
	await page.waitForFunction(() => document.readyState === 'complete');
	await page.waitForFunction(() => {
		return Array.from(document.images).every((image) => image.complete);
	});
	await page.waitForFunction(() => document.fonts.status === 'loaded');
}

async function renderPdf(token: string, requestUrl: URL): Promise<Uint8Array<ArrayBuffer>> {
	const shareUrl = new URL(`${resolve('/share/[token]', { token })}?print=1`, requestUrl).toString();
	const executablePath = await chromium.executablePath();

	let browser: Browser | null = null;

	try {
		browser = await playwrightChromium.launch({
			args: chromium.args,
			executablePath,
			headless: true,
		});

		const context = await browser.newContext({
			viewport: {
				width: 1920,
				height: 1080,
			},
		});
		const page = await context.newPage();
		await page.addInitScript(() => {
			window.print = () => undefined;
		});
		await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
		await waitForRenderedSlides(page);
		await page.emulateMedia({ media: 'print' });

		const pdfBytes = await page.pdf({
			width: `${PDF_WIDTH_IN}in`,
			height: `${PDF_HEIGHT_IN}in`,
			printBackground: true,
			margin: {
				top: '0',
				right: '0',
				bottom: '0',
				left: '0',
			},
			preferCSSPageSize: false,
		});

		await context.close();

		return Uint8Array.from(pdfBytes);
	} finally {
		if (browser !== null) {
			await browser.close();
		}
	}
}

async function getOrRenderPdf(
	token: string,
	requestUrl: URL,
	outputDir: string,
): Promise<Uint8Array<ArrayBuffer>> {
	const inFlight = inFlightPdfByToken.get(token);
	if (inFlight) return inFlight;

	const pending = (async () => {
		const bytes = await renderPdf(token, requestUrl);
		await updateShare(outputDir, token, {
			pdfBase64: Buffer.from(bytes).toString('base64'),
		}).catch((err) => {
			console.error(`Could not persist PDF for token ${token}.`, err);
		});
		return bytes;
	})();

	inFlightPdfByToken.set(token, pending);
	try {
		return await pending;
	} finally {
		inFlightPdfByToken.delete(token);
	}
}

export const GET: RequestHandler = async ({ params, url }) => {
	const token: string | undefined = params.token;
	if (!token) {
		return json({ success: false, message: 'PDF token missing.' }, { status: 400 });
	}

	const outputDir = getOutputDir();
	const record = await readShare(outputDir, token);
	if (!record) {
		return json({ success: false, message: 'Deck share not found.' }, { status: 404 });
	}

	const cachedPdf = typeof record.pdfBase64 === 'string' && record.pdfBase64 !== ''
		? Buffer.from(record.pdfBase64, 'base64')
		: null;

	if (cachedPdf) {
		const fileName = getPdfFileName(record, token);
		return new Response(Uint8Array.from(cachedPdf), {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${fileName}"`,
				'Cache-Control': 'no-store',
			},
		});
	}

	try {
		const pdfBytes = await getOrRenderPdf(token, url, outputDir);
		const fileName = getPdfFileName(record, token);
		return new Response(pdfBytes, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${fileName}"`,
				'Cache-Control': 'no-store',
			},
		});
	} catch (error) {
		console.error('Failed to generate PDF from share page.', error);
		return json(
			{ success: false, message: 'Unable to generate PDF right now.' },
			{ status: 500 },
		);
	}
};
