<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types.ts';
	import { getTargetField } from '../core/fields.ts';
	import Frame from '../core/Frame.svelte';
	import ImageSlot from '../core/ImageSlot.svelte';
	import { ensureItems, fitList, fitText } from '../core/utils.ts';
	import TitlePanel from '../panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '../types.ts';

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
				'Welcome user',
				'Route intent',
				'Suggest best options',
				'Drive clear CTA',
			]),
			5,
			78,
		),
	);
	const flowSteps = $derived(points.slice(0, 4));
</script>

<Frame {slide} {theme}>
	<div class="split-layout">
		<article
			class="text-surface text-panel"
			data-ai-target={target}
			data-ai-label="{slide.title} narrative"
		>
			<TitlePanel
				kicker="Experience Concept"
				title="How The Assistant Guides The Journey"
				accentPhrase="Guides The Journey"
				{target}
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
		<article class="panel flow-panel">
			<div
				class="flow-list"
				data-ai-target={target}
				data-ai-label="{slide.title} steps"
			>
				{#each flowSteps as step, i (i)}
					<div class="flow-step">
						<span>{i + 1}</span>
						<p>{fitText(step, 56)}</p>
					</div>
				{/each}
			</div>
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="Experience concept image"
				helper="Diagram of mascot across touchpoints"
				ratio={RATIO_4_3}
			/>
		</article>
	</div>
</Frame>
