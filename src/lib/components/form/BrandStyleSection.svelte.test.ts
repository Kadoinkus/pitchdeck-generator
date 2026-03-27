import { DEFAULT_THEME_COLORS } from '$lib/color-palette';
import * as palette from '$lib/stores/brand-palette.svelte';
import { hydrateBrandPalette, pushHistory } from '$lib/stores/editor.svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import BrandStyleSection from './BrandStyleSection.svelte';

function resetAll(): void {
	// hydrateBrandPalette first so stale _payload is loaded,
	// then palette.hydrate overrides with clean defaults.
	hydrateBrandPalette();
	palette.hydrate({
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
	pushHistory();
}

afterEach(() => {
	cleanup();
});

/** Read the inline `background` style of each swatch in .active-swatches. */
function getSwatchStyles(): string[] {
	const swatches = document.querySelectorAll('.active-swatches span');
	return Array.from(swatches).map(
		(el) => (el as HTMLElement).style.background,
	);
}

describe('BrandStyleSection — real button clicks', () => {
	it('shuffle button changes the active palette swatches', async () => {
		resetAll();
		await render(BrandStyleSection);

		// Open the section
		const summary = page.getByText('Brand Styling');
		await summary.click();
		await tick();

		const before = getSwatchStyles();
		expect(before.length).toBe(5);

		// Click shuffle
		const shuffleBtn = page.getByRole('button', { name: 'Shuffle' });
		await shuffleBtn.click();
		await tick();

		const after = getSwatchStyles();
		expect(after.length).toBe(5);

		// At least one swatch must have changed
		const changed = before.some((bg, i) => bg !== after[i]);
		expect(changed).toBe(true);
	});

	it('clicking a preset card updates the active swatches to match', async () => {
		resetAll();
		await render(BrandStyleSection);

		const summary = page.getByText('Brand Styling');
		await summary.click();
		await tick();

		// TODO: Use locator API instead of document.querySelectorAll for consistency
		// Click the second preset card
		const presetCards = document.querySelectorAll('.preset-card');
		expect(presetCards.length).toBe(4);

		const secondCard = presetCards[1];
		expect(secondCard).toBeTruthy();
		if (secondCard instanceof HTMLElement) secondCard.click();
		await tick();

		// The clicked card should now be active
		expect(secondCard?.classList.contains('is-active')).toBe(true);

		// Active swatches should have distinct colors
		const swatches = getSwatchStyles();
		expect(swatches.length).toBe(5);
		const unique = new Set(swatches);
		expect(unique.size).toBeGreaterThan(1);
	});

	it('multiple shuffles produce visibly different palettes', async () => {
		resetAll();
		await render(BrandStyleSection);

		const summary = page.getByText('Brand Styling');
		await summary.click();
		await tick();

		const shuffleBtn = page.getByRole('button', { name: 'Shuffle' });
		const seen = new Set<string>();

		for (let i = 0; i < 5; i++) {
			await shuffleBtn.click();
			await tick();
			seen.add(getSwatchStyles().join('|'));
		}

		// At least 2 visually distinct palettes out of 5 clicks
		expect(seen.size).toBeGreaterThanOrEqual(2);
	});

	// TODO: Test UI interaction, not direct store calls
	it('color picker change updates the active swatches', async () => {
		resetAll();
		await render(BrandStyleSection);

		const summary = page.getByText('Brand Styling');
		await summary.click();
		await tick();

		const before = getSwatchStyles();

		// Change primary color via the store (simulating picker input)
		palette.setPrimaryColor('#FF0000');
		await tick();

		const after = getSwatchStyles();
		const changed = before.some((bg, i) => bg !== after[i]);
		expect(changed).toBe(true);
	});
});
