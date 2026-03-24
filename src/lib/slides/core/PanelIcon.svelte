<script lang="ts">
	/**
	 * Conditionally renders a hero-sized icon in a panel.
	 * Replaces `renderPanelIcon()` from icon-policy.ts.
	 */
	import { shouldUsePanelIcons } from '$lib/slides/core/icon-policy';
	import Icon from '$lib/slides/core/Icon.svelte';

	interface PanelIconProps {
		slideType?: string;
		sectionKey?: string;
		panelCount?: number;
		iconName?: string;
		label?: string;
	}

	let {
		slideType = '',
		sectionKey = '',
		panelCount = 0,
		iconName = 'sparkles',
		label = '',
	}: PanelIconProps = $props();

	const show = $derived(
		shouldUsePanelIcons({ slideType, sectionKey, panelCount }),
	);
</script>

{#if show}
	<div class="panel-hero-icon">
		<Icon name={iconName} size="xl" className="icon-panel" {label} />
	</div>
{/if}
