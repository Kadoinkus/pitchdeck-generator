<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems, findAssetForSlide, fitList, fitText } from '$lib/slides/core/utils';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const traits = $derived(
		fitList(
			ensureItems(slide.personality, [
				'Friendly and clear',
				'Emotion-aware',
				'Brand-consistent',
				'Conversion-focused',
			]),
			5,
			72,
		),
	);
	const tone = $derived(
		ensureItems(slide.toneSliders, [
			{ label: 'Friendly', value: 86 },
			{ label: 'Professional', value: 76 },
			{ label: 'Playful', value: 68 },
			{ label: 'Direct', value: 82 },
		]).slice(0, 4),
	);
	const hasVisual = $derived(
		Boolean(findAssetForSlide(slide, deckData)?.dataUrl) && !slide.hideImages,
	);
	const layoutClass = $derived(
		hasVisual ? 'split-layout buddy-layout' : 'stack-layout buddy-layout',
	);
	const mascotName = $derived(
		slide.mascotName || deckData?.project?.mascotName || 'Your Mascot',
	);
	const safeDescription = $derived(fitText(slide.description || '', 210));
</script>

<Frame {slide} {theme}>
	<div class={layoutClass}>
		<article class="text-surface text-panel">
			<TitlePanel
				kicker="Meet The Digital Buddy"
				title="Meet {mascotName}"
				accentPhrase={slide.mascotName || deckData?.project?.mascotName || ''}
				{target}
				compact
				asPanel={false}
				variant="transparent"
			/>
			<p
				class="paragraph"
				data-ai-target={target}
				data-ai-label="{slide.title} description"
			>
				{safeDescription}
			</p>
			<ul
				class="bullet-list"
				data-ai-target="buddyPersonality"
				data-ai-label="{slide.title} traits"
			>
				{#each traits as trait, i (i)}
					<li>{trait}</li>
				{/each}
			</ul>
			<div
				class="tone-list"
				data-ai-target="toneSliders"
				data-ai-label="{slide.title} tone"
			>
				{#each tone as item, i (item.label ?? i)}
					<div class="tone-row">
						<span>{item.label || ''}</span>
						<div class="tone-track">
							<i style:width="{Math.max(10, Math.min(100, Number(item.value) || 70))}%"></i>
						</div>
					</div>
				{/each}
			</div>
		</article>
		{#if hasVisual}
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="Buddy image"
				helper="Large mascot render with expressions"
				ratio={RATIO_4_3}
				className="is-large"
			/>
		{/if}
	</div>
</Frame>
