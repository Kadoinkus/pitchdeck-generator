/**
 * Reactive brand palette store — single $state proxy, no module-level $derived.
 *
 * Svelte 5's $derived at module scope doesn't propagate dirty flags through
 * getter functions across files. Instead we use a deep-reactive $state object
 * and compute derived values on-read. Components wrap getters in their own
 * $derived — the proxy property reads are tracked directly.
 */

import {
	DEFAULT_THEME_COLORS,
	getPalettePresetSuggestions,
	HARMONY_MODES,
	normalizeHexColor,
	resolveShuffleParams,
	resolveThemePalette,
} from '$lib/color-palette';
import type { HarmonyMode, PalettePresetSuggestion, ThemeColors } from '$lib/color-palette';

// ---------------------------------------------------------------------------
// Single reactive state object — deep proxy
// ---------------------------------------------------------------------------

export type BrandTarget = 'primary' | 'accent';

const _s = $state({
	primaryColor: DEFAULT_THEME_COLORS.primaryColor,
	harmonyMode: 'complementary' as HarmonyMode,
	shuffleSeed: 0,
	lockAccent: false,
	lockSecondary: false,
	manualAccent: DEFAULT_THEME_COLORS.accentColor,
	manualSecondary: DEFAULT_THEME_COLORS.secondaryColor,
	manualBackground: DEFAULT_THEME_COLORS.backgroundColor,
	manualText: DEFAULT_THEME_COLORS.textColor,
	statusOverride: null as string | null,
	brandTarget: 'primary' as BrandTarget,
});

/** Build args for resolveThemePalette from the reactive proxy. */
function _resolveArgs() {
	return {
		primaryColor: _s.primaryColor,
		harmonyMode: _s.harmonyMode,
		shuffleSeed: _s.shuffleSeed,
		locks: {
			accentColor: _s.lockAccent,
			secondaryColor: _s.lockSecondary,
		},
		manualColors: {
			primaryColor: _s.primaryColor,
			accentColor: _s.manualAccent,
			secondaryColor: _s.manualSecondary,
			backgroundColor: _s.manualBackground,
			textColor: _s.manualText,
		},
	};
}

// ---------------------------------------------------------------------------
// Read accessors — compute from $state proxy, no caching
// ---------------------------------------------------------------------------

export function getPrimaryColor(): string {
	return _s.primaryColor;
}

export function getTheme(): ThemeColors {
	return resolveThemePalette(_resolveArgs()).theme;
}

export function getAccentColor(): string {
	return getTheme().accentColor;
}

export function getSecondaryColor(): string {
	return getTheme().secondaryColor;
}

export function getBackgroundColor(): string {
	return getTheme().backgroundColor;
}

export function getTextColor(): string {
	return getTheme().textColor;
}

export function getHarmonyMode(): HarmonyMode {
	return _s.harmonyMode;
}

export function getShuffleSeed(): number {
	return _s.shuffleSeed;
}

export function getLockAccent(): boolean {
	return _s.lockAccent;
}

export function getLockSecondary(): boolean {
	return _s.lockSecondary;
}

export function getBrandTarget(): BrandTarget {
	return _s.brandTarget;
}

export function setBrandTarget(target: BrandTarget): void {
	_s.brandTarget = target;
}

/** Set the brand color — routes to primary or accent based on brandTarget. */
export function setBrandColor(hex: string): void {
	const normalized = normalizeHexColor(hex, DEFAULT_THEME_COLORS.primaryColor);
	if (_s.brandTarget === 'accent') {
		_s.lockAccent = true;
		_s.manualAccent = normalized;
	} else {
		_s.primaryColor = normalized;
	}
	_s.statusOverride = null;
}

export function getPaletteStatus(): { text: string; tone: string } {
	if (_s.statusOverride) return { text: _s.statusOverride, tone: '' };
	const r = resolveThemePalette(_resolveArgs());
	if (r.adjustments.length > 0) {
		return {
			text: `${r.harmonyMode} harmony \u00b7 variant ${
				r.variantIndex + 1
			}/${r.variantCount}. Corrected ${r.adjustments.length} color${
				r.adjustments.length === 1 ? '' : 's'
			} for readability.`,
			tone: 'warning',
		};
	}
	return {
		text: `${r.harmonyMode} harmony \u00b7 variant ${r.variantIndex + 1}/${r.variantCount}.`,
		tone: '',
	};
}

