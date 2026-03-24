import PptxGenJS from 'pptxgenjs';
import { buildDeckModel } from './deck-model.ts';

type DeckModel = ReturnType<typeof buildDeckModel>;
type DeckSlide = DeckModel['slides'][number];
type DeckTheme = DeckModel['deckTheme'];
type PptxPresentation = InstanceType<typeof PptxGenJS>;

/** Derive the Slide type from addSlide() return type */
type PptxSlide = ReturnType<PptxPresentation['addSlide']>;

interface ImagePlaceholderOptions {
	slideInfo?: DeckSlide | null;
	optional?: boolean;
	mode?: string;
	x?: number;
	y?: number;
	w?: number;
	h?: number;
}

interface BulletOptions {
	x?: number;
	y?: number;
	w?: number;
	h?: number;
	fontFace?: string;
	fontSize?: number;
	color?: string;
}

function toPptColor(hex: unknown, fallback = '0B1D2E'): string {
	const value = String(hex || '')
		.replace('#', '')
		.trim();
	return value.length ? value : fallback;
}

function fontByDensity(size: number, density: unknown, min = 7): number {
	void density;
	return Math.max(min, Math.round(size * 10) / 10);
}

function bg(slide: PptxSlide, color: unknown): void {
	slide.background = { color: toPptColor(color, 'F2F4F6') };
}

function addFooter(
	slide: PptxSlide,
	theme: DeckTheme,
	brandName: string,
): void {
	slide.addText(brandName || '', {
		x: 0.62,
		y: 7.12,
		w: 2.7,
		h: 0.2,
		fontFace: theme.bodyFont,
		fontSize: 8,
		bold: true,
		color: toPptColor(theme.primaryColor, '004B49'),
	});
}

function addTop(
	slide: PptxSlide,
	slideInfo: { title?: string; subtitle?: string; density?: unknown },
	theme: DeckTheme & { textColor: string },
	step: string,
): void {
	if (step) {
		slide.addShape('ellipse', {
			x: 0.64,
			y: 0.62,
			w: 0.34,
			h: 0.34,
			fill: { color: toPptColor(theme.primaryColor, '004B49') },
			line: { color: toPptColor(theme.primaryColor, '004B49'), pt: 1 },
		});
		slide.addText(step, {
			x: 0.76,
			y: 0.74,
			w: 0.1,
			h: 0.1,
			fontFace: theme.bodyFont,
			fontSize: 7,
			bold: true,
			color: 'FFFFFF',
			align: 'center',
		});
	}

	slide.addText(slideInfo.title || '', {
		x: 1.1,
		y: 0.68,
		w: 8.8,
		h: 0.58,
		fontFace: theme.headingFont,
		fontSize: fontByDensity(29, slideInfo?.density, 18),
		bold: true,
		color: toPptColor(theme.textColor, '0B1D2E'),
	});

	if (slideInfo.subtitle) {
		slide.addText(slideInfo.subtitle, {
			x: 1.1,
			y: 1.26,
			w: 9.4,
			h: 0.3,
			fontFace: theme.bodyFont,
			fontSize: fontByDensity(12, slideInfo?.density, 8),
			color: '4D617E',
		});
	}
}

