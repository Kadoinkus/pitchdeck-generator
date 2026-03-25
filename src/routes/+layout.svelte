<script lang="ts">
	import { dev } from '$app/environment';
	import Haiku from '$lib/components/Haiku.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import '../app.css';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" type="image/x-icon">
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Pacifico&display=swap"
		rel="stylesheet"
	>
</svelte:head>

{@render children()}

<footer class="haiku-footer">
	<Haiku variant="ghost" />
</footer>

<style>
	.haiku-footer {
		padding: 2rem 1rem;
		text-align: center;
	}
</style>
