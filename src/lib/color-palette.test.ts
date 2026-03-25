import {
	contrastRatio,
	DEFAULT_THEME_COLORS,
	getPalettePresetSuggestionById,
	getPalettePresetSuggestions,
	HARMONY_MODES,
	resolveShuffleParams,
	resolveThemePalette,
	toOklchCss,
} from '$lib/color-palette';
import type { ThemeColors } from '$lib/color-palette';
import { describe, expect, it } from 'vitest';

/** Euclidean distance in RGB space (0–441.67 max). */
function rgbDistance(a: string, b: string): number {
	const parse = (hex: string) => ({
		r: Number.parseInt(hex.slice(1, 3), 16),
		g: Number.parseInt(hex.slice(3, 5), 16),
		b: Number.parseInt(hex.slice(5, 7), 16),
	});
	const pa = parse(a);
	const pb = parse(b);
	return Math.sqrt((pa.r - pb.r) ** 2 + (pa.g - pb.g) ** 2 + (pa.b - pb.b) ** 2);
}

/**
 * Minimum pairwise RGB distance — ensures all 5 palette colors are
 * visually distinguishable from each other.
 */
function minPairwiseDistance(theme: ThemeColors): number {
	const colors = [
		theme.primaryColor,
		theme.accentColor,
		theme.secondaryColor,
		theme.backgroundColor,
		theme.textColor,
	];
	let min = Infinity;
	for (let i = 0; i < colors.length; i++) {
		for (let j = i + 1; j < colors.length; j++) {
			const a = colors[i];
			const b = colors[j];
			if (a && b) min = Math.min(min, rgbDistance(a, b));
		}
	}
	return min;
}

