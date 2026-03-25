import {
	contrastRatio,
	getPalettePresetSuggestionById,
	getPalettePresetSuggestions,
	resolveThemePalette,
	toOklchCss,
} from '$lib/color-palette';
import { describe, expect, it } from 'vitest';

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