function imagePlaceholder(
	slide: PptxSlide,
	theme: DeckTheme,
	prompt: string | undefined,
	options: ImagePlaceholderOptions = {},
): void {
	const {
		slideInfo = null,
		optional = true,
		mode = 'cover',
		x = 8.0,
		y = 1.8,
		w = 4.6,
		h = 4.6,
	} = options;

	const hideImages = Boolean(slideInfo?.hideImages);
	if (hideImages && optional) return;
	const activeMode = String(slideInfo?.imageMode || mode || 'cover').toLowerCase() === 'contain'
		? 'contain'
		: 'cover';

	slide.addShape('roundRect', {
		x,
		y,
		w,
		h,
		rectRadius: 0.08,
		fill: { color: 'F7FAFD' },
		line: { color: 'C8D7EA', pt: 1, dashType: 'dash' },
	});

	slide.addText(`[Visual · ${activeMode}]`, {
		x: x + 0.2,
		y: y + 0.12,
		w: w - 0.4,
		h: 0.2,
		fontFace: theme.bodyFont,
		fontSize: 9,
		bold: true,
		color: toPptColor(theme.primaryColor, '004B49'),
	});

	slide.addText(prompt || 'Add visual', {
		x: x + 0.2,
		y: y + 0.35,
		w: w - 0.35,
		h: h - 0.5,
		fontFace: theme.bodyFont,
		fontSize: 8,
		color: '4A638A',
		fit: 'shrink',
	});
}

function addBullets(
	slide: PptxSlide,
	items: string[],
	options: BulletOptions = {},
): void {
	const {
		x = 1.0,
		y = 2.0,
		w = 5.8,
		h = 2.8,
		fontFace = 'Inter',
		fontSize = 13,
		color = '314F79',
	} = options;

	const runs = (items || []).map((line) => ({
		text: line,
		options: {
			bullet: { indent: 12 },
			hanging: 2,
			breakLine: true,
		},
	}));

	slide.addText(runs, {
		x,
		y,
		w,
		h,
		fontFace,
		fontSize,
		color,
		paraSpaceAfter: 9,
		margin: 2,
	});
}

function renderCover(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);

	slide.addShape('roundRect', {
		x: 0.72,
		y: 0.62,
		w: 5.2,
		h: 6.2,
		rectRadius: 0.1,
		fill: { color: 'FFFFFF' },
		line: { color: 'D6E1F1', pt: 1 },
	});

	slide.addText('NOTSO AI PRESENTS', {
		x: 1.0,
		y: 1.06,
		w: 4.2,
		h: 0.25,
		fontFace: theme.bodyFont,
		fontSize: 11,
		bold: true,
		color: '3F5C81',
	});

	slide.addText(slideInfo.title || model.project.projectTitle, {
		x: 1.0,
		y: 1.45,
		w: 4.6,
		h: 1.1,
		fontFace: theme.headingFont,
		fontSize: fontByDensity(41, slideInfo?.density, 24),
		bold: true,
		color: toPptColor(theme.textColor, '0B1D2E'),
		fit: 'shrink',
	});

	const oneLiner = getStringField(slideInfo, 'oneLiner');
	slide.addText(oneLiner || model.project.coverOneLiner, {
		x: 1.0,
		y: 2.78,
		w: 4.6,
		h: 1.2,
		fontFace: theme.bodyFont,
		fontSize: fontByDensity(16, slideInfo?.density, 10),
		color: '334E77',
		fit: 'shrink',
	});

	slide.addShape('roundRect', {
		x: 1.0,
		y: 5.76,
		w: 2.9,
		h: 0.48,
		rectRadius: 0.08,
		fill: { color: toPptColor(theme.accentColor, '30D89E') },
		line: { color: toPptColor(theme.accentColor, '30D89E'), pt: 1 },
	});
	slide.addText(model.project.proposalDate || '', {
		x: 1.1,
		y: 5.92,
		w: 2.7,
		h: 0.2,
		fontFace: theme.bodyFont,
		fontSize: 11,
		bold: true,
		color: '0D3C43',
		align: 'center',
	});

	imagePlaceholder(slide, theme, slideInfo.imagePrompt, {
		slideInfo,
		optional: false,
		mode: slideInfo?.imageMode,
		x: 6.08,
		y: 0.78,
		w: 6.45,
		h: 5.95,
	});
}

