import { formatOklch, hexToOklch, type Oklch } from 'hex-to-oklch';

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface Hsl {
	h: number;
	s: number;
	l: number;
}

export interface ThemeColors {
	primaryColor: string;
	accentColor: string;
	secondaryColor: string;
	backgroundColor: string;
	textColor: string;
}

interface Oklab {
	l: number;
	a: number;
	b: number;
}

interface OklchColor {
	l: number;
	c: number;
	h: number;
}

interface ThemeSwatchScience {
	hex: string;
	oklch: string;
}

export type PalettePresetId =
	| 'balanced-brand'
	| 'vivid-campaign'
	| 'editorial-contrast'
	| 'soft-product';

interface PalettePresetRecipe {
	id: PalettePresetId;
	label: string;
	description: string;
	harmonyMode: HarmonyMode;
	accentHueShift: number;
	secondaryHueShift: number;
	accentLightness: number;
	secondaryLightness: number;
	accentChromaScale: number;
	secondaryChromaScale: number;
	accentMix: number;
	secondaryMix: number;
	backgroundMix: number;
	backgroundAccentMix: number;
	backgroundLightness: number;
	backgroundChromaScale: number;
	backgroundLift: number;
	textLightness: number;
	textChromaScale: number;
	textHueShift: number;
}

export interface PalettePresetSuggestion {
	id: PalettePresetId;
	label: string;
	description: string;
	harmonyMode: HarmonyMode;
	theme: ThemeColors;
	science: {
		primary: ThemeSwatchScience;
		accent: ThemeSwatchScience;
		secondary: ThemeSwatchScience;
		background: ThemeSwatchScience;
		text: ThemeSwatchScience;
	};
}

interface HarmonyVariant {
	a: number;
	b: number;
	accentL: number;
	secondaryL: number;
	accentS: number;
	secondaryS: number;
}

interface ThemeSafetyMetrics {
	textOnBackground: number;
	accentOnBackground: number;
	secondaryOnBackground: number;
	secondaryOnWhite: number;
}

interface ThemeAdjustment {
	key: keyof ThemeColors;
	reason: string;
	color: string;
}

interface GenerateThemePaletteInput {
	primaryColor?: string;
	baseColor?: string;
	harmonyMode?: string;
	shuffleSeed?: unknown;
}

interface ResolveThemePaletteInput {
	primaryColor?: string;
	baseColor?: string;
	harmonyMode?: string;
	shuffleSeed?: unknown;
	locks?: Partial<Record<string, unknown>>;
	manualColors?: Partial<ThemeColors>;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
	primaryColor: '#004B49',
	accentColor: '#30D89E',
	secondaryColor: '#0B6E6C',
	backgroundColor: '#F2F4F6',
	textColor: '#0B1D2E',
};

export type HarmonyMode =
	| 'complementary'
	| 'split-complementary'
	| 'analogous'
	| 'triad'
	| 'square'
	| 'tetradic'
	| 'monochromatic';

export const HARMONY_MODES: readonly HarmonyMode[] = [
	'complementary',
	'split-complementary',
	'analogous',
	'triad',
	'square',
	'tetradic',
	'monochromatic',
];

export const PALETTE_PRESET_IDS: readonly PalettePresetId[] = [
	'balanced-brand',
	'vivid-campaign',
	'editorial-contrast',
	'soft-product',
];

