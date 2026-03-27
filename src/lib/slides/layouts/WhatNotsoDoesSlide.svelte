<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems, fitText } from '$lib/slides/core/utils';
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
	const cards = $derived(
		ensureItems(slide.cards, [
			{
				title: 'Strategy',
				description: 'Voice, role, and emotional behavior.',
			},
			{ title: 'Design', description: 'Mascot and motion direction.' },
			{ title: 'Conversation', description: 'Structured chat logic.' },
			{ title: 'Analytics', description: 'Track and optimize outcomes.' },
		]).slice(0, 4),
	);
	const safeIntro = $derived(fitText(slide.intro || '', 220));
</script>

<Frame {slide} {theme}>
	<div class="split-layout what-layout">
		<article
			class="text-surface text-panel"
			data-ai-target="whatNotsoIntro"
			data-ai-label="{slide.title} intro"
		>
			<TitlePanel
				kicker="What We Do"
				title="AI-powered Character Experiences"
				accentPhrase="Character Experiences"
				{target}
				compact
				asPanel={false}
				variant="transparent"
			/>
			<p class="paragraph">{safeIntro}</p>
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="What Notso does image"
				helper="Mascot capability overview visual"
				ratio={RATIO_4_3}
			/>
		</article>
		<div
			class="grid-2x2"
			data-ai-target={target}
			data-ai-label="{slide.title} cards"
		>
			{#each cards as card, i (i)}
				<IconFeaturePanel
					slideType={slide.type}
					sectionKey="cards"
					panelCount={cards.length}
					{target}
					label="{card.title || 'Card'} panel"
					title={card.title || ''}
					text={card.description || ''}
					maxTitleChars={26}
					maxTextChars={92}
				/>
			{/each}
		</div>
	</div>
</Frame>