function renderProblem(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	const points = getStringArray(slideInfo, 'points');
	points.slice(0, 3).forEach((point, idx) => {
		const x = 1.0 + idx * 4.06;
		slide.addShape('roundRect', {
			x,
			y: 1.85,
			w: 3.76,
			h: 1.48,
			rectRadius: 0.08,
			fill: { color: 'FFFFFF' },
			line: { color: 'D7E2F2', pt: 1 },
		});
		slide.addText(point, {
			x: x + 0.22,
			y: 2.18,
			w: 3.3,
			h: 0.95,
			fontFace: theme.bodyFont,
			fontSize: 12,
			color: '37557F',
			fit: 'shrink',
		});
	});

	slide.addShape('roundRect', {
		x: 1.0,
		y: 3.55,
		w: 7.35,
		h: 2.55,
		rectRadius: 0.08,
		fill: { color: 'FFFFFF' },
		line: { color: 'D7E2F2', pt: 1 },
	});
	slide.addText('Key Message', {
		x: 1.3,
		y: 3.85,
		w: 2.8,
		h: 0.24,
		fontFace: theme.headingFont,
		fontSize: 14,
		bold: true,
		color: toPptColor(theme.textColor, '0B1D2E'),
	});
	slide.addText(points[0] || '', {
		x: 1.3,
		y: 4.2,
		w: 6.8,
		h: 1.65,
		fontFace: theme.bodyFont,
		fontSize: 14,
		color: '27466F',
		fit: 'shrink',
	});

	imagePlaceholder(slide, theme, slideInfo.imagePrompt, {
		slideInfo,
		mode: slideInfo?.imageMode,
		x: 8.62,
		y: 3.55,
		w: 3.72,
		h: 2.55,
	});
}

function renderSplit(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
	lines: string[],
	_ratio = '4:3',
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addShape('roundRect', {
		x: 1.0,
		y: 1.85,
		w: 6.95,
		h: 4.3,
		rectRadius: 0.08,
		fill: { color: 'FFFFFF' },
		line: { color: 'D8E2F2', pt: 1 },
	});

	addBullets(slide, lines, {
		x: 1.22,
		y: 2.12,
		w: 6.45,
		h: 3.86,
		fontFace: theme.bodyFont,
		fontSize: 13,
		color: '36537D',
	});

	imagePlaceholder(slide, theme, slideInfo.imagePrompt, {
		slideInfo,
		mode: slideInfo?.imageMode,
		x: 8.22,
		y: 1.85,
		w: 4.06,
		h: 4.3,
	});
}

interface TitleDescription {
	title: string;
	description: string;
}

interface ToneSlider {
	label: string;
	value: number;
}

interface PricingPackage {
	name: string;
	price: string;
	description: string;
}

