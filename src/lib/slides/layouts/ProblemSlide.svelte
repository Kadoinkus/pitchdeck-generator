<script lang="ts">
	import { RATIO_16_9 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems, findAssetForSlide, fitList } from '$lib/slides/core/utils';
	import IconFeaturePanel from '$lib/slides/panels/IconFeaturePanel.svelte';
	import SummaryPanel from '$lib/slides/panels/SummaryPanel.svelte';
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
				'Users do not get instant answers.',
				'Support repeats the same work.',
				'Automation feels generic.',
			]),
			4,
			90,
		),
	);
	const pointCards = $derived(points.slice(0, 3));
	const hasVisual = $derived(
		Boolean(findAssetForSlide(slide, deckData)?.dataUrl) || !slide.hideImages,
	);
	const bottomLayoutClass = $derived(
		hasVisual ? 'split-layout' : 'stack-layout',
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout">
		<TitlePanel
			kicker="Client Situation"
			title="What Is Blocking Growth Today"
			accentPhrase="Blocking Growth"
			{target}
			align="center"
			variant="transparent"
		/>
		<div
			class="grid-3"
			data-ai-target={target}
			data-ai-label="{slide.title} points"
		>
			{#each pointCards as point, i (i)}
				<IconFeaturePanel
					slideType={slide.type}
					sectionKey="points"
					panelCount={pointCards.length}
					{target}
					label="{slide.title} point {i + 1}"
					index={i}
					title=""
					text={point}
					className="short-card panel-card-with-icon"
					showTitle={false}
					maxTextChars={80}
				/>
			{/each}
		</div>
		<div class={bottomLayoutClass}>
			<SummaryPanel
				{target}
				label="{slide.title} summary"
				title="Core message"
				text={points[0] || ''}
				maxTextChars={120}
			/>
			{#if hasVisual}
				<ImageSlot
					{slide}
					{deckData}
					target="imagePrompts"
					label="Problem image"
					helper="Visualize current friction state"
					ratio={RATIO_16_9}
				/>
			{/if}
		</div>
	</div>
</Frame>