const PALETTE_PRESET_RECIPES: readonly PalettePresetRecipe[] = [
	{
		id: 'balanced-brand',
		label: 'Balanced Brand',
		description: 'Natural accents with high readability for everyday decks.',
		harmonyMode: 'complementary',
		accentHueShift: 158,
		secondaryHueShift: 208,
		accentLightness: 0.68,
		secondaryLightness: 0.31,
		accentChromaScale: 1.2,
		secondaryChromaScale: 0.96,
		accentMix: 0.68,
		secondaryMix: 0.78,
		backgroundMix: 0.12,
		backgroundAccentMix: 0.08,
		backgroundLightness: 0.95,
		backgroundChromaScale: 0.55,
		backgroundLift: 0.055,
		textLightness: 0.22,
		textChromaScale: 0.32,
		textHueShift: 0,
	},
	{
		id: 'vivid-campaign',
		label: 'Vivid Campaign',
		description: 'Punchier campaign palette with stronger accent separation.',
		harmonyMode: 'split-complementary',
		accentHueShift: 182,
		secondaryHueShift: 298,
		accentLightness: 0.74,
		secondaryLightness: 0.27,
		accentChromaScale: 1.75,
		secondaryChromaScale: 1.3,
		accentMix: 0.9,
		secondaryMix: 0.9,
		backgroundMix: 0.08,
		backgroundAccentMix: 0.2,
		backgroundLightness: 0.93,
		backgroundChromaScale: 1,
		backgroundLift: 0.06,
		textLightness: 0.18,
		textChromaScale: 0.55,
		textHueShift: -8,
	},
	{
		id: 'editorial-contrast',
		label: 'Editorial Contrast',
		description: 'Sharper dark-slide contrast and cleaner neutral background.',
		harmonyMode: 'triad',
		accentHueShift: 24,
		secondaryHueShift: 214,
		accentLightness: 0.59,
		secondaryLightness: 0.2,
		accentChromaScale: 0.72,
		secondaryChromaScale: 0.65,
		accentMix: 0.62,
		secondaryMix: 0.88,
		backgroundMix: 0.04,
		backgroundAccentMix: 0.02,
		backgroundLightness: 0.97,
		backgroundChromaScale: 0.2,
		backgroundLift: 0.07,
		textLightness: 0.14,
		textChromaScale: 0.12,
		textHueShift: 0,
	},
	{
		id: 'soft-product',
		label: 'Soft Product',
		description: 'Subtle product-style tones with calmer chroma.',
		harmonyMode: 'analogous',
		accentHueShift: 40,
		secondaryHueShift: -40,
		accentLightness: 0.76,
		secondaryLightness: 0.39,
		accentChromaScale: 0.88,
		secondaryChromaScale: 0.82,
		accentMix: 0.74,
		secondaryMix: 0.7,
		backgroundMix: 0.18,
		backgroundAccentMix: 0.16,
		backgroundLightness: 0.94,
		backgroundChromaScale: 0.9,
		backgroundLift: 0.05,
		textLightness: 0.24,
		textChromaScale: 0.22,
		textHueShift: 6,
	},
];

const THEME_SAFETY_THRESHOLDS: Readonly<ThemeSafetyMetrics> = {
	textOnBackground: 7,
	accentOnBackground: 2.2,
	secondaryOnBackground: 3,
	secondaryOnWhite: 4.8,
};

const OKLCH_EPSILON = 0.000004;

const DEFAULT_VARIANT: HarmonyVariant = {
	a: 180,
	b: 160,
	accentL: 0.5,
	secondaryL: 0.24,
	accentS: 0.72,
	secondaryS: 0.62,
};