interface DeliverableSection {
	title: string;
	bullets: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** Safely extract a dynamic property from a slide's extra fields */
function getSlideField(slideInfo: DeckSlide, key: string): unknown {
	if (isRecord(slideInfo) && key in slideInfo) {
		return slideInfo[key];
	}
	return undefined;
}

/** Safely extract a string array from a slide's extra fields */
function getStringArray(slideInfo: DeckSlide, key: string): string[] {
	const val = getSlideField(slideInfo, key);
	return Array.isArray(val) ? val : [];
}

/** Safely extract a typed array from a slide's extra fields */
function getTypedArray<T>(slideInfo: DeckSlide, key: string): T[] {
	const val = getSlideField(slideInfo, key);
	return Array.isArray(val) ? val : [];
}

/** Safely extract a string field from a slide's extra fields */
function getStringField(slideInfo: DeckSlide, key: string): string {
	const val = getSlideField(slideInfo, key);
	return typeof val === 'string' ? val : '';
}

function renderSolution(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addText('Character + AI + Interaction', {
		x: 4.02,
		y: 1.95,
		w: 5.2,
		h: 0.45,
		fontFace: theme.headingFont,
		fontSize: 20,
		bold: true,
		color: toPptColor(theme.textColor, '0B1D2E'),
		align: 'center',
	});

	const pillars = getTypedArray<TitleDescription>(slideInfo, 'pillars');
	pillars.slice(0, 3).forEach((item, idx) => {
		const x = 1.05 + idx * 4.12;
		slide.addShape('roundRect', {
			x,
			y: 2.55,
			w: 3.78,
			h: 3.58,
			rectRadius: 0.08,
			fill: { color: 'FFFFFF' },
			line: { color: 'D8E2F2', pt: 1 },
		});
		slide.addText(item.title || `Pillar ${idx + 1}`, {
			x: x + 0.22,
			y: 2.9,
			w: 3.3,
			h: 0.36,
			fontFace: theme.headingFont,
			fontSize: 16,
			bold: true,
			color: toPptColor(theme.primaryColor, '004B49'),
			align: 'center',
		});
		slide.addText(item.description || '', {
			x: x + 0.22,
			y: 3.35,
			w: 3.3,
			h: 2.32,
			fontFace: theme.bodyFont,
			fontSize: 12,
			color: '3E5A83',
			fit: 'shrink',
			align: 'center',
		});
	});
}

function renderCapabilities(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addShape('roundRect', {
		x: 1.0,
		y: 1.85,
		w: 5.75,
		h: 4.3,
		rectRadius: 0.08,
		fill: { color: 'FFFFFF' },
		line: { color: 'D8E2F2', pt: 1 },
	});
	slide.addText(getStringField(slideInfo, 'intro'), {
		x: 1.28,
		y: 2.2,
		w: 5.15,
		h: 3.65,
		fontFace: theme.bodyFont,
		fontSize: 15,
		color: '2A446D',
		fit: 'shrink',
	});

	getTypedArray<TitleDescription>(slideInfo, 'cards')
		.slice(0, 4)
		.forEach((card, idx) => {
			const col = idx % 2;
			const row = Math.floor(idx / 2);
			const x = 7.05 + col * 2.63;
			const y = 1.85 + row * 2.2;
			slide.addShape('roundRect', {
				x,
				y,
				w: 2.43,
				h: 2.0,
				rectRadius: 0.08,
				fill: { color: 'FFFFFF' },
				line: { color: 'D8E2F2', pt: 1 },
			});
			slide.addText(card.title || '', {
				x: x + 0.16,
				y: y + 0.25,
				w: 2.1,
				h: 0.38,
				fontFace: theme.headingFont,
				fontSize: 12,
				bold: true,
				color: toPptColor(theme.textColor, '0B1D2E'),
				fit: 'shrink',
			});
			slide.addText(card.description || '', {
				x: x + 0.16,
				y: y + 0.64,
				w: 2.1,
				h: 1.2,
				fontFace: theme.bodyFont,
				fontSize: 9,
				color: '4A6286',
				fit: 'shrink',
			});
		});
}

function renderBuddy(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addShape('roundRect', {
		x: 1.0,
		y: 1.85,
		w: 5.7,
		h: 4.3,
		rectRadius: 0.08,
		fill: { color: 'FFFFFF' },
		line: { color: 'D8E2F2', pt: 1 },
	});

	slide.addText(getStringField(slideInfo, 'description'), {
		x: 1.28,
		y: 2.15,
		w: 5.18,
		h: 1.2,
		fontFace: theme.bodyFont,
		fontSize: 14,
		color: '34527C',
		fit: 'shrink',
	});

	addBullets(slide, getStringArray(slideInfo, 'personality'), {
		x: 1.2,
		y: 3.35,
		w: 5.3,
		h: 1.38,
		fontFace: theme.bodyFont,
		fontSize: 11,
		color: '3B5881',
	});

	getTypedArray<ToneSlider>(slideInfo, 'toneSliders')
		.slice(0, 4)
		.forEach((tone, idx) => {
			const y = 4.92 + idx * 0.3;
			slide.addText(tone.label || '', {
				x: 1.28,
				y,
				w: 1.2,
				h: 0.18,
				fontFace: theme.bodyFont,
				fontSize: 8,
				color: '466286',
			});
			slide.addShape('roundRect', {
				x: 2.6,
				y: y + 0.05,
				w: 2.8,
				h: 0.12,
				rectRadius: 0.03,
				fill: { color: 'E7EEF8' },
				line: { color: 'E7EEF8', pt: 0 },
			});
			slide.addShape('roundRect', {
				x: 2.6,
				y: y + 0.05,
				w: 2.8 * ((tone.value || 70) / 100),
				h: 0.12,
				rectRadius: 0.03,
				fill: { color: toPptColor(theme.accentColor, '30D89E') },
				line: { color: toPptColor(theme.accentColor, '30D89E'), pt: 0 },
			});
		});

	imagePlaceholder(slide, theme, slideInfo.imagePrompt, {
		slideInfo,
		optional: false,
		mode: slideInfo?.imageMode,
		x: 7.0,
		y: 1.75,
		w: 5.3,
		h: 4.4,
	});
}

function renderExampleInteraction(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addShape('roundRect', {
		x: 2.2,
		y: 1.75,
		w: 8.9,
		h: 4.7,
		rectRadius: 0.08,
		fill: { color: 'FFFFFF' },
		line: { color: 'D8E2F2', pt: 1 },
	});

	imagePlaceholder(slide, theme, slideInfo.imagePrompt, {
		slideInfo,
		optional: false,
		mode: slideInfo?.imageMode,
		x: 2.45,
		y: 2.0,
		w: 8.4,
		h: 4.2,
	});

	const messages = getStringArray(slideInfo, 'messages');
	messages.slice(0, 4).forEach((msg, idx) => {
		slide.addShape('roundRect', {
			x: idx % 2 ? 6.55 : 2.72,
			y: 2.24 + idx * 0.66,
			w: 3.95,
			h: 0.48,
			rectRadius: 0.08,
			fill: { color: idx % 2 ? 'E9FCF4' : 'EFF3F8' },
			line: { color: idx % 2 ? 'BDEFD9' : 'D8E2F2', pt: 1 },
		});
		slide.addText(msg, {
			x: idx % 2 ? 6.72 : 2.9,
			y: 2.38 + idx * 0.66,
			w: 3.55,
			h: 0.2,
			fontFace: theme.bodyFont,
			fontSize: 8,
			color: '38567F',
			fit: 'shrink',
		});
	});
}

function renderImpact(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.secondaryColor || theme.primaryColor || '#004B49');

