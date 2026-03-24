import { getOutputDir } from '$lib/server/storage';
import { readShare, type ShareRecord } from '$lib/share-store';
import { sanitizeFilename } from '$lib/utils';
import chromium from '@sparticuz/chromium';
import { json, type RequestHandler } from '@sveltejs/kit';
import { type Browser, chromium as playwrightChromium, type Page } from 'playwright-core';

const PDF_WIDTH_IN = 16;
const PDF_HEIGHT_IN = 9;

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

export const GET: RequestHandler = async ({ params, url }) => {
	const token: string | undefined = params.token;
	if (!token) {
		return json({ success: false, message: 'PDF token missing.' }, { status: 400 });
	}

	const record = await readShare(getOutputDir(), token);
	if (!record) {
		return json({ success: false, message: 'Deck share not found.' }, { status: 404 });
	}

	const shareUrl = new URL(`/share/${token}?print=1`, url).toString();
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

		const fileName = getPdfFileName(record, token);
		const responseBody = Uint8Array.from(pdfBytes);
		return new Response(responseBody, {
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
	} finally {
		if (browser !== null) {
			await browser.close();
		}
	}
};
