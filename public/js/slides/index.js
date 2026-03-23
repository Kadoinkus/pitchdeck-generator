import { resolveImageMode, resolveSlotPolicy } from "./core/slot-policy.js";
import { resolveTheme, themeVars } from "./core/theme.js";
import { esc } from "./core/utils.js";
import { renderBusinessImpact } from "./layouts/business-impact.js";
import { renderChatFlow } from "./layouts/chat-flow.js";
import { renderClosing } from "./layouts/closing.js";
import { renderCover } from "./layouts/cover.js";
import { renderDataAnalytics } from "./layouts/data-analytics.js";
import { renderExampleInteraction } from "./layouts/example-interaction.js";
import { renderExperienceConcept } from "./layouts/experience-concept.js";
import { renderMeetBuddy } from "./layouts/meet-buddy.js";
import { renderOpportunity } from "./layouts/opportunity.js";
import { renderPricing } from "./layouts/pricing.js";
import { renderProblem } from "./layouts/problem.js";
import { renderSolution } from "./layouts/solution.js";
import { renderTimeline } from "./layouts/timeline.js";
import { renderWhatNotsoDoes } from "./layouts/what-notso-does.js";
import { renderWhatYouGet } from "./layouts/what-you-get.js";

const RENDERERS = {
	cover: renderCover,
	problem: renderProblem,
	opportunity: renderOpportunity,
	solution: renderSolution,
	"what-notso-does": renderWhatNotsoDoes,
	"meet-buddy": renderMeetBuddy,
	"experience-concept": renderExperienceConcept,
	"chat-flow": renderChatFlow,
	"example-interaction": renderExampleInteraction,
	"business-impact": renderBusinessImpact,
	"data-analytics": renderDataAnalytics,
	"what-you-get": renderWhatYouGet,
	pricing: renderPricing,
	timeline: renderTimeline,
	closing: renderClosing,
};

export function renderSlide(slide, theme, deckData) {
	const resolvedTheme = resolveTheme(theme, deckData);
	const slotPolicy = resolveSlotPolicy(slide?.type, slide?.slotPolicy);
	const imageRatio = ["16:9", "4:3", "3:4", "1:1"].includes(slide?.imageRatio)
		? slide.imageRatio
		: "4:3";
	const rawHide = Boolean(slide?.hideImages);
	const hideImages = slotPolicy.image.required ? false : rawHide;
	const imageMode = resolveImageMode(
		slide,
		slide?.imageMode || slotPolicy.image.defaultMode,
	);
	const textMode =
		slotPolicy.text.mode === "clamp" ? "clamp" : slide?.textMode || "fit";
	const slideForRender = slide
		? {
				...slide,
				slotPolicy,
				imageRatio,
				hideImages,
				imageMode,
				textMode,
			}
		: slide;
	const renderer = RENDERERS[slideForRender?.type];

	if (renderer) {
		return renderer(slideForRender, resolvedTheme, deckData);
	}

	return `<article class="slide-render deck-slide mode-light" style="${themeVars(resolvedTheme)}"><section class="deck-content"><p>Unknown slide type: ${esc(slideForRender?.type || "n/a")}</p></section></article>`;
}