	slide.addText(slideInfo.title || 'Business Impact', {
		x: 0.95,
		y: 0.75,
		w: 8.8,
		h: 0.62,
		fontFace: theme.headingFont,
		fontSize: 34,
		bold: true,
		color: 'FFFFFF',
	});
	slide.addText(slideInfo.subtitle || '', {
		x: 0.95,
		y: 1.36,
		w: 9.7,
		h: 0.3,
		fontFace: theme.bodyFont,
		fontSize: 12,
		color: 'D6F0E7',
	});
	if (step) {
		slide.addShape('ellipse', {
			x: 11.9,
			y: 0.78,
			w: 0.36,
			h: 0.36,
			fill: { color: toPptColor(theme.accentColor, '30D89E') },
			line: { color: toPptColor(theme.accentColor, '30D89E'), pt: 1 },
		});
		slide.addText(step, {
			x: 12.02,
			y: 0.91,
			w: 0.1,
			h: 0.1,
			fontFace: theme.bodyFont,
			fontSize: 7,
			bold: true,
			color: '0F3942',
			align: 'center',
		});
	}

	getStringArray(slideInfo, 'impacts')
		.slice(0, 4)
		.forEach((impact, idx) => {
			const x = 1.02 + idx * 3.05;
			slide.addShape('roundRect', {
				x,
				y: 2.25,
				w: 2.72,
				h: 3.25,
				rectRadius: 0.08,
				fill: { color: 'FFFFFF', transparency: 7 },
				line: { color: '78CCB3', pt: 1 },
			});
			slide.addText(impact, {
				x: x + 0.2,
				y: 3.45,
				w: 2.3,
				h: 0.9,
				fontFace: theme.headingFont,
				fontSize: 21,
				bold: true,
				color: 'FFFFFF',
				align: 'center',
				fit: 'shrink',
			});
		});
}

