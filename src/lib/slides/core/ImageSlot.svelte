<script lang="ts">
	/**
	 * Image slot: shows an uploaded image or a placeholder.
	 * Replaces `renderImageSlot()` from components.ts.
	 */
	import type { ImageRatio } from '$lib/deck/types';
	import { findAssetForSlide, fitText } from '$lib/slides/core/utils';
	import type { DeckData, SlideData } from '$lib/slides/core/utils';

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

<style>
	.image-slot {
		margin: 0;
		min-width: 0;
		min-height: 0;
		display: grid;
		place-items: center;
		border-radius: 1.1cqi;
		overflow: hidden;
		container-type: size;
		pointer-events: none;
	}

	.image-frame {
		pointer-events: auto;
	}

	:global(.split-layout) .image-slot,
	:global(.cover-layout) .image-slot,
	:global(.closing-layout) .image-slot {
		height: 100%;
	}

	:global(.stack-layout) > .image-slot {
		justify-self: center;
		max-height: 100%;
	}

	:global(.split-layout) .image-frame,
	:global(.cover-layout) .image-frame,
	:global(.closing-layout) .image-frame {
		width: 100%;
		height: 100%;
		max-height: 100%;
		aspect-ratio: auto;
	}

	.image-frame {
		border: 1px dashed color-mix(in srgb, var(--deck-accent, #30d89e) 36%, var(--line));
		border-radius: 1.1cqi;
		background: color-mix(in srgb, var(--surface-soft) 84%, #ffffff);
		display: grid;
		place-items: center;
		align-content: center;
		text-align: center;
		padding: 10px;
		overflow: hidden;
	}

	:global(.mode-dark) .image-frame {
		background: rgba(255, 255, 255, 0.08);
	}

	.image-frame.has-image {
		border-style: solid;
		background: rgba(255, 255, 255, 0.06);
		padding: 0;
	}

	.image-frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.image-slot.mode-cover .image-frame img {
		object-fit: cover;
	}

	.image-slot.mode-contain .image-frame img {
		object-fit: contain;
		background: color-mix(in srgb, var(--surface-soft) 74%, #ffffff);
	}

	.image-icon {
		font-size: 18px;
	}

	.image-title {
		margin: 2px 0 0;
		font-size: 12px;
		font-weight: 700;
	}

	.image-hint {
		margin: 2px 0 0;
		font-size: 11px;
		line-height: 1.25;
		color: var(--muted);
	}

	/* Contain behavior: fill available space while maintaining aspect ratio */
	.image-slot.ratio-16-9 .image-frame {
		aspect-ratio: 16 / 9;
		width: min(100cqi, calc(100cqb * 16 / 9));
		height: auto;
	}

	.image-slot.ratio-4-3 .image-frame {
		aspect-ratio: 4 / 3;
		width: min(100cqi, calc(100cqb * 4 / 3));
		height: auto;
	}

	.image-slot.ratio-3-4 .image-frame {
		aspect-ratio: 3 / 4;
		width: min(100cqi, calc(100cqb * 3 / 4));
		height: auto;
	}

	.image-slot.ratio-1-1 .image-frame {
		aspect-ratio: 1 / 1;
		width: min(100cqi, 100cqb);
		height: auto;
	}

	.image-slot.is-large .image-frame {
		min-height: 0;
	}

	.image-slot.is-micro .image-frame {
		min-height: 84px;
	}

	.image-slot.is-micro .image-icon {
		font-size: 15px;
	}
</style>
