import { DEFAULT_THEME_COLORS } from '$lib/color-palette';
import type { PalettePresetSuggestion } from '$lib/color-palette';
import {
	applyPreset,
	getAccentColor,
	getBackgroundColor,
	getHarmonyMode,
	getLockAccent,
	getLockSecondary,
	getPaletteStatus,
	getPresets,
	getPrimaryColor,
	getSecondaryColor,
	getShuffleSeed,
	getTextColor,
	getTheme,
	hydrate,
	isPresetActive,
	setHarmonyMode,
	setLockAccent,
	setLockSecondary,
	setManualAccent,
	setManualBackground,
	setManualSecondary,
	setManualText,
	setPrimaryColor,
	setShuffleSeed,
	shuffle,
	snapshot,
} from '$lib/stores/brand-palette.svelte';
import { beforeEach, describe, expect, it } from 'vitest';

function firstPreset(): PalettePresetSuggestion {
	const p = getPresets()[0];
	if (!p) throw new Error('No presets available');
	return p;
}

function presetAt(index: number): PalettePresetSuggestion {
	const p = getPresets()[index];
	if (!p) throw new Error(`No preset at index ${index}`);
	return p;
}

/** Reset store to defaults before each test. */
function resetStore(): void {
	hydrate({
		primaryColor: DEFAULT_THEME_COLORS.primaryColor,
		harmonyMode: 'complementary',
		paletteShuffleSeed: 0,
		lockAccentColor: false,
		lockSecondaryColor: false,
		accentColor: DEFAULT_THEME_COLORS.accentColor,
		secondaryColor: DEFAULT_THEME_COLORS.secondaryColor,
		backgroundColor: DEFAULT_THEME_COLORS.backgroundColor,
		textColor: DEFAULT_THEME_COLORS.textColor,
	});
}