function renderAnalytics(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const lines = [
		getStringField(slideInfo, 'description'),
		...getStringArray(slideInfo, 'bullets'),
	].filter(Boolean);
	renderSplit(slide, slideInfo, model, step, lines, '4:3');
}

function renderDeliverables(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.secondaryColor || theme.primaryColor || '#004B49');

	addTop(
		slide,
		{ ...slideInfo, subtitle: '' },
		{ ...theme, textColor: '#FFFFFF' },
		step,
	);

	getTypedArray<DeliverableSection>(slideInfo, 'sections')
		.slice(0, 4)
		.forEach((section, idx) => {
			const x = 0.95 + idx * 3.08;
			slide.addShape('roundRect', {
				x,
				y: 1.85,
				w: 2.72,
				h: 4.75,
				rectRadius: 0.08,
				fill: { color: 'FFFFFF', transparency: 7 },
				line: { color: '79CAB4', pt: 1 },
			});
			slide.addText(section.title || `Section ${idx + 1}`, {
				x: x + 0.16,
				y: 2.15,
				w: 2.4,
				h: 0.38,
				fontFace: theme.headingFont,
				fontSize: 12,
				bold: true,
				color: 'FFFFFF',
				fit: 'shrink',
				align: 'center',
			});
			addBullets(slide, section.bullets || [], {
				x: x + 0.08,
				y: 2.55,
				w: 2.56,
				h: 3.82,
				fontFace: theme.bodyFont,
				fontSize: 9,
				color: 'E8FBF4',
			});
		});
}

function renderPricing(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addText('FLEXIBLE SOLUTIONS', {
		x: 4.4,
		y: 1.76,
		w: 4.6,
		h: 0.22,
		fontFace: theme.bodyFont,
		fontSize: 11,
		bold: true,
		color: '3F5C81',
		align: 'center',
	});
	slide.addText('Pricing That Fits Your Vision', {
		x: 3.2,
		y: 2.02,
		w: 7.2,
		h: 0.48,
		fontFace: theme.headingFont,
		fontSize: 31,
		bold: true,
		color: toPptColor(theme.textColor, '0B1D2E'),
		align: 'center',
	});

	const packages = getTypedArray<PricingPackage>(slideInfo, 'packages');
	packages.slice(0, 3).forEach((pkg, idx) => {
		const x = 0.9 + idx * 4.16;
		const middle = idx === 1;
		const dark = idx === 2;
		slide.addShape('roundRect', {
			x,
			y: 2.55,
			w: 3.76,
			h: 3.98,
			rectRadius: 0.12,
			fill: {
				color: dark
					? toPptColor(theme.secondaryColor || theme.primaryColor, '004B49')
					: middle
					? 'FFFFFF'
					: 'EDEFF2',
			},
			line: {
				color: middle
					? toPptColor(theme.primaryColor, '004B49')
					: dark
					? toPptColor(theme.secondaryColor || theme.primaryColor, '004B49')
					: 'D9E0EA',
				pt: middle ? 2 : 1,
			},
		});
		slide.addText(pkg.name || `Tier ${idx + 1}`, {
			x: x + 0.18,
			y: 2.82,
			w: 3.4,
			h: 0.38,
			fontFace: theme.headingFont,
			fontSize: 18,
			bold: true,
			color: dark ? 'FFFFFF' : toPptColor(theme.textColor, '0B1D2E'),
			align: 'center',
			fit: 'shrink',
		});
		slide.addShape('roundRect', {
			x: x + 0.3,
			y: 3.28,
			w: 3.14,
			h: 0.52,
			rectRadius: 0.08,
			fill: {
				color: dark
					? toPptColor(theme.secondaryColor || theme.primaryColor, '004B49')
					: 'F7F9FC',
			},
			line: {
				color: dark ? toPptColor(theme.accentColor, '30D89E') : 'D6E0EE',
				pt: 1,
			},
		});
		slide.addText(pkg.price || '', {
			x: x + 0.3,
			y: 3.42,
			w: 3.14,
			h: 0.2,
			fontFace: theme.headingFont,
			fontSize: 17,
			bold: true,
			color: dark ? 'FFFFFF' : toPptColor(theme.textColor, '0B1D2E'),
			align: 'center',
			fit: 'shrink',
		});
		const bullets = String(pkg.description || '')
			.split(/[.;]\s*/)
			.map((item) => item.trim())
			.filter(Boolean)
			.slice(0, 6)
			.map((item) => `• ${item}`)
			.join('\n');
		slide.addText(bullets, {
			x: x + 0.22,
			y: 4.02,
			w: 3.3,
			h: 2.32,
			fontFace: theme.bodyFont,
			fontSize: 11,
			color: dark ? 'E9FAF4' : '35527D',
			breakLine: true,
			fit: 'shrink',
		});
	});
}

