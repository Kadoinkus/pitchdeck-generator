import type { DeckData, ThemeData } from '$lib/slides/types';
import chromium from '@sparticuz/chromium';
import { type Browser, chromium as playwrightChromium, type Page } from 'playwright-core';
import PptxGenJS from 'pptxgenjs';

const SLIDE_WIDTH_IN = 13.333;
const SLIDE_HEIGHT_IN = 7.5;
const MAX_PPTX_BYTES = 12 * 1024 * 1024;

interface CaptureProfile {
	name: string;
	width: number;
	height: number;
	quality: number;
}

interface CapturedSlide {
	altText: string;
	data: string;
}

interface BuildPptxFromShareOptions {
	shareUrl: string;
	slideData: DeckData;
	fileName: string;
}

interface BuildPptxFromShareResult {
	bytes: Buffer;
	profileName: string;
}

const CAPTURE_PROFILES: readonly CaptureProfile[] = [
	{ name: 'wide-72', width: 1600, height: 900, quality: 72 },
	{ name: 'balanced-62', width: 1366, height: 768, quality: 62 },
	{ name: 'compact-52', width: 1280, height: 720, quality: 52 },
];

function sanitizeName(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	return trimmed === '' ? fallback : trimmed;
}

function resolveTheme(slideData: DeckData): ThemeData {
	if (slideData.deckTheme) return slideData.deckTheme;
	return {};
}

function resolveAuthor(slideData: DeckData): string {
	return sanitizeName(slideData.project?.contactName, 'Pitchdeck Generator');
}

function resolveCompany(slideData: DeckData): string {
	const theme = resolveTheme(slideData);
	return sanitizeName(theme.brandName, 'Pitchdeck');
}

function resolveTitle(slideData: DeckData): string {
	return sanitizeName(slideData.project?.projectTitle, 'Pitch Deck');
}

function normalizePptxOutput(value: unknown): Buffer {
	if (Buffer.isBuffer(value)) return value;
	if (value instanceof Uint8Array) return Buffer.from(value);
	if (value instanceof ArrayBuffer) return Buffer.from(value);
	throw new Error('Unexpected PPTX binary output type.');
}

async function waitForRenderedSlides(page: Page): Promise<void> {
	await page.waitForLoadState('networkidle');
	await page.waitForFunction(() => document.readyState === 'complete');
	await page.waitForFunction(() => {
		return Array.from(document.images).every((image) => image.complete);
	});
	await page.waitForFunction(() => {
		if (!('fonts' in document)) return true;
		return document.fonts.status === 'loaded';
	});
}

async function captureSlides(
	browser: Browser,
	shareUrl: string,
	profile: CaptureProfile,
): Promise<CapturedSlide[]> {
	const context = await browser.newContext({
		viewport: {
			width: profile.width,
			height: profile.height,
		},
		deviceScaleFactor: 1,
	});

	try {
		const page = await context.newPage();
		await page.addInitScript(() => {
			window.print = () => undefined;
		});

		await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
		await waitForRenderedSlides(page);
		await page.emulateMedia({ media: 'print' });

		const frames = page.locator('.share-slide-frame');
		const count = await frames.count();
		if (count === 0) {
			throw new Error('No share slide frames found for PPTX capture.');
		}

		const slides: CapturedSlide[] = [];
		for (let index = 0; index < count; index += 1) {
			const frame = frames.nth(index);
			await frame.scrollIntoViewIfNeeded();
			const jpeg = await frame.screenshot({
				type: 'jpeg',
				quality: profile.quality,
			});

			slides.push({
				altText: `Slide ${index + 1}`,
				data: `image/jpeg;base64,${jpeg.toString('base64')}`,
			});
		}

		return slides;
	} finally {
		await context.close();
	}
}

async function buildPptxFromSlides(
	captures: CapturedSlide[],
	slideData: DeckData,
): Promise<Buffer> {
	const theme = resolveTheme(slideData);
	const title = resolveTitle(slideData);
	const company = resolveCompany(slideData);
	const author = resolveAuthor(slideData);

	const pptx = new PptxGenJS();
	pptx.layout = 'LAYOUT_WIDE';
	pptx.author = author;
	pptx.company = company;
	pptx.subject = title;
	pptx.title = title;
	pptx.theme = {
		headFontFace: sanitizeName(theme.headingFont, 'Sora'),
		bodyFontFace: sanitizeName(theme.bodyFont, 'Inter'),
	};

	for (const capture of captures) {
		const slide = pptx.addSlide();
		slide.addImage({
			data: capture.data,
			altText: capture.altText,
			x: 0,
			y: 0,
			w: SLIDE_WIDTH_IN,
			h: SLIDE_HEIGHT_IN,
			sizing: {
				type: 'cover',
				x: 0,
				y: 0,
				w: SLIDE_WIDTH_IN,
				h: SLIDE_HEIGHT_IN,
			},
		});
	}

	const binary = await pptx.write({ outputType: 'nodebuffer' });
	return normalizePptxOutput(binary);
}

export async function buildPptxFromShare(
	options: BuildPptxFromShareOptions,
): Promise<BuildPptxFromShareResult> {
	const executablePath = await chromium.executablePath();
	let browser: Browser | null = null;

	try {
		browser = await playwrightChromium.launch({
			args: chromium.args,
			executablePath,
			headless: true,
		});

		let smallest: BuildPptxFromShareResult | null = null;

		for (const profile of CAPTURE_PROFILES) {
			const capturedSlides = await captureSlides(
				browser,
				options.shareUrl,
				profile,
			);
			const bytes = await buildPptxFromSlides(capturedSlides, options.slideData);

			const current: BuildPptxFromShareResult = {
				bytes,
				profileName: profile.name,
			};

			if (!smallest || current.bytes.length < smallest.bytes.length) {
				smallest = current;
			}

			if (current.bytes.length <= MAX_PPTX_BYTES) {
				return current;
			}
		}

		if (!smallest) {
			throw new Error('PPTX capture produced no output.');
		}

		return smallest;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}
