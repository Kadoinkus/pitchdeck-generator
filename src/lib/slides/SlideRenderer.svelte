<script lang="ts">
	/**
	 * Dispatcher: picks the correct layout component based on slide.type.
	 */
	import { setContext } from 'svelte';
	import { RATIO_4_3 } from '../deck/types.ts';
	import Frame from './core/Frame.svelte';
	import { resolveImageMode, resolveSlotPolicy } from './core/slot-policy.ts';
	import { resolveTheme } from './core/theme.ts';
	import BusinessImpactSlide from './layouts/BusinessImpactSlide.svelte';
	import ChatFlowSlide from './layouts/ChatFlowSlide.svelte';
	import ClosingSlide from './layouts/ClosingSlide.svelte';
	import CoverSlide from './layouts/CoverSlide.svelte';
	import DataAnalyticsSlide from './layouts/DataAnalyticsSlide.svelte';
	import ExampleInteractionSlide from './layouts/ExampleInteractionSlide.svelte';
	import ExperienceConceptSlide from './layouts/ExperienceConceptSlide.svelte';
	import MeetBuddySlide from './layouts/MeetBuddySlide.svelte';
	import OpportunitySlide from './layouts/OpportunitySlide.svelte';
	import PricingSlide from './layouts/PricingSlide.svelte';
	import ProblemSlide from './layouts/ProblemSlide.svelte';
	import SolutionSlide from './layouts/SolutionSlide.svelte';
	import TimelineSlide from './layouts/TimelineSlide.svelte';
	import WhatNotsoDoesSlide from './layouts/WhatNotsoDoesSlide.svelte';
	import WhatYouGetSlide from './layouts/WhatYouGetSlide.svelte';
	import type { DeckData, SlideData, ThemeData } from './types.ts';

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
		deckData?: DeckData;
		slideWidth?: number;
	}

	let {
		slide = null,
		theme = undefined,
		deckData = undefined,
		slideWidth,
	}: Props = $props();

	setContext('slideWidth', slideWidth);

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

{#if Layout && normalised}
	<Layout slide={normalised} theme={resolvedTheme} {deckData} />
{:else}
	<Frame slide={normalised} theme={resolvedTheme}>
		<p>Unknown slide type: {normalised?.type || 'n/a'}</p>
	</Frame>
{/if}
