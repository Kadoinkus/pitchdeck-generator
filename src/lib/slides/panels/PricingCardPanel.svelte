<script lang="ts">
	/**
	 * Pricing tier card with name, price, and feature list.
	 * Replaces `renderPricingCardPanel()` from presets.ts.
	 */
	import { fitText, splitFeatureLines } from '$lib/slides/core/utils';
	import { panelClassName } from '$lib/slides/panels/variants';

	interface PricingTier {
		name?: string;
		price?: string;
		description?: string;
	}

	interface PricingCardPanelProps {
		tier?: PricingTier;
		index?: number;
		titleTarget?: string;
		variant?: string;
		maxNameChars?: number;
		maxPriceChars?: number;
		maxFeatureChars?: number;
	}

	let {
		tier = {},
		index = 0,
		titleTarget = 'pricing',
		variant = 'solid',
		maxNameChars = 26,
		maxPriceChars = 24,
		maxFeatureChars = 44,
	}: PricingCardPanelProps = $props();

	const baseCls = $derived(
		panelClassName({ variant, className: 'pricing-card' }),
	);
	const featuredCls = $derived(index === 1 ? 'is-featured' : '');
	const darkCls = $derived(index === 2 ? 'is-dark' : '');
	const cls = $derived(
		[baseCls, featuredCls, darkCls].filter(Boolean).join(' '),
	);
	const features = $derived(splitFeatureLines(tier.description, 5));
	const safeName = $derived(fitText(tier.name || '', maxNameChars));
	const safePrice = $derived(fitText(tier.price || '', maxPriceChars));
</script>

<article
	class={cls}
	data-ai-target={titleTarget}
	data-ai-label="{tier.name || 'Tier'} pricing card"
>
	<div class="pricing-accent"></div>
	{#if index === 1}
		<span class="pricing-badge">Recommended</span>
	{/if}
	<h2>{safeName}</h2>
	<p class="price">{safePrice}</p>
	<ul>
		{#each features as feature (feature)}
			<li>
				<svg
					class="check-icon"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M3.5 8.5L6.5 11.5L12.5 4.5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span>{fitText(feature, maxFeatureChars)}</span>
			</li>
		{/each}
	</ul>
</article>
