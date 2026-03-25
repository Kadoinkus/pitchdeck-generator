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
	<!--
		Default OG / Twitter meta — pages can override via their own <svelte:head>
	-->
	<meta
		name="description"
		content="AI-powered pitch deck generator — set client name + URL, let AI fill the deck, export to PowerPoint, PDF, or shareable link."
	>
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="Notso AI Pitch Deck Studio">
	<meta property="og:title" content="Notso AI Pitch Deck Studio">
	<meta
		property="og:description"
		content="AI-powered pitch deck generator — set client name + URL, let AI fill the deck, export to PowerPoint, PDF, or shareable link."
	>
	<meta property="og:url" content="https://pitch.kjanat.com">
	<meta
		property="og:image"
		content="https://pitch.kjanat.com/social/deck-share-card.png"
	>
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:title" content="Notso AI Pitch Deck Studio">
	<meta
		name="twitter:description"
		content="AI-powered pitch deck generator — set client name + URL, let AI fill the deck, export to PowerPoint, PDF, or shareable link."
	>
	<meta
		name="twitter:image"
		content="https://pitch.kjanat.com/social/deck-share-card.png"
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
