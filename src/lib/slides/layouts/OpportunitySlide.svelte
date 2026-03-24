<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import {
		ensureItems,
		findAssetForSlide,
		fitList,
	} from '$lib/slides/core/utils';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const points = $derived(
		fitList(
			ensureItems(slide.points, [
				'Turn support into guided conversion.',
				'Increase engagement with mascot interactions.',
				'Scale conversations with premium brand tone.',
			]),
			4,
			86,
		),
	);
	const hasVisual = $derived(
		Boolean(findAssetForSlide(slide, deckData)?.dataUrl) || !slide.hideImages,
	);
	const layoutClass = $derived(
		hasVisual
			? 'split-layout opportunity-layout'
			: 'stack-layout opportunity-layout',
	);
</script>

<Frame {slide} {theme}>
	<div class={layoutClass}>
		<article
			class="text-surface text-panel"
			data-ai-target={target}
			data-ai-label="{slide.title} opportunity text"
		>
			<TitlePanel
				kicker="The Opportunity"
				title="A Better Experience Creates More Conversion"
				accentPhrase="More Conversion"
				{target}
				align="left"
				compact
				asPanel={false}
				variant="transparent"
			/>
			<ul class="bullet-list">
				{#each points as point (point)}
					<li>{point}</li>
				{/each}
			</ul>
		</article>
		{#if hasVisual}
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="Opportunity image"
				helper="Before and after support journey visual"
				ratio={RATIO_4_3}
				className="is-large"
			/>
		{/if}
	</div>
</Frame>
