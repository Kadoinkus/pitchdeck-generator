<script lang="ts">
	/**
	 * Image slot: shows an uploaded image or a placeholder.
	 * Replaces `renderImageSlot()` from components.ts.
	 */
	import type { ImageRatio } from '$lib/deck/types.ts';
	import { findAssetForSlide, fitText } from './utils.ts';
	import type { DeckData, SlideData } from './utils.ts';

	interface ImageSlotProps {
		slide?: SlideData | null;
		deckData?: DeckData | null;
		target?: string;
		label?: string;
		helper?: string;
		ratio?: ImageRatio;
		className?: string;
		hideTitle?: boolean;
		hideHint?: boolean;
		forceVisible?: boolean;
	}

	const FALLBACK_RATIO: ImageRatio = { w: 4, h: 3 };

	let {
		slide = null,
		deckData = null,
		target = 'imagePrompts',
		label = 'Slide image',
		helper = 'Add image',
		ratio = FALLBACK_RATIO,
		className = '',
		hideTitle = false,
		hideHint = false,
		forceVisible = false,
	}: ImageSlotProps = $props();

	const isHidden = $derived(Boolean(slide?.hideImages));
	const asset = $derived(findAssetForSlide(slide, deckData));
	const activeRatio = $derived(slide?.imageRatio ?? ratio);
	const ratioClass = $derived(`ratio-${activeRatio.w}-${activeRatio.h}`);
	const modeClass = $derived(
		(slide?.imageMode || 'cover') === 'contain' ? 'mode-contain' : 'mode-cover',
	);
	const cls = $derived(`${ratioClass} ${modeClass} ${className}`.trim());
	const safeHelper = $derived(fitText(helper, 80));
</script>

{#if !(isHidden && !forceVisible)}
	{#if asset?.dataUrl}
		<figure
			class="image-slot {cls} ai-clickable"
			data-ai-target={target}
			data-ai-label={label}
		>
			<div class="image-frame has-image">
				<img
					src={asset.dataUrl}
					alt={asset.name || 'Character reference image'}
					loading="lazy"
				>
			</div>
		</figure>
	{:else}
		<figure
			class="image-slot {cls} ai-clickable"
			data-ai-target={target}
			data-ai-label={label}
		>
			<div class="image-frame">
				<span class="image-icon">🖼</span>
				{#if !hideTitle}
					<p class="image-title">Missing image</p>
				{/if}
				{#if !hideHint}
					<p class="image-hint">{safeHelper}</p>
				{/if}
			</div>
		</figure>
	{/if}
{/if}
