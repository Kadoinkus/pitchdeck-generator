<script lang="ts">
	import { RATIO_1_1 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems, fitText } from '$lib/slides/core/utils';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const sections = $derived(
		ensureItems(slide.sections, [
			{
				title: 'Deployment-ready mascot',
				bullets: [
					'Branded character',
					'Expressive animation',
					'Launch-ready assets',
				],
			},
			{
				title: 'Multichannel access',
				bullets: ['Website widget', 'Mobile support', 'Campaign deployment'],
			},
			{
				title: 'Performance insights',
				bullets: ['Live dashboard', 'Monthly reports', 'Optimization loops'],
			},
			{
				title: 'Brand activation media',
				bullets: ['Social visuals', 'Video snippets', 'Campaign pack'],
			},
		]).slice(0, 4),
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout">
		<TitlePanel
			kicker="What You Get"
			title="Everything Needed To Launch Fast"
			accentPhrase="Launch Fast"
			{target}
			align="center"
			variant="transparent"
		/>
		<div
			class="grid-4 deliverable-grid"
			data-ai-target={target}
			data-ai-label="{slide.title} deliverables"
		>
			{#each sections as section, index (index)}
				<article class="panel deliverable-card">
					<ImageSlot
						{slide}
						{deckData}
						target="imagePrompts"
						label="{slide.title} image {index + 1}"
						helper="{section.title} visual"
						ratio={RATIO_1_1}
						className="is-micro"
						hideTitle
						hideHint
					/>
					<h3>{fitText(section.title || '', 30)}</h3>
					<ul>
						{#each ensureItems(section.bullets, []).slice(0, 3) as bullet (bullet)}
							<li>{fitText(bullet, 48)}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</div>
</Frame>
