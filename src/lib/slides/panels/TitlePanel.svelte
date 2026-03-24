<script lang="ts">
	/**
	 * Title panel: headline block optionally wrapped in a panel article.
	 * Replaces `renderTitlePanel()` from presets.ts.
	 */
	import Headline from '../core/Headline.svelte';
	import { panelClassName } from './variants.ts';

	interface TitlePanelProps {
		target?: string;
		kicker?: string;
		title?: string;
		accentPhrase?: string;
		subtitle?: string;
		align?: string;
		compact?: boolean;
		asPanel?: boolean;
		variant?: string;
		className?: string;
		maxTitleChars?: number;
		maxSubtitleChars?: number;
	}

	let {
		target = 'global-concept',
		kicker = '',
		title = '',
		accentPhrase = '',
		subtitle = '',
		align = 'left',
		compact = false,
		asPanel = true,
		variant = 'transparent',
		className = 'text-surface',
		maxTitleChars = 58,
		maxSubtitleChars = 140,
	}: TitlePanelProps = $props();

	const cls = $derived(panelClassName({ variant, className }));
</script>

{#if asPanel}
	<article class={cls}>
		<Headline
			{kicker}
			{title}
			{accentPhrase}
			{subtitle}
			{target}
			{align}
			{compact}
			{maxTitleChars}
			{maxSubtitleChars}
		/>
	</article>
{:else}
	<Headline
		{kicker}
		{title}
		{accentPhrase}
		{subtitle}
		{target}
		{align}
		{compact}
		{maxTitleChars}
		{maxSubtitleChars}
	/>
{/if}
