<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import Haiku from '$lib/components/Haiku.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { initTheme } from '$lib/stores/theme.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { onMount } from 'svelte';
	import '../app.css';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();
	onMount(() => {
		initTheme();
	});

	let { children } = $props();
</script>

{@render children()}

{#if page.status < 400 && !page.route.id?.startsWith('/share')}
	<footer class="haiku-footer">
		<Haiku variant="ghost" />
	</footer>
{/if}

<ThemeToggle />

<style>
	.haiku-footer {
		padding: 2rem 1rem;
		text-align: center;
	}
</style>
