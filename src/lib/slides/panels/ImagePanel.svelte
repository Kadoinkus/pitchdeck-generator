<script lang="ts">
	/**
	 * Image panel: image slot optionally wrapped in a panel article.
	 * Replaces `renderImagePanel()` from presets.ts.
	 */
	import type { ImageRatio } from '$lib/deck/types.ts';
	import { RATIO_4_3 } from '$lib/deck/types.ts';
	import ImageSlot from '../core/ImageSlot.svelte';
	import type { DeckData, SlideData } from '../types.ts';
	import { panelClassName } from './variants.ts';

	interface ImagePanelProps {
		slide?: SlideData | null;
		deckData?: DeckData | null;
		target?: string;
		label?: string;
		helper?: string;
		ratio?: ImageRatio;
		className?: string;
		variant?: string;
		hideTitle?: boolean;
		hideHint?: boolean;
		forceVisible?: boolean;
	}

	let {
		slide = null,
		deckData = null,
		target = 'imagePrompts',
		label = 'Slide image',
		helper = 'Add image',
		ratio = RATIO_4_3,
		className = '',
		variant = '',
		hideTitle = false,
		hideHint = false,
		forceVisible = false,
	}: ImagePanelProps = $props();

	const isHidden = $derived(Boolean(slide?.hideImages) && !forceVisible);
	const cls = $derived(panelClassName({ variant }));
</script>

{#if !isHidden}
	{#if variant}
		<article class={cls}>
			<ImageSlot
				{slide}
				{deckData}
				{target}
				{label}
				{helper}
				{ratio}
				{className}
				{hideTitle}
				{hideHint}
				{forceVisible}
			/>
		</article>
	{:else}
		<ImageSlot
			{slide}
			{deckData}
			{target}
			{label}
			{helper}
			{ratio}
			{className}
			{hideTitle}
			{hideHint}
			{forceVisible}
		/>
	{/if}
{/if}
