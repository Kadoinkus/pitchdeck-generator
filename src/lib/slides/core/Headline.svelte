<script lang="ts">
	/**
	 * Slide headline block with optional kicker, title (with accent), and subtitle.
	 * Replaces `renderHeadline()` from components.ts.
	 */
	import AccentText from '$lib/slides/core/AccentText.svelte';
	import { fitText } from '$lib/slides/core/utils';

	interface HeadlineProps {
		kicker?: string;
		title?: string;
		accentPhrase?: string;
		subtitle?: string;
		target?: string;
		align?: string;
		compact?: boolean;
		maxTitleChars?: number;
		maxSubtitleChars?: number;
	}

	let {
		kicker = '',
		title = '',
		accentPhrase = '',
		subtitle = '',
		target = 'global-concept',
		align = 'left',
		compact = false,
		maxTitleChars = 58,
		maxSubtitleChars = 140,
	}: HeadlineProps = $props();

	const safeKicker = $derived(fitText(kicker, 46));
	const safeTitle = $derived(fitText(title, maxTitleChars));
	const safeSubtitle = $derived(fitText(subtitle, maxSubtitleChars));
	const alignClass = $derived(align === 'center' ? 'is-center' : 'is-left');
	const compactClass = $derived(compact ? 'is-compact' : '');
</script>

<header class="headline-block {alignClass} {compactClass}">
	{#if safeKicker}
		<p
			class="headline-kicker ai-clickable"
			data-ai-target={target}
			data-ai-label="{safeKicker} kicker"
		>
			{safeKicker}
		</p>
	{/if}
	<h1
		class="headline-title ai-clickable"
		data-ai-target={target}
		data-ai-label="{safeTitle || 'Title'} headline"
	>
		<AccentText text={safeTitle} accent={accentPhrase} />
	</h1>
	{#if safeSubtitle}
		<p
			class="headline-subtitle ai-clickable"
			data-ai-target={target}
			data-ai-label="{safeTitle || 'Title'} subtitle"
		>
			{safeSubtitle}
		</p>
	{/if}
</header>

<style>
	.headline-block {
		display: grid;
		gap: 0.5cqi;
	}

	.headline-block.is-center {
		text-align: center;
		justify-items: center;
	}

	.headline-block.is-compact {
		gap: 0.4cqi;
	}

	.headline-kicker {
		margin: 0 0 0 0.3cqi;
		font-size: 1.08cqi;
		line-height: 1.4;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--muted);
	}

	.headline-title {
		margin: 0;
		font-family: var(--deck-heading, "Sora", sans-serif);
		font-size: 3.8cqi;
		line-height: 0.98;
		letter-spacing: -0.02em;
		max-width: 18ch;
	}

	.headline-subtitle {
		margin: 0;
		font-size: 1.27cqi;
		line-height: 1.3;
		color: var(--muted);
		max-width: 58ch;
	}
</style>
