<script lang="ts">
	/**
	 * Feature card with optional icon, index badge, title, and text.
	 * Replaces `renderIconFeaturePanel()` from presets.ts.
	 */
	import { iconByKeyword } from '$lib/slides/core/icons';
	import PanelIcon from '$lib/slides/core/PanelIcon.svelte';
	import { fitText } from '$lib/slides/core/utils';
	import { panelClassName } from '$lib/slides/panels/variants';

	interface IconFeaturePanelProps {
		slideType?: string;
		sectionKey?: string;
		panelCount?: number;
		target?: string;
		label?: string;
		index?: number | null;
		title?: string;
		text?: string;
		variant?: string;
		className?: string;
		showTitle?: boolean;
		showText?: boolean;
		maxTitleChars?: number;
		maxTextChars?: number;
	}

	let {
		slideType = '',
		sectionKey = '',
		panelCount = 0,
		target = 'global-concept',
		label = 'Feature panel',
		index = null,
		title = '',
		text = '',
		variant = 'solid',
		className = 'feature-card panel-card-with-icon',
		showTitle = true,
		showText = true,
		maxTitleChars = 28,
		maxTextChars = 92,
	}: IconFeaturePanelProps = $props();

	const cls = $derived(panelClassName({ variant, className }));
	const iconName = $derived(iconByKeyword(`${title} ${text}`));
	const hasIndex = $derived(Number.isFinite(index));
	const indexLabel = $derived(String((index ?? 0) + 1).padStart(2, '0'));
	const safeTitle = $derived(fitText(title, maxTitleChars));
	const safeText = $derived(fitText(text, maxTextChars));
</script>

<article class={cls} data-ai-target={target} data-ai-label={label}>
	{#if hasIndex}
		<span class="card-index">{indexLabel}</span>
	{/if}
	<PanelIcon
		{slideType}
		{sectionKey}
		{panelCount}
		{iconName}
		label="{title || 'Feature'} icon"
	/>
	{#if showTitle}
		<h3>{safeTitle}</h3>
	{/if}
	{#if showText}
		<p>{safeText}</p>
	{/if}
</article>
