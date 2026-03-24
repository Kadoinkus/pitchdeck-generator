<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types.ts';
	import { getTargetField } from '../core/fields.ts';
	import Frame from '../core/Frame.svelte';
	import ImageSlot from '../core/ImageSlot.svelte';
	import {
		ensureItems,
		findAssetForSlide,
		fitList,
		fitText,
	} from '../core/utils.ts';
	import TitlePanel from '../panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '../types.ts';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const bullets = $derived(
		fitList(
			ensureItems(slide.bullets, [
				'Live dashboard',
				'Top questions and trends',
				'Conversation analytics',
			]),
			6,
			72,
		),
	);
	const hasVisual = $derived(
		Boolean(findAssetForSlide(slide, deckData)?.dataUrl) || !slide.hideImages,
	);
	const layoutClass = $derived(hasVisual ? 'split-layout' : 'stack-layout');
	const safeDescription = $derived(fitText(slide.description || '', 220));
</script>

<Frame {slide} {theme}>
	<div class={layoutClass}>
		<article class="text-surface text-panel">
			<TitlePanel
				kicker="Data & Analytics"
				title="Insights That Matter"
				accentPhrase="Matter"
				{target}
				compact
				asPanel={false}
				variant="transparent"
			/>
			<p
				class="paragraph"
				data-ai-target="analyticsDescription"
				data-ai-label="{slide.title} description"
			>
				{safeDescription}
			</p>
			<ul
				class="bullet-list"
				data-ai-target={target}
				data-ai-label="{slide.title} bullets"
			>
				{#each bullets as bullet (bullet)}
					<li>{bullet}</li>
				{/each}
			</ul>
		</article>
		{#if hasVisual}
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="Analytics image"
				helper="Dashboard with charts and KPIs"
				ratio={RATIO_4_3}
				className="is-large"
			/>
		{/if}
	</div>
</Frame>
