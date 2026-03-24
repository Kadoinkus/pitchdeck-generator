<script lang="ts">
	import { RATIO_16_9 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems } from '$lib/slides/core/utils';
	import IconFeaturePanel from '$lib/slides/panels/IconFeaturePanel.svelte';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const phases = $derived(
		ensureItems(slide.phases, [
			{ title: 'Month 1', description: 'Discovery and concept alignment.' },
			{
				title: 'Month 2',
				description: 'Design production and flow implementation.',
			},
			{
				title: 'Month 3',
				description: 'Integration, launch, and optimization.',
			},
		]).slice(0, 4),
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout">
		<TitlePanel
			kicker="Implementation Timeline"
			title="A Clear Path To Launch"
			accentPhrase="To Launch"
			{target}
			align="center"
			variant="transparent"
		/>
		<div
			class="grid-3 timeline-grid"
			data-ai-target={target}
			data-ai-label="{slide.title} phases"
		>
			{#each phases as phase, i (i)}
				<IconFeaturePanel
					slideType={slide.type}
					sectionKey="phases"
					panelCount={phases.length}
					{target}
					label="{phase.title || 'Phase'} card"
					index={i}
					title={phase.title || ''}
					text={phase.description || ''}
					className="timeline-card panel-card-with-icon"
					maxTitleChars={20}
					maxTextChars={72}
				/>
			{/each}
		</div>
		<ImageSlot
			{slide}
			{deckData}
			target="imagePrompts"
			label="Timeline visual"
			helper="Roadmap flow and milestone markers"
			ratio={RATIO_16_9}
		/>
	</div>
</Frame>
