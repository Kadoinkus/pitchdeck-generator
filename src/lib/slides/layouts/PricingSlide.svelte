<script lang="ts">
	import { getTargetField } from '../core/fields.ts';
	import Frame from '../core/Frame.svelte';
	import { ensureItems } from '../core/utils.ts';
	import PricingCardPanel from '../panels/PricingCardPanel.svelte';
	import TitlePanel from '../panels/TitlePanel.svelte';
	import type { SlideData, ThemeData } from '../types.ts';

	let { slide, theme }: { slide: SlideData; theme: ThemeData } = $props();

	const target = $derived(getTargetField(slide));
	const tiers = $derived(
		ensureItems(slide.packages, [
			{
				name: 'Basic - Chat',
				price: 'EUR 2.600,-',
				description:
					'3D mascot template;Template rig;Emotion based and gamified',
			},
			{
				name: 'Premium - Chat',
				price: 'EUR 24.000,-',
				description:
					'Custom designed mascot;40+ animations;Advanced LLM integration',
			},
			{
				name: 'Pro - Chat & Voice',
				price: 'EUR 38.000,-',
				description: 'Voice support;Advanced analytics;Pro media package',
			},
		]).slice(0, 3),
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout">
		<TitlePanel
			kicker="Flexible Solutions"
			title="Pricing That Fits Your Vision"
			accentPhrase="Your Vision"
			{target}
			align="center"
			variant="transparent"
		/>
		<div
			class="grid-3 pricing-grid"
			data-ai-target={target}
			data-ai-label="{slide.title} pricing"
		>
			{#each tiers as tier, i (i)}
				<PricingCardPanel {tier} index={i} titleTarget={target} />
			{/each}
		</div>
	</div>
</Frame>