describe('brand palette store — mutations and derived effects', () => {
	beforeEach(resetStore);

	it('has correct defaults after reset', () => {
		expect(getPrimaryColor()).toBe(DEFAULT_THEME_COLORS.primaryColor);
		expect(getHarmonyMode()).toBe('complementary');
		expect(getShuffleSeed()).toBe(0);
		expect(getLockAccent()).toBe(false);
		expect(getLockSecondary()).toBe(false);
	});

	it('setPrimaryColor updates primary and recomputes theme', () => {
		const before = getTheme();
		setPrimaryColor('#FF0000');
		expect(getPrimaryColor()).toBe('#FF0000');

		const after = getTheme();
		expect(after.primaryColor).toBe('#FF0000');
		// Accent should change when primary changes
		expect(after.accentColor).not.toBe(before.accentColor);
	});

	it('shuffle changes seed and at least one derived color', () => {
		const before = { ...getTheme() };
		const seedBefore = getShuffleSeed();

		shuffle();

		expect(getShuffleSeed()).not.toBe(seedBefore);
		const after = getTheme();
		const changed = after.accentColor !== before.accentColor
			|| after.secondaryColor !== before.secondaryColor
			|| after.backgroundColor !== before.backgroundColor;
		expect(changed).toBe(true);
	});

	it('multiple shuffles produce different palettes', () => {
		const seen = new Set<string>();
		for (let i = 0; i < 5; i++) {
			shuffle();
			seen.add(`${getAccentColor()}/${getSecondaryColor()}`);
		}
		// At least 2 distinct palettes out of 5 shuffles
		expect(seen.size).toBeGreaterThanOrEqual(2);
	});

	it('setHarmonyMode changes the derived palette', () => {
		const compTheme = { ...getTheme() };

		setHarmonyMode('triad');
		expect(getHarmonyMode()).toBe('triad');

		const triadTheme = getTheme();
		expect(triadTheme.accentColor).not.toBe(compTheme.accentColor);
	});

	it('applyPreset sets theme to match the preset exactly', () => {
		const preset = firstPreset();
		applyPreset(preset);

		const theme = getTheme();
		expect(theme.accentColor).toBe(preset.theme.accentColor);
		expect(theme.secondaryColor).toBe(preset.theme.secondaryColor);
		expect(theme.backgroundColor).toBe(preset.theme.backgroundColor);
		expect(theme.textColor).toBe(preset.theme.textColor);
	});

	it('isPresetActive returns true only for the applied preset', () => {
		const target = presetAt(1);
		applyPreset(target);

		for (const preset of getPresets()) {
			if (preset.id === target.id) {
				expect(isPresetActive(preset)).toBe(true);
			} else {
				expect(isPresetActive(preset)).toBe(false);
			}
		}
	});

	it('applyPreset sets status override', () => {
		const preset = firstPreset();
		applyPreset(preset);

		const status = getPaletteStatus();
		expect(status.text).toContain(preset.label);
		expect(status.tone).toBe('');
	});

	it('manual change clears status override', () => {
		const preset = firstPreset();
		applyPreset(preset);
		expect(getPaletteStatus().text).toContain(preset.label);

		setPrimaryColor('#AA0000');
		const status = getPaletteStatus();
		expect(status.text).not.toContain(preset.label);
		expect(status.text).toContain('harmony');
	});

	it('lock accent enables manual accent override', () => {
		setLockAccent(true);
		setManualAccent('#FF00FF');

		expect(getLockAccent()).toBe(true);
		expect(getAccentColor()).toBe('#FF00FF');
	});

	it('unlocked accent ignores manual value', () => {
		setLockAccent(false);
		setManualAccent('#FF00FF');

		// Accent is derived from harmony, not the manual value
		expect(getAccentColor()).not.toBe('#FF00FF');
	});

	it('lock secondary enables manual secondary override', () => {
		setLockSecondary(true);
		// Use a dark color that won't be adjusted by enforceThemeSafety
		setManualSecondary('#1A3B2A');

		expect(getLockSecondary()).toBe(true);
		expect(getSecondaryColor()).toBe('#1A3B2A');
	});

	it('background and text are always overridable', () => {
		setManualBackground('#FAFAFA');
		// Background goes through enforceThemeSafety, so check it's close
		expect(getBackgroundColor()).toMatch(/^#[0-9A-Fa-f]{6}$/);

		setManualText('#111111');
		expect(getTextColor()).toMatch(/^#[0-9A-Fa-f]{6}$/);
	});

	it('hydrate + snapshot roundtrip preserves values', () => {
		setPrimaryColor('#AA5500');
		setHarmonyMode('analogous');
		shuffle();
		shuffle();
		setLockAccent(true);
		setManualAccent('#CCDD00');

		const seedAfter = getShuffleSeed();
		const modeAfter = getHarmonyMode();
		const snap = snapshot();

		// Reset and re-hydrate
		resetStore();
		expect(getPrimaryColor()).toBe(DEFAULT_THEME_COLORS.primaryColor);

		hydrate(snap);
		expect(getPrimaryColor()).toBe('#AA5500');
		expect(getHarmonyMode()).toBe(modeAfter);
		expect(getShuffleSeed()).toBe(seedAfter);
		expect(getLockAccent()).toBe(true);
	});

	it('presets update when primary color changes', () => {
		const presetsBefore = getPresets().map((p) => p.theme.accentColor);
		setPrimaryColor('#FF0000');
		const presetsAfter = getPresets().map((p) => p.theme.accentColor);

		// At least some preset accents should differ
		const changed = presetsBefore.some((c, i) => c !== presetsAfter[i]);
		expect(changed).toBe(true);
	});

	it('each harmony mode produces a different palette', () => {
		const modes = [
			'complementary',
			'split-complementary',
			'analogous',
			'triad',
			'square',
			'tetradic',
			'monochromatic',
		] as const;

		const palettes = new Set<string>();
		for (const mode of modes) {
			setHarmonyMode(mode);
			palettes.add(`${getAccentColor()}/${getSecondaryColor()}`);
		}

		expect(palettes.size).toBe(modes.length);
	});

	it('shuffle changes harmony mode across multiple clicks', () => {
		const modes = new Set<string>();
		for (let i = 0; i < 15; i++) {
			shuffle();
			modes.add(getHarmonyMode());
		}
		// 15 shuffles should hit at least 3 of 7 modes
		expect(modes.size).toBeGreaterThanOrEqual(3);
	});

	it('seed=0 preserves manually set harmony mode', () => {
		setHarmonyMode('triad');
		setShuffleSeed(0);
		expect(getHarmonyMode()).toBe('triad');
		// Theme should use triad, not a PRNG-derived mode
		const theme = getTheme();
		expect(theme.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
	});
});

describe('editor-level shufflePalette integration', () => {
	beforeEach(resetStore);

	it('shufflePalette syncs snapshot into editor payload and marks dirty', async () => {
		const editor = await import('$lib/stores/editor.svelte');

		const payloadBefore = { ...editor.getPayload() };
		const seedBefore = getShuffleSeed();

		editor.shufflePalette();

		// Seed changed (random, not sequential)
		const seedAfter = getShuffleSeed();
		expect(seedAfter).not.toBe(seedBefore);

		// Payload got the snapshot
		const payloadAfter = editor.getPayload();
		expect(payloadAfter.paletteShuffleSeed).toBe(seedAfter);

		// At least one color changed in the payload
		const changed = payloadAfter.accentColor !== payloadBefore.accentColor
			|| payloadAfter.secondaryColor !== payloadBefore.secondaryColor
			|| payloadAfter.backgroundColor !== payloadBefore.backgroundColor;
		expect(changed).toBe(true);
	});

	it('shufflePalette marks editor dirty', async () => {
		const editor = await import('$lib/stores/editor.svelte');

		// Save to establish a clean baseline
		editor.saveDraft(true);
		expect(editor.getSaveState()).toBe('is-saved');

		editor.shufflePalette();
		// Shuffle changes colors → payload diverges → dirty
		const state = editor.getSaveState();
		expect(state === 'is-dirty' || state === 'is-saving').toBe(true);
	});
});