const HARMONY_VARIANTS: Record<HarmonyMode, HarmonyVariant[]> = {
	complementary: [
		{
			a: 180,
			b: 160,
			accentL: 0.5,
			secondaryL: 0.24,
			accentS: 0.72,
			secondaryS: 0.62,
		},
		{
			a: 180,
			b: 200,
			accentL: 0.56,
			secondaryL: 0.28,
			accentS: 0.78,
			secondaryS: 0.56,
		},
		{
			a: 170,
			b: 190,
			accentL: 0.48,
			secondaryL: 0.22,
			accentS: 0.68,
			secondaryS: 0.66,
		},
		{
			a: 188,
			b: 152,
			accentL: 0.54,
			secondaryL: 0.26,
			accentS: 0.74,
			secondaryS: 0.6,
		},
	],
	'split-complementary': [
		{
			a: 150,
			b: 210,
			accentL: 0.52,
			secondaryL: 0.25,
			accentS: 0.74,
			secondaryS: 0.62,
		},
		{
			a: 145,
			b: 215,
			accentL: 0.56,
			secondaryL: 0.28,
			accentS: 0.68,
			secondaryS: 0.56,
		},
		{
			a: 135,
			b: 225,
			accentL: 0.49,
			secondaryL: 0.23,
			accentS: 0.76,
			secondaryS: 0.68,
		},
		{
			a: 158,
			b: 202,
			accentL: 0.54,
			secondaryL: 0.27,
			accentS: 0.72,
			secondaryS: 0.6,
		},
	],
	analogous: [
		{
			a: -28,
			b: 32,
			accentL: 0.5,
			secondaryL: 0.23,
			accentS: 0.7,
			secondaryS: 0.62,
		},
		{
			a: -22,
			b: 38,
			accentL: 0.56,
			secondaryL: 0.29,
			accentS: 0.64,
			secondaryS: 0.56,
		},
		{
			a: -38,
			b: 22,
			accentL: 0.47,
			secondaryL: 0.22,
			accentS: 0.76,
			secondaryS: 0.66,
		},
		{
			a: -18,
			b: 48,
			accentL: 0.53,
			secondaryL: 0.25,
			accentS: 0.7,
			secondaryS: 0.58,
		},
	],
	triad: [
		{
			a: 120,
			b: 240,
			accentL: 0.52,
			secondaryL: 0.24,
			accentS: 0.74,
			secondaryS: 0.64,
		},
		{
			a: 115,
			b: 235,
			accentL: 0.56,
			secondaryL: 0.28,
			accentS: 0.68,
			secondaryS: 0.58,
		},
		{
			a: 125,
			b: 245,
			accentL: 0.48,
			secondaryL: 0.22,
			accentS: 0.76,
			secondaryS: 0.68,
		},
		{
			a: 105,
			b: 225,
			accentL: 0.54,
			secondaryL: 0.26,
			accentS: 0.7,
			secondaryS: 0.6,
		},
	],
	square: [
		{
			a: 90,
			b: 270,
			accentL: 0.54,
			secondaryL: 0.24,
			accentS: 0.74,
			secondaryS: 0.64,
		},
		{
			a: 84,
			b: 264,
			accentL: 0.58,
			secondaryL: 0.28,
			accentS: 0.68,
			secondaryS: 0.56,
		},
		{
			a: 96,
			b: 276,
			accentL: 0.49,
			secondaryL: 0.21,
			accentS: 0.78,
			secondaryS: 0.68,
		},
		{
			a: 88,
			b: 268,
			accentL: 0.56,
			secondaryL: 0.26,
			accentS: 0.72,
			secondaryS: 0.6,
		},
	],
	tetradic: [
		{
			a: 60,
			b: 180,
			accentL: 0.56,
			secondaryL: 0.24,
			accentS: 0.72,
			secondaryS: 0.64,
		},
		{
			a: 50,
			b: 180,
			accentL: 0.52,
			secondaryL: 0.26,
			accentS: 0.78,
			secondaryS: 0.58,
		},
		{
			a: 70,
			b: 200,
			accentL: 0.58,
			secondaryL: 0.22,
			accentS: 0.68,
			secondaryS: 0.66,
		},
		{
			a: 40,
			b: 220,
			accentL: 0.5,
			secondaryL: 0.24,
			accentS: 0.74,
			secondaryS: 0.62,
		},
	],
	monochromatic: [
		{
			a: 0,
			b: 0,
			accentL: 0.52,
			secondaryL: 0.24,
			accentS: 0.5,
			secondaryS: 0.56,
		},
		{
			a: 0,
			b: 0,
			accentL: 0.58,
			secondaryL: 0.29,
			accentS: 0.44,
			secondaryS: 0.5,
		},
		{
			a: 0,
			b: 0,
			accentL: 0.47,
			secondaryL: 0.21,
			accentS: 0.58,
			secondaryS: 0.62,
		},
		{
			a: 0,
			b: 0,
			accentL: 0.55,
			secondaryL: 0.26,
			accentS: 0.48,
			secondaryS: 0.54,
		},
	],
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function toFinite(value: unknown, fallback: number = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function wrapHue(h: number): number {
	return ((h % 360) + 360) % 360;
}

export function normalizeHexColor(
	value: unknown,
	fallback: string = DEFAULT_THEME_COLORS.primaryColor,
): string {
	const raw = String(value || '').trim();
	if (/^#?[0-9a-fA-F]{6}$/.test(raw)) {
		return (raw.startsWith('#') ? raw : `#${raw}`).toUpperCase();
	}
	if (raw.length === 0 && fallback) {
		return normalizeHexColor(fallback, '#004B49');
	}
	return '#004B49';
}

function hexToRgb(hex: string): Rgb {
	const normalized = normalizeHexColor(hex);
	return {
		r: Number.parseInt(normalized.slice(1, 3), 16),
		g: Number.parseInt(normalized.slice(3, 5), 16),
		b: Number.parseInt(normalized.slice(5, 7), 16),
	};
}

function rgbToHex({ r, g, b }: Rgb): string {
	const toHex = (channel: number): string => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function linearToSrgb(channel: number): number {
	if (channel <= 0.0031308) return channel * 12.92;
	return 1.055 * channel ** (1 / 2.4) - 0.055;
}

function oklchToOklab(color: OklchColor): Oklab {
	const normalizedHue = wrapHue(color.h) * (Math.PI / 180);
	return {
		l: color.l,
		a: color.c * Math.cos(normalizedHue),
		b: color.c * Math.sin(normalizedHue),
	};
}

function oklabToOklch(color: Oklab): OklchColor {
	const chroma = Math.sqrt(color.a * color.a + color.b * color.b);
	const hue = chroma <= OKLCH_EPSILON
		? 0
		: wrapHue((Math.atan2(color.b, color.a) * 180) / Math.PI);
	return { l: color.l, c: chroma, h: hue };
}

function hexToOklchColor(hex: string): OklchColor {
	const converted = hexToOklch(normalizeHexColor(hex));
	return {
		l: clamp(converted.l, 0, 1),
		c: Math.max(0, converted.c),
		h: wrapHue(converted.h),
	};
}

function oklabToLinearRgb(color: Oklab): { r: number; g: number; b: number } {
	const l = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
	const m = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
	const s = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;

	const l3 = l * l * l;
	const m3 = m * m * m;
	const s3 = s * s * s;

	return {
		r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
		g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
		b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
	};
}

function linearRgbInGamut(rgb: { r: number; g: number; b: number }): boolean {
	return rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1;
}

function linearRgbToHex(rgb: { r: number; g: number; b: number }): string {
	return rgbToHex({
		r: linearToSrgb(clamp(rgb.r, 0, 1)) * 255,
		g: linearToSrgb(clamp(rgb.g, 0, 1)) * 255,
		b: linearToSrgb(clamp(rgb.b, 0, 1)) * 255,
	});
}

function oklchToHex(color: OklchColor): string {
	const normalized: OklchColor = {
		l: clamp(color.l, 0, 1),
		c: clamp(color.c, 0, 0.4),
		h: wrapHue(color.h),
	};

	const directLinear = oklabToLinearRgb(oklchToOklab(normalized));
	if (linearRgbInGamut(directLinear)) return linearRgbToHex(directLinear);

	let low = 0;
	let high = normalized.c;
	let bestLinear = oklabToLinearRgb(oklchToOklab({
		l: normalized.l,
		c: 0,
		h: normalized.h,
	}));

	for (let step = 0; step < 22; step += 1) {
		const mid = (low + high) / 2;
		const candidateLinear = oklabToLinearRgb(oklchToOklab({
			l: normalized.l,
			c: mid,
			h: normalized.h,
		}));
		if (linearRgbInGamut(candidateLinear)) {
			bestLinear = candidateLinear;
			low = mid;
		} else {
			high = mid;
		}
	}

	return linearRgbToHex(bestLinear);
}

function hexToOklabColor(hex: string): Oklab {
	return oklchToOklab(hexToOklchColor(hex));
}

function mixHexInOklab(fromHex: string, toHex: string, ratio: number): string {
	const t = clamp(ratio, 0, 1);
	const from = hexToOklabColor(fromHex);
	const to = hexToOklabColor(toHex);
	const mixed: Oklab = {
		l: from.l * (1 - t) + to.l * t,
		a: from.a * (1 - t) + to.a * t,
		b: from.b * (1 - t) + to.b * t,
	};
	return oklchToHex(oklabToOklch(mixed));
}

function channelLuminance(channel: number): number {
	const normalized = channel / 255;
	if (normalized <= 0.03928) return normalized / 12.92;
	return ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return (
		0.2126 * channelLuminance(r)
		+ 0.7152 * channelLuminance(g)
		+ 0.0722 * channelLuminance(b)
	);
}

export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(normalizeHexColor(a));
	const lb = relativeLuminance(normalizeHexColor(b));
	const brighter = Math.max(la, lb);
	const darker = Math.min(la, lb);
	return (brighter + 0.05) / (darker + 0.05);
}

function adjustForContrast(
	color: string,
	fixedColor: string,
	minContrast: number,
	direction: 'darker' | 'lighter' = 'darker',
): string {
	const fixed = normalizeHexColor(fixedColor, '#FFFFFF');
	const start = normalizeHexColor(color, '#000000');
	let best = start;
	let bestContrast = contrastRatio(start, fixed);
	if (bestContrast >= minContrast) return start;

	const startOklch = hexToOklchColor(start);
	for (let step = 1; step <= 70; step += 1) {
		const amount = (step / 70) * 0.92;
		const nextL = direction === 'lighter'
			? clamp(startOklch.l + amount, 0.02, 0.99)
			: clamp(startOklch.l - amount, 0.02, 0.99);
		const chromaScale = direction === 'lighter'
			? 1 - amount * 0.45
			: 1 - amount * 0.28;
		const candidate = oklchToHex({
			l: nextL,
			c: Math.max(0, startOklch.c * chromaScale),
			h: startOklch.h,
		});
		const ratio = contrastRatio(candidate, fixed);
		if (ratio > bestContrast) {
			best = candidate;
			bestContrast = ratio;
		}
		if (ratio >= minContrast) return candidate;
	}

	return best;
}

function normalizeThemeInput(
	themeInput: Partial<ThemeColors> = {},
	fallbackTheme: ThemeColors = DEFAULT_THEME_COLORS,
): ThemeColors {
	return {
		primaryColor: normalizeHexColor(
			themeInput.primaryColor,
			fallbackTheme.primaryColor,
		),
		accentColor: normalizeHexColor(
			themeInput.accentColor,
			fallbackTheme.accentColor,
		),
		secondaryColor: normalizeHexColor(
			themeInput.secondaryColor,
			fallbackTheme.secondaryColor,
		),
		backgroundColor: normalizeHexColor(
			themeInput.backgroundColor,
			fallbackTheme.backgroundColor,
		),
		textColor: normalizeHexColor(themeInput.textColor, fallbackTheme.textColor),
	};
}

function isHarmonyMode(value: string): value is HarmonyMode {
	return (HARMONY_MODES as readonly string[]).includes(value);
}

function normalizeHarmonyMode(value: unknown): HarmonyMode {
	const mode = String(value || '')
		.trim()
		.toLowerCase();
	if (isHarmonyMode(mode)) return mode;
	return 'complementary';
}

function resolveVariant(
	mode: HarmonyMode,
	shuffleSeed: unknown,
): { variant: HarmonyVariant; index: number; count: number } {
	const options = HARMONY_VARIANTS[mode] ?? HARMONY_VARIANTS.complementary ?? [DEFAULT_VARIANT];
	const seed = Math.abs(Math.floor(toFinite(shuffleSeed, 0)));
	const index = seed % options.length;
	const variant = options[index] ?? DEFAULT_VARIANT;
	return {
		variant,
		index,
		count: options.length,
	};
}

function generateHarmonyTheme(
	primaryColor: string,
	harmonyMode: string,
	shuffleSeed: unknown,
): {
	theme: Pick<ThemeColors, 'primaryColor' | 'accentColor' | 'secondaryColor'>;
	harmonyMode: HarmonyMode;
	variantIndex: number;
	variantCount: number;
} {
	const primary = normalizeHexColor(
		primaryColor,
		DEFAULT_THEME_COLORS.primaryColor,
	);
	const primaryOklch = hexToOklchColor(primary);
	const mode = normalizeHarmonyMode(harmonyMode);
	const variantData = resolveVariant(mode, shuffleSeed);
	const v = variantData.variant;

	const accentTarget = oklchToHex({
		l: clamp(primaryOklch.l * 0.34 + v.accentL * 0.66, 0.42, 0.79),
		c: clamp(primaryOklch.c * 0.5 + v.accentS * 0.11, 0.03, 0.27),
		h: wrapHue(primaryOklch.h + v.a),
	});

	const secondaryTarget = oklchToHex({
		l: clamp(primaryOklch.l * 0.2 + v.secondaryL * 0.8, 0.16, 0.38),
		c: clamp(primaryOklch.c * 0.46 + v.secondaryS * 0.095, 0.025, 0.24),
		h: wrapHue(primaryOklch.h + v.b),
	});

	const accentColor = mixHexInOklab(primary, accentTarget, 0.46);
	const secondaryColor = mixHexInOklab(primary, secondaryTarget, 0.62);

	return {
		theme: {
			primaryColor: primary,
			accentColor,
			secondaryColor,
		},
		harmonyMode: mode,
		variantIndex: variantData.index,
		variantCount: variantData.count,
	};
}

export function evaluateTheme(
	themeInput: Partial<ThemeColors> = {},
): ThemeSafetyMetrics {
	const theme = normalizeThemeInput(themeInput);
	return {
		textOnBackground: contrastRatio(theme.textColor, theme.backgroundColor),
		accentOnBackground: contrastRatio(theme.accentColor, theme.backgroundColor),
		secondaryOnBackground: contrastRatio(
			theme.secondaryColor,
			theme.backgroundColor,
		),
		secondaryOnWhite: contrastRatio(theme.secondaryColor, '#FFFFFF'),
	};
}

export function describeThemeSafety(
	themeInput: Partial<ThemeColors> = {},
): string[] {
	const metrics = evaluateTheme(themeInput);
	const warnings: string[] = [];

	if (metrics.textOnBackground < THEME_SAFETY_THRESHOLDS.textOnBackground) {
		warnings.push('Text and background contrast is too low.');
	}
	if (metrics.accentOnBackground < THEME_SAFETY_THRESHOLDS.accentOnBackground) {
		warnings.push('Accent color is too close to the background.');
	}
	if (metrics.secondaryOnWhite < THEME_SAFETY_THRESHOLDS.secondaryOnWhite) {
		warnings.push('Dark-slide color is too light for white text.');
	}

	return warnings;
}

export function enforceThemeSafety(themeInput: Partial<ThemeColors> = {}): {
	theme: ThemeColors;
	adjustments: ThemeAdjustment[];
	metrics: ThemeSafetyMetrics;
} {
	const theme = normalizeThemeInput(themeInput);
	const adjustments: ThemeAdjustment[] = [];

	function applyIfChanged(
		key: keyof ThemeColors,
		nextColor: string,
		reason: string,
	): void {
		const normalized = normalizeHexColor(nextColor, theme[key]);
		if (normalized === theme[key]) return;
		theme[key] = normalized;
		adjustments.push({ key, reason, color: normalized });
	}

	applyIfChanged(
		'textColor',
		adjustForContrast(
			theme.textColor,
			theme.backgroundColor,
			THEME_SAFETY_THRESHOLDS.textOnBackground,
			'darker',
		),
		'darkened text for readability',
	);

	applyIfChanged(
		'backgroundColor',
		adjustForContrast(
			theme.backgroundColor,
			theme.textColor,
			THEME_SAFETY_THRESHOLDS.textOnBackground,
			'lighter',
		),
		'lightened background for readability',
	);

	applyIfChanged(
		'accentColor',
		adjustForContrast(
			theme.accentColor,
			theme.backgroundColor,
			THEME_SAFETY_THRESHOLDS.accentOnBackground,
			'darker',
		),
		'adjusted accent contrast on background',
	);

	applyIfChanged(
		'secondaryColor',
		adjustForContrast(
			theme.secondaryColor,
			'#FFFFFF',
			THEME_SAFETY_THRESHOLDS.secondaryOnWhite,
			'darker',
		),
		'darkened dark-slide color for white text',
	);

	applyIfChanged(
		'secondaryColor',
		adjustForContrast(
			theme.secondaryColor,
			theme.backgroundColor,
			THEME_SAFETY_THRESHOLDS.secondaryOnBackground,
			'darker',
		),
		'darkened dark-slide color to separate from deck background',
	);

	return {
		theme,
		adjustments,
		metrics: evaluateTheme(theme),
	};
}

export function generateThemePalette(input: GenerateThemePaletteInput = {}) {
	const primaryColor = normalizeHexColor(
		input.primaryColor || input.baseColor,
		DEFAULT_THEME_COLORS.primaryColor,
	);
	const harmonyMode = normalizeHarmonyMode(input.harmonyMode);
	const shuffleSeed = Math.max(0, Math.floor(toFinite(input.shuffleSeed, 0)));
	const generated = generateHarmonyTheme(
		primaryColor,
		harmonyMode,
		shuffleSeed,
	);

	return {
		...generated,
		shuffleSeed,
		generatedTheme: generated.theme,
	};
}

export function resolveThemePalette(input: ResolveThemePaletteInput = {}) {
	const primaryColor = normalizeHexColor(
		input.primaryColor || input.baseColor,
		DEFAULT_THEME_COLORS.primaryColor,
	);
	const harmonyMode = normalizeHarmonyMode(input.harmonyMode);
	const shuffleSeed = Math.max(0, Math.floor(toFinite(input.shuffleSeed, 0)));
	const locks = input.locks && typeof input.locks === 'object' ? input.locks : {};

	const manualTheme = normalizeThemeInput({
		primaryColor,
		accentColor: input.manualColors?.accentColor,
		secondaryColor: input.manualColors?.secondaryColor,
		backgroundColor: input.manualColors?.backgroundColor,
		textColor: input.manualColors?.textColor,
	});

	const generated = generateHarmonyTheme(
		primaryColor,
		harmonyMode,
		shuffleSeed,
	);
	const nextTheme: ThemeColors = {
		primaryColor,
		accentColor: locks.accentColor
			? manualTheme.accentColor
			: generated.theme.accentColor,
		secondaryColor: locks.secondaryColor
			? manualTheme.secondaryColor
			: generated.theme.secondaryColor,
		backgroundColor: manualTheme.backgroundColor,
		textColor: manualTheme.textColor,
	};

	const enforced = enforceThemeSafety(nextTheme);

	return {
		primaryColor,
		harmonyMode: generated.harmonyMode,
		shuffleSeed,
		variantIndex: generated.variantIndex,
		variantCount: generated.variantCount,
		generatedTheme: generated.theme,
		locks: {
			accentColor: Boolean(locks.accentColor),
			secondaryColor: Boolean(locks.secondaryColor),
		},
		theme: enforced.theme,
		adjustments: enforced.adjustments,
		metrics: enforced.metrics,
		warnings: describeThemeSafety(enforced.theme),
	};
}

function normalizePalettePresetId(value: unknown): PalettePresetId {
	const raw = String(value || '')
		.trim()
		.toLowerCase();
	const match = PALETTE_PRESET_IDS.find((presetId) => presetId === raw);
	return match ?? 'balanced-brand';
}

function getPresetRecipe(presetId: unknown): PalettePresetRecipe {
	const id = normalizePalettePresetId(presetId);
	const recipe = PALETTE_PRESET_RECIPES.find((candidate) => candidate.id === id);
	return recipe ?? PALETTE_PRESET_RECIPES[0] ?? {
		id: 'balanced-brand',
		label: 'Balanced Brand',
		description: 'Natural accents with high readability for everyday decks.',
		harmonyMode: 'complementary',
		accentHueShift: 158,
		secondaryHueShift: 208,
		accentLightness: 0.68,
		secondaryLightness: 0.31,
		accentChromaScale: 1.2,
		secondaryChromaScale: 0.96,
		accentMix: 0.68,
		secondaryMix: 0.78,
		backgroundMix: 0.12,
		backgroundAccentMix: 0.08,
		backgroundLightness: 0.95,
		backgroundChromaScale: 0.55,
		backgroundLift: 0.055,
		textLightness: 0.22,
		textChromaScale: 0.32,
		textHueShift: 0,
	};
}

function buildPresetTheme(primaryColor: string, recipe: PalettePresetRecipe): ThemeColors {
	const primary = normalizeHexColor(primaryColor, DEFAULT_THEME_COLORS.primaryColor);
	const primaryOklch = hexToOklchColor(primary);

	const accentTarget = oklchToHex({
		l: clamp(recipe.accentLightness * 0.78 + primaryOklch.l * 0.22, 0.38, 0.86),
		c: clamp(primaryOklch.c * recipe.accentChromaScale + 0.045, 0.03, 0.32),
		h: wrapHue(primaryOklch.h + recipe.accentHueShift),
	});
	const secondaryTarget = oklchToHex({
		l: clamp(recipe.secondaryLightness * 0.85 + primaryOklch.l * 0.15, 0.12, 0.46),
		c: clamp(primaryOklch.c * recipe.secondaryChromaScale + 0.03, 0.018, 0.26),
		h: wrapHue(primaryOklch.h + recipe.secondaryHueShift),
	});

	const accentColor = mixHexInOklab(primary, accentTarget, recipe.accentMix);
	const secondaryColor = mixHexInOklab(primary, secondaryTarget, recipe.secondaryMix);

	const baseBackground = mixHexInOklab('#FFFFFF', primary, recipe.backgroundMix);
	const backgroundSeed = mixHexInOklab(
		baseBackground,
		accentTarget,
		recipe.backgroundAccentMix,
	);
	const backgroundOklch = hexToOklchColor(backgroundSeed);
	const backgroundColor = oklchToHex({
		l: clamp(
			recipe.backgroundLightness + recipe.backgroundLift * 0.5,
			0.86,
			0.985,
		),
		c: clamp(backgroundOklch.c * recipe.backgroundChromaScale, 0, 0.09),
		h: backgroundOklch.h,
	});

	const textColor = oklchToHex({
		l: clamp(recipe.textLightness, 0.12, 0.34),
		c: clamp(primaryOklch.c * recipe.textChromaScale + 0.004, 0.004, 0.1),
		h: wrapHue(primaryOklch.h + recipe.textHueShift),
	});

	const enforced = enforceThemeSafety({
		primaryColor: primary,
		accentColor,
		secondaryColor,
		backgroundColor,
		textColor,
	});

	return enforced.theme;
}

function toScienceSwatch(hex: string): ThemeSwatchScience {
	return {
		hex,
		oklch: toOklchCss(hex),
	};
}

export function toOklchCss(hex: string): string {
	const color = hexToOklchColor(hex);
	const cssColor: Oklch = {
		l: Number(color.l.toFixed(4)),
		c: Number(color.c.toFixed(4)),
		h: Number(color.h.toFixed(2)),
	};
	return formatOklch(cssColor);
}

export function getPalettePresetSuggestions(input: {
	primaryColor?: string;
	baseColor?: string;
} = {}): PalettePresetSuggestion[] {
	const primaryColor = normalizeHexColor(
		input.primaryColor || input.baseColor,
		DEFAULT_THEME_COLORS.primaryColor,
	);

	return PALETTE_PRESET_RECIPES.map((recipe) => {
		const theme = buildPresetTheme(primaryColor, recipe);
		return {
			id: recipe.id,
			label: recipe.label,
			description: recipe.description,
			harmonyMode: recipe.harmonyMode,
			theme,
			science: {
				primary: toScienceSwatch(theme.primaryColor),
				accent: toScienceSwatch(theme.accentColor),
				secondary: toScienceSwatch(theme.secondaryColor),
				background: toScienceSwatch(theme.backgroundColor),
				text: toScienceSwatch(theme.textColor),
			},
		};
	});
}

export function getPalettePresetSuggestionById(
	presetId: unknown,
	input: { primaryColor?: string; baseColor?: string } = {},
): PalettePresetSuggestion {
	const primaryColor = normalizeHexColor(
		input.primaryColor || input.baseColor,
		DEFAULT_THEME_COLORS.primaryColor,
	);
	const recipe = getPresetRecipe(presetId);
	const theme = buildPresetTheme(primaryColor, recipe);

	return {
		id: recipe.id,
		label: recipe.label,
		description: recipe.description,
		harmonyMode: recipe.harmonyMode,
		theme,
		science: {
			primary: toScienceSwatch(theme.primaryColor),
			accent: toScienceSwatch(theme.accentColor),
			secondary: toScienceSwatch(theme.secondaryColor),
			background: toScienceSwatch(theme.backgroundColor),
			text: toScienceSwatch(theme.textColor),
		},
	};
}
