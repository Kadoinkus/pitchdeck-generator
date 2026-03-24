<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types.ts';
	import { getTargetField } from '../core/fields.ts';
	import Frame from '../core/Frame.svelte';
	import ImageSlot from '../core/ImageSlot.svelte';
	import { ensureItems, fitText } from '../core/utils.ts';
	import TitlePanel from '../panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '../types.ts';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const team = $derived(
		ensureItems(slide.team, [
			{ title: 'Strategy', description: 'Direction and scope' },
			{ title: 'Conversation', description: 'Flow and quality' },
			{ title: 'Motion', description: 'Character animation' },
			{ title: 'Engineering', description: 'Integration and launch' },
		]).slice(0, 4),
	);
	const mascotName = $derived(
		slide.mascotName || deckData?.project?.mascotName || '',
	);
	const headlineTitle = $derived(
		fitText(
			slide.headline
				|| `Let's Build ${mascotName || 'This Together'}`,
			46,
		),
	);
	const safeText = $derived(fitText(slide.text || '', 220));
	const safeContactName = $derived(fitText(slide.contactName || '', 34));
	const safeContactEmail = $derived(fitText(slide.contactEmail || '', 40));
	const safeContactPhone = $derived(fitText(slide.contactPhone || '', 30));
</script>

<Frame {slide} {theme}>
	<div class="split-layout closing-layout">
		<article class="text-surface text-panel closing-copy">
			<TitlePanel
				kicker="Next Step"
				title={headlineTitle}
				accentPhrase={mascotName}
				subtitle=""
				{target}
				compact
				asPanel={false}
				variant="transparent"
			/>
			<p
				class="paragraph"
				data-ai-target={target}
				data-ai-label="Closing statement"
			>
				{safeText}
			</p>
			<div class="contact-lines">
				<p data-ai-target="contactName" data-ai-label="Contact name">
					{safeContactName}
				</p>
				<p data-ai-target="contactEmail" data-ai-label="Contact email">
					{safeContactEmail}
				</p>
				<p data-ai-target="contactPhone" data-ai-label="Contact phone">
					{safeContactPhone}
				</p>
			</div>
		</article>
		<div class="closing-right">
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="Closing image"
				helper="Hero mascot CTA visual"
				ratio={RATIO_4_3}
				className="is-large"
			/>
			<div
				class="grid-2x2"
				data-ai-target="teamCards"
				data-ai-label="Team cards"
			>
				{#each team as item (item)}
					<article class="panel team-card">
						<h4>{fitText(item.title || '', 22)}</h4>
						<p>{fitText(item.description || '', 52)}</p>
					</article>
				{/each}
			</div>
		</div>
	</div>
</Frame>