export function getPresets(): PalettePresetSuggestion[] {
	return getPalettePresetSuggestions({ primaryColor: _s.primaryColor });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function setPrimaryColor(hex: string): void {
	_s.primaryColor = normalizeHexColor(hex, DEFAULT_THEME_COLORS.primaryColor);
	_s.statusOverride = null;
}

export function setHarmonyMode(mode: string): void {
	_s.harmonyMode = isHarmonyMode(mode) ? mode : _s.harmonyMode;
	_s.statusOverride = null;
}

export function setShuffleSeed(seed: number): void {
	_s.shuffleSeed = seed;
	_s.statusOverride = null;
}

export function shuffle(): void {
	let next: number;
	let attempts = 0;
	do {
		next = Math.floor(Math.random() * 1_000_000);
		attempts++;
	} while (next === _s.shuffleSeed && attempts < 10);
	const params = resolveShuffleParams(next);
	_s.shuffleSeed = next;
	_s.harmonyMode = params.harmonyMode;
	_s.statusOverride = null;
}

export function setLockAccent(locked: boolean): void {
	_s.lockAccent = locked;
	_s.statusOverride = null;
}

export function setLockSecondary(locked: boolean): void {
	_s.lockSecondary = locked;
	_s.statusOverride = null;
}

export function setManualAccent(hex: string): void {
	_s.manualAccent = normalizeHexColor(hex, DEFAULT_THEME_COLORS.accentColor);
	_s.statusOverride = null;
}

export function setManualSecondary(hex: string): void {
	_s.manualSecondary = normalizeHexColor(hex, DEFAULT_THEME_COLORS.secondaryColor);
	_s.statusOverride = null;
}

export function setManualBackground(hex: string): void {
	_s.manualBackground = normalizeHexColor(hex, DEFAULT_THEME_COLORS.backgroundColor);
	_s.statusOverride = null;
}

export function setManualText(hex: string): void {
	_s.manualText = normalizeHexColor(hex, DEFAULT_THEME_COLORS.textColor);
	_s.statusOverride = null;
}

export function applyPreset(preset: PalettePresetSuggestion): void {
	_s.harmonyMode = preset.harmonyMode;
	_s.manualAccent = preset.theme.accentColor;
	_s.manualSecondary = preset.theme.secondaryColor;
	_s.manualBackground = preset.theme.backgroundColor;
	_s.manualText = preset.theme.textColor;
	_s.lockAccent = true;
	_s.lockSecondary = true;
	_s.statusOverride = `${preset.label} \u00b7 ${preset.description}`;
}

export function isPresetActive(preset: PalettePresetSuggestion): boolean {
	const theme = getTheme();
	return theme.accentColor === preset.theme.accentColor
		&& theme.secondaryColor === preset.theme.secondaryColor
		&& theme.backgroundColor === preset.theme.backgroundColor
		&& theme.textColor === preset.theme.textColor;
}

// ---------------------------------------------------------------------------
// Hydrate / snapshot — for draft persistence in editor store
// ---------------------------------------------------------------------------

export function hydrate(payload: Record<string, unknown>): void {
	_s.primaryColor = normalizeHexColor(payload.primaryColor, DEFAULT_THEME_COLORS.primaryColor);
	_s.harmonyMode = isHarmonyMode(payload.harmonyMode) ? payload.harmonyMode : 'complementary';
	_s.shuffleSeed = Math.max(0, Math.floor(Number(payload.paletteShuffleSeed) || 0));
	_s.lockAccent = Boolean(payload.lockAccentColor);
	_s.lockSecondary = Boolean(payload.lockSecondaryColor);
	_s.manualAccent = normalizeHexColor(payload.accentColor, DEFAULT_THEME_COLORS.accentColor);
	_s.manualSecondary = normalizeHexColor(
		payload.secondaryColor,
		DEFAULT_THEME_COLORS.secondaryColor,
	);
	_s.manualBackground = normalizeHexColor(
		payload.backgroundColor,
		DEFAULT_THEME_COLORS.backgroundColor,
	);
	_s.manualText = normalizeHexColor(payload.textColor, DEFAULT_THEME_COLORS.textColor);
	_s.brandTarget = payload.brandTarget === 'accent' ? 'accent' : 'primary';
	_s.statusOverride = null;
}

export function snapshot(): Record<string, unknown> {
	const resolved = resolveThemePalette(_resolveArgs());
	return {
		primaryColor: _s.primaryColor,
		harmonyMode: _s.harmonyMode,
		paletteShuffleSeed: _s.shuffleSeed,
		lockAccentColor: _s.lockAccent,
		lockSecondaryColor: _s.lockSecondary,
		brandTarget: _s.brandTarget,
		accentColor: resolved.theme.accentColor,
		secondaryColor: resolved.theme.secondaryColor,
		backgroundColor: resolved.theme.backgroundColor,
		textColor: resolved.theme.textColor,
	};
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const HARMONY_MODES_SET: ReadonlySet<string> = new Set(HARMONY_MODES);

function isHarmonyMode(value: unknown): value is HarmonyMode {
	return typeof value === 'string' && HARMONY_MODES_SET.has(value);
}
