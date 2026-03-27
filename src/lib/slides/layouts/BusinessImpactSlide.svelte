<script lang="ts">
	import { RATIO_16_9 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems, fitList } from '$lib/slides/core/utils';
	import MetricPanel from '$lib/slides/panels/MetricPanel.svelte';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const impacts = $derived(
		fitList(
			ensureItems(slide.impacts, [
				'Increase conversion',
				'Reduce support load',
				'Boost engagement',
				'Strengthen brand recall',
			]),
			4,
			42,
		),
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout impact-layout">
		<TitlePanel
			kicker="Business Impact"
			title="Results That Drive Revenue"
			accentPhrase="Drive Revenue"
			{target}
			align="center"
			variant="transparent"
		/>
		<div
			class="grid-4"
			data-ai-target={target}
			data-ai-label="{slide.title} impact points"
		>
			{#each impacts as impact, i (i)}
				<MetricPanel
					slideType={slide.type}
					sectionKey="impacts"
					panelCount={impacts.length}
					{target}
					label="{impact} metric"
					value={impact}
				/>
			{/each}
		</div>
		<ImageSlot
			{slide}
			{deckData}
			target="imagePrompts"
			label="Business impact image"
			helper="Impact icons and outcome visual"
			ratio={RATIO_16_9}
		/>
	</div>
</Frame>
