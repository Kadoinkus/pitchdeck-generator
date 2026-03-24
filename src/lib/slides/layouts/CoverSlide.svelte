<script lang="ts">
	import { RATIO_16_9 } from '$lib/deck/types.ts';
	import Frame from '../core/Frame.svelte';
	import ImageSlot from '../core/ImageSlot.svelte';
	import { findAssetForSlide, fitText } from '../core/utils.ts';
	import TitlePanel from '../panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '../types.ts';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const project = $derived(deckData?.project || {});
	const mascot = $derived(slide.mascotName || project.mascotName || 'Buddy');
	const hasVisual = $derived(
		Boolean(findAssetForSlide(slide, deckData)?.dataUrl) || !slide.hideImages,
	);
	const layoutClass = $derived(
		hasVisual ? 'cover-layout' : 'stack-layout cover-layout',
	);
	const safeTitle = $derived(
		fitText(slide.title || project.projectTitle || 'AI Mascot Proposal', 52),
	);
	const safeSubtitle = $derived(
		fitText(slide.oneLiner || project.coverOneLiner || '', 140),
	);
	const safeDate = $derived(
		fitText(slide.proposalDate || project.proposalDate || '', 28),
	);
	const safeClient = $derived(fitText(project.clientName || 'Client', 32));
	const safeUrl = $derived(fitText(project.clientUrl || '', 58));
</script>

<Frame {slide} {theme}>
	<div class={layoutClass}>
		<div class="cover-copy">
			<TitlePanel
				kicker="Notso AI Proposal"
				title={safeTitle}
				accentPhrase={mascot}
				subtitle={safeSubtitle}
				target="projectTitle"
				align="left"
				variant="transparent"
			/>
			<div class="meta-pills">
				<span
					class="ai-clickable"
					data-ai-target="proposalDate"
					data-ai-label="Proposal date"
				>{safeDate}</span>
				<span
					class="ai-clickable"
					data-ai-target="clientName"
					data-ai-label="Client name"
				>For {safeClient}</span>
			</div>
			<p
				class="meta-url ai-clickable"
				data-ai-target="clientUrl"
				data-ai-label="Client URL"
			>
				{safeUrl}
			</p>
		</div>
		{#if hasVisual}
			<div class="cover-visual">
				<ImageSlot
					{slide}
					{deckData}
					target="imagePrompts"
					label="Cover image"
					helper="Hero mascot and product UI mockup"
					ratio={RATIO_16_9}
					className="is-large"
				/>
			</div>
		{/if}
	</div>
</Frame>
