<script lang="ts">
	/**
	 * Metric card with icon and a single value line.
	 * Replaces `renderMetricPanel()` from presets.ts.
	 */
	import { iconByKeyword } from '../core/icons.ts';
	import PanelIcon from '../core/PanelIcon.svelte';
	import { fitText } from '../core/utils.ts';
	import { panelClassName } from './variants.ts';

	interface MetricPanelProps {
		slideType?: string;
		sectionKey?: string;
		panelCount?: number;
		target?: string;
		label?: string;
		value?: string;
		variant?: string;
		className?: string;
		maxValueChars?: number;
	}

	let {
		slideType = '',
		sectionKey = '',
		panelCount = 0,
		target = 'global-concept',
		label = 'Metric panel',
		value = '',
		variant = 'solid',
		className = 'impact-card panel-card-with-icon',
		maxValueChars = 42,
	}: MetricPanelProps = $props();

	const cls = $derived(panelClassName({ variant, className }));
	const iconName = $derived(iconByKeyword(String(value || '')));
	const safeValue = $derived(fitText(value, maxValueChars));
</script>

<article class={cls} data-ai-target={target} data-ai-label={label}>
	<PanelIcon
		{slideType}
		{sectionKey}
		{panelCount}
		{iconName}
		label="{value || 'Metric'} icon"
	/>
	<p>{safeValue}</p>
</article>
