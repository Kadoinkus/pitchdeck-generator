<script lang="ts">
	import {
		getPreference,
		getResolved,
		type ThemePreference,
		toggleTheme,
	} from '$lib/stores/theme.svelte';

	const labels: Record<ThemePreference, string> = {
		system: 'System',
		light: 'Light',
		dark: 'Dark',
	};

	const pref = $derived(getPreference());
	const resolved = $derived(getResolved());
</script>

<button
	class="theme-toggle"
	onclick={toggleTheme}
	title="Theme: {labels[pref]} ({resolved})"
	aria-label="Toggle theme (currently {labels[pref]})"
>
	{#if resolved === 'dark'}
		<!-- Moon icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{:else}
		<!-- Sun icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="5" />
			<line x1="12" y1="1" x2="12" y2="3" />
			<line x1="12" y1="21" x2="12" y2="23" />
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
			<line x1="1" y1="12" x2="3" y2="12" />
			<line x1="21" y1="12" x2="23" y2="12" />
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
		</svg>
	{/if}
	{#if pref === 'system'}
		<span class="badge" title="Auto" aria-label="Auto">A</span>
	{/if}
</button>

<style>
	.theme-toggle {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 900;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--text);
		box-shadow: var(--shadow);
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.16s ease, background 0.2s ease;
	}

	@media (hover: hover) {
		.theme-toggle:hover {
			transform: scale(1.1);
		}
	}

	.badge {
		position: absolute;
		top: -2px;
		right: -2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		font-size: 8px;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
</style>
