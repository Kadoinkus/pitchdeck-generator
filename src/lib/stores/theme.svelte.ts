/**
 * Theme store — manages 3-state preference.
 *
 * Preference: `system` | `light` | `dark`.
 * Resolved: `light` | `dark`.
 */

import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Explicit user choice or "system" delegation. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Resolved effective theme (never "system"). */
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let preference = $state<ThemePreference>('system');
let initialized = false;

const prefersDark = new MediaQuery(PREFERS_DARK_QUERY, false);

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const systemTheme: ResolvedTheme = $derived(prefersDark.current ? 'dark' : 'light');

const resolved: ResolvedTheme = $derived(
	preference === 'system' ? systemTheme : preference,
);

// ---------------------------------------------------------------------------
// Side effects
// ---------------------------------------------------------------------------

function applyToDocument(theme: ResolvedTheme): void {
	if (!browser) return;
	const root = document.documentElement;
	root.setAttribute('data-theme', theme);
	root.classList.toggle('dark', theme === 'dark');
}

/** Resolve theme without relying on `$derived` outside reactive context. */
function resolveNow(): ResolvedTheme {
	return preference === 'system'
		? prefersDark.current
			? 'dark'
			: 'light'
		: preference;
}

function persist(pref: ThemePreference): void {
	if (!browser) return;
	localStorage.setItem(THEME_STORAGE_KEY, pref);
}

function parsePreference(value: string | null): ThemePreference {
	if (value === 'light' || value === 'dark' || value === 'system') return value;
	return 'system';
}

// ---------------------------------------------------------------------------
// Init (explicit, idempotent)
// ---------------------------------------------------------------------------

export function initTheme(): void {
	if (!browser) return;

	if (!initialized) {
		initialized = true;

		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		preference = parsePreference(stored);
	}

	applyToDocument(resolveNow());
}

$effect(() => {
	if (!browser || !initialized) return;
	const root = document.documentElement;
	root.setAttribute('data-theme', resolved);
	root.classList.toggle('dark', resolved === 'dark');
});

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

/** Cycle: system -> light -> dark -> system. */
export function toggleTheme(): void {
	const next: ThemePreference = preference === 'system'
		? 'light'
		: preference === 'light'
		? 'dark'
		: 'system';
	setTheme(next);
}
