<script lang="ts">
	/**
	 * Dispatcher: picks the correct layout component based on slide.type.
	 */
	import { RATIO_4_3 } from '$lib/deck/types';
	import Frame from '$lib/slides/core/Frame.svelte';
	import { resolveImageMode, resolveSlotPolicy } from '$lib/slides/core/slot-policy';
	import { resolveTheme } from '$lib/slides/core/theme';
	import BusinessImpactSlide from '$lib/slides/layouts/BusinessImpactSlide.svelte';
	import ChatFlowSlide from '$lib/slides/layouts/ChatFlowSlide.svelte';
	import ClosingSlide from '$lib/slides/layouts/ClosingSlide.svelte';
	import CoverSlide from '$lib/slides/layouts/CoverSlide.svelte';
	import DataAnalyticsSlide from '$lib/slides/layouts/DataAnalyticsSlide.svelte';
	import ExampleInteractionSlide from '$lib/slides/layouts/ExampleInteractionSlide.svelte';
	import ExperienceConceptSlide from '$lib/slides/layouts/ExperienceConceptSlide.svelte';
	import MeetBuddySlide from '$lib/slides/layouts/MeetBuddySlide.svelte';
	import OpportunitySlide from '$lib/slides/layouts/OpportunitySlide.svelte';
	import PricingSlide from '$lib/slides/layouts/PricingSlide.svelte';
	import ProblemSlide from '$lib/slides/layouts/ProblemSlide.svelte';
	import SolutionSlide from '$lib/slides/layouts/SolutionSlide.svelte';
	import TimelineSlide from '$lib/slides/layouts/TimelineSlide.svelte';
	import WhatNotsoDoesSlide from '$lib/slides/layouts/WhatNotsoDoesSlide.svelte';
	import WhatYouGetSlide from '$lib/slides/layouts/WhatYouGetSlide.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	type LayoutComponent = typeof CoverSlide;

	const LAYOUTS: Record<string, LayoutComponent> = {
		cover: CoverSlide,
		problem: ProblemSlide,
		opportunity: OpportunitySlide,
		solution: SolutionSlide,
		'what-notso-does': WhatNotsoDoesSlide,
		'meet-buddy': MeetBuddySlide,
		'experience-concept': ExperienceConceptSlide,
		'chat-flow': ChatFlowSlide,
		'example-interaction': ExampleInteractionSlide,
		'business-impact': BusinessImpactSlide,
		'data-analytics': DataAnalyticsSlide,
		'what-you-get': WhatYouGetSlide,
		pricing: PricingSlide,
		timeline: TimelineSlide,
		closing: ClosingSlide,
	};

	interface Props {
		slide?: SlideData | null;
		theme?: ThemeData;
		deckData?: DeckData | null;
	}

	let { slide = undefined, theme = undefined, deckData = undefined }: Props = $props();

	const resolvedTheme = $derived(resolveTheme(theme, deckData));

	const normalised: SlideData | null = $derived.by(() => {
		if (!slide) return null;

		const slotPolicy = resolveSlotPolicy(slide.type, slide.slotPolicy);
		const imageRatio = slide.imageRatio ?? RATIO_4_3;
		const rawHide = Boolean(slide.hideImages);
		const hideImages = slotPolicy.image.required ? false : rawHide;
		const imageMode = resolveImageMode(
			slide,
			slide.imageMode || slotPolicy.image.defaultMode,
		);
		const textMode = slotPolicy.text.mode === 'clamp'
			? 'clamp'
			: slide.textMode || 'fit';

		return {
			...slide,
			slotPolicy,
			imageRatio,
			hideImages,
			imageMode,
			textMode,
		};
	});

	const Layout = $derived(LAYOUTS[normalised?.type ?? '']);
</script>

{#if Layout && normalised && deckData}
	<Layout slide={normalised} theme={resolvedTheme} {deckData} />
{:else}
	<Frame slide={normalised} theme={resolvedTheme}>
		<p>
			{#if !normalised}Unable to render slide.{:else}Unknown slide type: {normalised.type}{/if}
		</p>
	</Frame>
{/if}
