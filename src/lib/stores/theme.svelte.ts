/**
 * Theme store — manages light/dark mode preference.
 *
 * Resolution order: localStorage > system preference > light.
 * Applies `data-theme` attribute on `<html>` and persists to localStorage.
 *
 * The inline script in app.html handles initial paint to prevent FOUC.
 * This store syncs with that attribute once hydrated.
 */

import { browser } from '$app/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Explicit user choice or "system" delegation. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Resolved effective theme (never "system"). */
export type ResolvedTheme = 'light' | 'dark';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let preference = $state<ThemePreference>('system');
let systemDark = $state(false);

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const resolved: ResolvedTheme = $derived(
	preference === 'system' ? (systemDark ? 'dark' : 'light') : preference,
);

// ---------------------------------------------------------------------------
// Side effects
// ---------------------------------------------------------------------------

function applyToDocument(theme: ResolvedTheme): void {
	if (!browser) return;
	document.documentElement.setAttribute('data-theme', theme);
}

/** Resolve theme without relying on `$derived` outside reactive context. */
function resolveNow(): ResolvedTheme {
	return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

function persist(pref: ThemePreference): void {
	if (!browser) return;
	if (pref === 'system') {
		localStorage.removeItem('theme');
	} else {
		localStorage.setItem('theme', pref);
	}
}

// ---------------------------------------------------------------------------
// Init (runs once on module load in browser)
// ---------------------------------------------------------------------------

if (browser) {
	// Read persisted preference
	const stored = localStorage.getItem('theme');
	if (stored === 'light' || stored === 'dark') {
		preference = stored;
	}

	// Read system preference
	const mql = window.matchMedia('(prefers-color-scheme: dark)');
	systemDark = mql.matches;
	mql.addEventListener('change', (e) => {
		systemDark = e.matches;
		applyToDocument(resolveNow());
	});

	// Initial apply (sync with inline script's work)
	applyToDocument(resolveNow());

	// React to future changes via $derived
	$effect.root(() => {
		$effect(() => {
			applyToDocument(resolved);
		});
	});
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getPreference(): ThemePreference {
	return preference;
}

export function getResolved(): ResolvedTheme {
	return resolved;
}

export function setTheme(pref: ThemePreference): void {
	preference = pref;
	persist(pref);
	applyToDocument(resolveNow());
}

/** Cycle: system -> light -> dark -> system */
export function toggleTheme(): void {
	const next: ThemePreference = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
	setTheme(next);
}