function renderTimeline(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme } = model;
	bg(slide, theme.backgroundColor);
	addTop(slide, slideInfo, theme, step);

	slide.addShape('line', {
		x: 1.25,
		y: 3.02,
		w: 10.8,
		h: 0,
		line: { color: 'BFD0E6', pt: 2 },
	});

	const phases = getTypedArray<TitleDescription>(slideInfo, 'phases');
	phases.slice(0, 3).forEach((phase, idx) => {
		const x = 1.25 + idx * 3.74;
		slide.addShape('ellipse', {
			x: x - 0.12,
			y: 2.86,
			w: 0.24,
			h: 0.24,
			fill: { color: toPptColor(theme.accentColor, '30D89E') },
			line: { color: toPptColor(theme.accentColor, '30D89E'), pt: 1 },
		});
		slide.addShape('roundRect', {
			x: x - 0.22,
			y: 3.3,
			w: 3.05,
			h: 2.78,
			rectRadius: 0.08,
			fill: { color: 'FFFFFF' },
			line: { color: 'D7E1F1', pt: 1 },
		});
		slide.addText(phase.title || `Month ${idx + 1}`, {
			x: x + 0.05,
			y: 3.64,
			w: 2.5,
			h: 0.38,
			fontFace: theme.headingFont,
			fontSize: 15,
			bold: true,
			color: toPptColor(theme.textColor, '0B1D2E'),
			fit: 'shrink',
		});
		slide.addText(phase.description || '', {
			x: x + 0.05,
			y: 4.06,
			w: 2.52,
			h: 1.7,
			fontFace: theme.bodyFont,
			fontSize: 11,
			color: '3E5A84',
			fit: 'shrink',
		});
	});
}

