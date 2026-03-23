// @ts-nocheck
import { attrTarget, renderFrame } from "../core/components.js";
import { getTargetField } from "../core/fields.js";
import { ensureItems } from "../core/utils.js";
import { renderPricingCardPanel, renderTitlePanel } from "../panels/index.js";

export function renderPricing(slide, theme, _deckData) {
	const target = getTargetField(slide);
	const tiers = ensureItems(slide.packages, [
		{
			name: "Basic - Chat",
			price: "EUR 2.600,-",
			description: "3D mascot template;Template rig;Emotion based and gamified",
		},
		{
			name: "Premium - Chat",
			price: "EUR 24.000,-",
			description:
				"Custom designed mascot;40+ animations;Advanced LLM integration",
		},
		{
			name: "Pro - Chat & Voice",
			price: "EUR 38.000,-",
			description: "Voice support;Advanced analytics;Pro media package",
		},
	]).slice(0, 3);

	const body = `<div class="stack-layout">
    ${renderTitlePanel({
			slide,
			kicker: "Flexible Solutions",
			title: "Pricing That Fits Your Vision",
			accentPhrase: "Your Vision",
			target,
			align: "center",
			variant: "transparent",
		})}
    <div class="grid-3 pricing-grid" ${attrTarget(target, `${slide.title} pricing`)}>
      ${tiers.map((tier, i) => renderPricingCardPanel({ tier, index: i, titleTarget: target })).join("")}
    </div>
  </div>`;

	return renderFrame({ slide, theme, body });
}

