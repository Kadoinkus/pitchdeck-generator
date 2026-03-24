<script lang="ts">
	/**
	 * Summary panel: title + text in a styled panel.
	 * Replaces `renderSummaryPanel()` from presets.ts.
	 */
	import { fitText } from '$lib/slides/core/utils';
	import { panelClassName } from '$lib/slides/panels/variants';

	interface SummaryPanelProps {
		target?: string;
		label?: string;
		title?: string;
		text?: string;
		variant?: string;
		className?: string;
		maxTitleChars?: number;
		maxTextChars?: number;
	}

	let {
		target = 'global-concept',
		label = 'Summary panel',
		title = '',
		text = '',
		variant = 'solid',
		className = 'summary-panel',
		maxTitleChars = 32,
		maxTextChars = 130,
	}: SummaryPanelProps = $props();

	const cls = $derived(panelClassName({ variant, className }));
	const safeTitle = $derived(fitText(title, maxTitleChars));
	const safeText = $derived(fitText(text, maxTextChars));
</script>

<article class={cls} data-ai-target={target} data-ai-label={label}>
	<h3>{safeTitle}</h3>
	<p>{safeText}</p>
</article>