function renderClosing(
	slide: PptxSlide,
	slideInfo: DeckSlide,
	model: DeckModel,
	step: string,
): void {
	const { deckTheme: theme, project } = model;
	bg(slide, theme.secondaryColor || theme.primaryColor || '#004B49');

	const headline = getStringField(slideInfo, 'headline');
	slide.addText(headline || `Let's build ${project.mascotName}`, {
		x: 1.0,
		y: 1.0,
		w: 5.8,
		h: 1.1,
		fontFace: theme.headingFont,
		fontSize: 44,
		bold: true,
		color: 'FFFFFF',
		fit: 'shrink',
	});

	const text = getStringField(slideInfo, 'text');
	slide.addText(text, {
		x: 1.0,
		y: 2.35,
		w: 5.7,
		h: 1.1,
		fontFace: theme.bodyFont,
		fontSize: 15,
		color: 'D9F4EB',
		fit: 'shrink',
	});

	slide.addText(
		`${project.contactName}\n${project.contactEmail}\n${project.contactPhone}`,
		{
			x: 1.0,
			y: 4.2,
			w: 4.6,
			h: 1.2,
			fontFace: theme.bodyFont,
			fontSize: 12,
			color: 'E8FBF4',
			breakLine: true,
		},
	);

	imagePlaceholder(slide, theme, slideInfo.imagePrompt, {
		slideInfo,
		optional: false,
		mode: slideInfo?.imageMode,
		x: 6.7,
		y: 1.12,
		w: 5.65,
		h: 5.3,
	});

	if (step) {
		slide.addShape('ellipse', {
			x: 12.0,
			y: 0.8,
			w: 0.34,
			h: 0.34,
			fill: { color: toPptColor(theme.accentColor, '30D89E') },
			line: { color: toPptColor(theme.accentColor, '30D89E'), pt: 1 },
		});
		slide.addText(step, {
			x: 12.12,
			y: 0.92,
			w: 0.1,
			h: 0.1,
			fontFace: theme.bodyFont,
			fontSize: 7,
			bold: true,
			color: '0D3941',
			align: 'center',
		});
	}
}

export function buildDeck(data: Record<string, unknown>): PptxPresentation {
	const model = buildDeckModel(data);
	const theme = model.deckTheme || model.theme;
	const { project, slides } = model;

	const pptx = new PptxGenJS();
	pptx.layout = 'LAYOUT_WIDE';
	pptx.author = project.contactName || 'Deck Generator';
	pptx.company = theme.brandName;
	pptx.subject = `${project.projectTitle} for ${project.clientName}`;
	pptx.title = `${project.projectTitle} - ${project.clientName}`;
	pptx.theme = {
		headFontFace: theme.headingFont,
		bodyFontFace: theme.bodyFont,
	};

	slides.forEach((slideInfo, idx) => {
		const slide = pptx.addSlide();
		const step = String(idx + 1).padStart(2, '0');

		switch (slideInfo.type) {
			case 'cover':
				renderCover(slide, slideInfo, model);
				break;
			case 'problem':
				renderProblem(slide, slideInfo, model, step);
				break;
			case 'opportunity':
				renderSplit(
					slide,
					slideInfo,
					model,
					step,
					getStringArray(slideInfo, 'points'),
					'4:3',
				);
				break;
			case 'solution':
				renderSolution(slide, slideInfo, model, step);
				break;
			case 'what-notso-does':
				renderCapabilities(slide, slideInfo, model, step);
				break;
			case 'meet-buddy':
				renderBuddy(slide, slideInfo, model, step);
				break;
			case 'experience-concept':
				renderSplit(
					slide,
					slideInfo,
					model,
					step,
					getStringArray(slideInfo, 'points'),
					'4:3',
				);
				break;
			case 'chat-flow':
				renderSplit(
					slide,
					slideInfo,
					model,
					step,
					getStringArray(slideInfo, 'steps'),
					'4:3',
				);
				break;
			case 'example-interaction':
				renderExampleInteraction(slide, slideInfo, model, step);
				break;
			case 'business-impact':
				renderImpact(slide, slideInfo, model, step);
				break;
			case 'data-analytics':
				renderAnalytics(slide, slideInfo, model, step);
				break;
			case 'what-you-get':
				renderDeliverables(slide, slideInfo, model, step);
				break;
			case 'pricing':
				renderPricing(slide, slideInfo, model, step);
				break;
			case 'timeline':
				renderTimeline(slide, slideInfo, model, step);
				break;
			case 'closing':
				renderClosing(slide, slideInfo, model, step);
				break;
			default:
				renderSplit(
					slide,
					slideInfo,
					model,
					step,
					getStringArray(slideInfo, 'points'),
					'4:3',
				);
				break;
		}

		addFooter(slide, theme, theme.brandName);
	});

	return pptx;
}
