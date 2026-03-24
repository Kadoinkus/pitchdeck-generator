<script lang="ts">
	/**
	 * Slide headline block with optional kicker, title (with accent), and subtitle.
	 * Replaces `renderHeadline()` from components.ts.
	 */
	import AccentText from './AccentText.svelte';
	import { fitText } from './utils.ts';

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