describe('color palette science presets', () => {
	it('builds helpful preset suggestions from the primary color', () => {
		const suggestions = getPalettePresetSuggestions({ primaryColor: '#127A74' });
		expect(suggestions).toHaveLength(4);

		for (const preset of suggestions) {
			expect(preset.theme.primaryColor).toBe('#127A74');
			expect(preset.theme.accentColor).toMatch(/^#[0-9A-F]{6}$/);
			expect(preset.theme.secondaryColor).toMatch(/^#[0-9A-F]{6}$/);
			expect(preset.theme.backgroundColor).toMatch(/^#[0-9A-F]{6}$/);
			expect(preset.theme.textColor).toMatch(/^#[0-9A-F]{6}$/);
			expect(preset.science.primary.oklch.startsWith('oklch(')).toBe(true);
		}
	});

	it('keeps preset swatches meaningfully different per relation', () => {
		const suggestions = getPalettePresetSuggestions({ primaryColor: '#2B6CB0' });
		const accentSet = new Set(suggestions.map((preset) => preset.theme.accentColor));
		const secondarySet = new Set(suggestions.map((preset) => preset.theme.secondaryColor));

		expect(accentSet.size).toBeGreaterThanOrEqual(4);
		expect(secondarySet.size).toBeGreaterThanOrEqual(4);
	});

	it('keeps text and supporting colors readable', () => {
		const suggestions = getPalettePresetSuggestions({ primaryColor: '#3C2BCB' });

		for (const preset of suggestions) {
			expect(
				contrastRatio(preset.theme.textColor, preset.theme.backgroundColor),
			).toBeGreaterThanOrEqual(7);
			expect(
				contrastRatio(preset.theme.accentColor, preset.theme.backgroundColor),
			).toBeGreaterThanOrEqual(2.2);
			expect(
				contrastRatio(preset.theme.secondaryColor, '#FFFFFF'),
			).toBeGreaterThanOrEqual(4.8);
		}
	});

	it('returns one preset by id with fallback handling', () => {
		const selected = getPalettePresetSuggestionById('editorial-contrast', {
			primaryColor: '#8A2BE2',
		});
		expect(selected.id).toBe('editorial-contrast');
		expect(selected.theme.primaryColor).toBe('#8A2BE2');

		const fallback = getPalettePresetSuggestionById('does-not-exist', {
			primaryColor: '#8A2BE2',
		});
		expect(fallback.id).toBe('balanced-brand');
	});

	it('makes each harmony relation produce distinct swatches', () => {
		const modes = [
			'complementary',
			'split-complementary',
			'analogous',
			'triad',
			'square',
			'tetradic',
			'monochromatic',
		] as const;

		const generatedPairs = new Set(
			modes.map((harmonyMode) => {
				const result = resolveThemePalette({
					primaryColor: '#2B6CB0',
					harmonyMode,
					shuffleSeed: 0,
				});
				return `${result.theme.accentColor}/${result.theme.secondaryColor}`;
			}),
		);

		expect(generatedPairs.size).toBe(modes.length);
	});
});

describe('oklch formatter', () => {
	it('formats color as CSS oklch()', () => {
		const formatted = toOklchCss('#004B49');
		expect(formatted.startsWith('oklch(')).toBe(true);
		expect(formatted.endsWith(')')).toBe(true);
	});
});

// ── Color distance / contrast threshold tests ───────────────────────────

/** Minimum acceptable RGB distance between any two palette colors. */
const MIN_PAIRWISE_RGB_DISTANCE = 10;
/** WCAG AAA: text on background. */
const MIN_TEXT_CONTRAST = 7;
/** Minimum accent visibility on background. */
const MIN_ACCENT_CONTRAST = 2.2;
/** Dark-slide color must be readable on white for slides with white text. */
const MIN_SECONDARY_ON_WHITE = 4.5;

const TEST_PRIMARIES = ['#004B49', '#FF0000', '#2B6CB0', '#8A2BE2', '#00A86B', '#D2691E'];

describe('color distance thresholds — presets', () => {
	for (const primary of TEST_PRIMARIES) {
		describe(`primary ${primary}`, () => {
			const presets = getPalettePresetSuggestions({ primaryColor: primary });

			for (const preset of presets) {
				it(`${preset.label}: text/bg contrast >= ${MIN_TEXT_CONTRAST}`, () => {
					expect(
						contrastRatio(preset.theme.textColor, preset.theme.backgroundColor),
					).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
				});

				it(`${preset.label}: accent/bg contrast >= ${MIN_ACCENT_CONTRAST}`, () => {
					expect(
						contrastRatio(preset.theme.accentColor, preset.theme.backgroundColor),
					).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
				});

				it(`${preset.label}: secondary/white contrast >= ${MIN_SECONDARY_ON_WHITE}`, () => {
					expect(
						contrastRatio(preset.theme.secondaryColor, '#FFFFFF'),
					).toBeGreaterThanOrEqual(MIN_SECONDARY_ON_WHITE);
				});

				it(`${preset.label}: all colors pairwise distinguishable (>= ${MIN_PAIRWISE_RGB_DISTANCE} RGB dist)`, () => {
					expect(minPairwiseDistance(preset.theme)).toBeGreaterThanOrEqual(
						MIN_PAIRWISE_RGB_DISTANCE,
					);
				});
			}
		});
	}
});

describe('color distance thresholds — harmony modes', () => {
	for (const primary of TEST_PRIMARIES) {
		for (const mode of HARMONY_MODES) {
			const result = resolveThemePalette({
				primaryColor: primary,
				harmonyMode: mode,
				shuffleSeed: 0,
			});

			it(`${primary} + ${mode}: text/bg contrast >= ${MIN_TEXT_CONTRAST}`, () => {
				expect(
					contrastRatio(result.theme.textColor, result.theme.backgroundColor),
				).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
			});

			it(`${primary} + ${mode}: accent/bg contrast >= ${MIN_ACCENT_CONTRAST}`, () => {
				expect(
					contrastRatio(result.theme.accentColor, result.theme.backgroundColor),
				).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
			});

			// Monochromatic palettes vary only in lightness — primary and secondary
			// can be very close in RGB by design. Skip pairwise distance for those.
			if (mode !== 'monochromatic') {
				it(`${primary} + ${mode}: pairwise distinguishable`, () => {
					expect(minPairwiseDistance(result.theme)).toBeGreaterThanOrEqual(
						MIN_PAIRWISE_RGB_DISTANCE,
					);
				});
			}
		}
	}
});

describe('color distance thresholds — shuffle variants', () => {
	it('first 8 shuffle variants all meet contrast minimums', () => {
		for (let seed = 0; seed < 8; seed++) {
			const result = resolveThemePalette({
				primaryColor: DEFAULT_THEME_COLORS.primaryColor,
				harmonyMode: 'complementary',
				shuffleSeed: seed,
			});

			expect(
				contrastRatio(result.theme.textColor, result.theme.backgroundColor),
			).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
			expect(
				contrastRatio(result.theme.accentColor, result.theme.backgroundColor),
			).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
			expect(minPairwiseDistance(result.theme)).toBeGreaterThanOrEqual(
				MIN_PAIRWISE_RGB_DISTANCE,
			);
		}
	});
});

// ── PRNG shuffle params tests ─────────────────────────────────────────────

describe('resolveShuffleParams', () => {
	it('same seed produces identical params', () => {
		const a = resolveShuffleParams(42);
		const b = resolveShuffleParams(42);
		expect(a).toEqual(b);
	});

	it('different seeds produce different params', () => {
		const a = resolveShuffleParams(100);
		const b = resolveShuffleParams(200);
		expect(
			a.harmonyMode === b.harmonyMode && a.variantIndex === b.variantIndex
				&& a.accentHueDelta === b.accentHueDelta,
		).toBe(false);
	});

	it('20 random seeds span at least 4 harmony modes', () => {
		const modes = new Set<string>();
		for (let i = 1; i <= 20; i++) {
			modes.add(resolveShuffleParams(i * 7919).harmonyMode);
		}
		expect(modes.size).toBeGreaterThanOrEqual(4);
	});
});

describe('shuffle PRNG — contrast safety across random seeds', () => {
	it('50 random seeds all meet contrast thresholds', () => {
		for (let i = 1; i <= 50; i++) {
			const seed = i * 3571;
			const result = resolveThemePalette({
				primaryColor: DEFAULT_THEME_COLORS.primaryColor,
				harmonyMode: 'complementary',
				shuffleSeed: seed,
			});
			expect(
				contrastRatio(result.theme.textColor, result.theme.backgroundColor),
			).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
			expect(
				contrastRatio(result.theme.accentColor, result.theme.backgroundColor),
			).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
		}
	});

	it('seed=0 produces no perturbation (backward compat)', () => {
		const withSeed0 = resolveThemePalette({
			primaryColor: '#2B6CB0',
			harmonyMode: 'triad',
			shuffleSeed: 0,
		});
		// seed=0 should use the input harmonyMode as-is
		expect(withSeed0.harmonyMode).toBe('triad');
	});
});
