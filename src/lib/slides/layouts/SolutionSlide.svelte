<script lang="ts">
	import { RATIO_16_9 } from '$lib/deck/types.ts';
	import { getTargetField } from '../core/fields.ts';
	import Frame from '../core/Frame.svelte';
	import ImageSlot from '../core/ImageSlot.svelte';
	import { ensureItems } from '../core/utils.ts';
	import IconFeaturePanel from '../panels/IconFeaturePanel.svelte';
	import TitlePanel from '../panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '../types.ts';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const pillars = $derived(
		ensureItems(slide.pillars, [
			{ title: 'Character', description: 'A recognizable mascot personality.' },
			{ title: 'AI', description: 'Context-aware routing and responses.' },
			{
				title: 'Interaction',
				description: 'Clear flows that guide next action.',
			},
		]).slice(0, 3),
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout">
		<TitlePanel
			kicker="The Solution"
			title="Character + AI + Interaction"
			accentPhrase="AI"
			{target}
			align="center"
			variant="transparent"
		/>
		<div
			class="grid-3"
			data-ai-target={target}
			data-ai-label="{slide.title} pillars"
		>
			{#each pillars as pillar (pillar)}
				<IconFeaturePanel
					slideType={slide.type}
					sectionKey="pillars"
					panelCount={pillars.length}
					{target}
					label="{pillar.title || 'Pillar'} panel"
					title={pillar.title || ''}
					text={pillar.description || ''}
					maxTitleChars={24}
					maxTextChars={86}
				/>
			{/each}
		</div>
		<ImageSlot
			{slide}
			{deckData}
			target="imagePrompts"
			label="Solution visual"
			helper="Simple pillar architecture visual"
			ratio={RATIO_16_9}
		/>
	</div>
</Frame>
