import { RATIO_4_3 } from '../deck/types.ts';
import type { SlotPolicy } from './core/slot-policy.ts';
import { resolveImageMode, resolveSlotPolicy } from './core/slot-policy.ts';
import { resolveTheme, themeVars } from './core/theme.ts';
import { esc } from './core/utils.ts';
import { renderBusinessImpact } from './layouts/business-impact.ts';
import { renderChatFlow } from './layouts/chat-flow.ts';
import { renderClosing } from './layouts/closing.ts';
import { renderCover } from './layouts/cover.ts';
import { renderDataAnalytics } from './layouts/data-analytics.ts';
import { renderExampleInteraction } from './layouts/example-interaction.ts';
import { renderExperienceConcept } from './layouts/experience-concept.ts';
import { renderMeetBuddy } from './layouts/meet-buddy.ts';
import { renderOpportunity } from './layouts/opportunity.ts';
import { renderPricing } from './layouts/pricing.ts';
import { renderProblem } from './layouts/problem.ts';
import { renderSolution } from './layouts/solution.ts';
import { renderTimeline } from './layouts/timeline.ts';
import { renderWhatNotsoDoes } from './layouts/what-notso-does.ts';
import { renderWhatYouGet } from './layouts/what-you-get.ts';
import type { DeckData, SlideData, ThemeData } from './types.ts';

type SlideRenderer = (
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
) => string;

const RENDERERS: Record<string, SlideRenderer> = {
	cover: renderCover,
	problem: renderProblem,
	opportunity: renderOpportunity,
	solution: renderSolution,
	'what-notso-does': renderWhatNotsoDoes,
	'meet-buddy': renderMeetBuddy,
	'experience-concept': renderExperienceConcept,
	'chat-flow': renderChatFlow,
	'example-interaction': renderExampleInteraction,
	'business-impact': renderBusinessImpact,
	'data-analytics': renderDataAnalytics,
	'what-you-get': renderWhatYouGet,
	pricing: renderPricing,
	timeline: renderTimeline,
	closing: renderClosing,
};

function toRecord(
	obj: ThemeData | undefined,
): Record<string, unknown> | undefined {
	if (obj === undefined) return undefined;
	const rec: Record<string, unknown> = { ...obj };
	return rec;
}

function isSlotPolicyLike(value: unknown): value is Partial<SlotPolicy> {
	return typeof value === 'object' && value !== null;
}

function toSlotPolicyOverride(value: unknown): Partial<SlotPolicy> | null {
	if (isSlotPolicyLike(value)) {
		return value;
	}
	return null;
}

export function renderSlide(
	slide: SlideData | null | undefined,
	theme: ThemeData | undefined,
	deckData: DeckData | undefined,
): string {
	const resolvedTheme = resolveTheme(toRecord(theme), deckData);
	const slotPolicy = resolveSlotPolicy(
		slide?.type,
		toSlotPolicyOverride(slide?.slotPolicy),
	);
	const imageRatio = slide?.imageRatio ?? RATIO_4_3;
	const rawHide = Boolean(slide?.hideImages);
	const hideImages = slotPolicy.image.required ? false : rawHide;
	const imageMode = resolveImageMode(
		slide ?? undefined,
		slide?.imageMode || slotPolicy.image.defaultMode,
	);
	const textMode = slotPolicy.text.mode === 'clamp' ? 'clamp' : slide?.textMode || 'fit';
	const slideForRender: SlideData | null | undefined = slide
		? {
			...slide,
			slotPolicy,
			imageRatio,
			hideImages,
			imageMode,
			textMode,
		}
		: slide;
	const renderer = RENDERERS[slideForRender?.type ?? ''];

	if (renderer && slideForRender) {
		return renderer(slideForRender, resolvedTheme, deckData ?? {});
	}

	return `<article class="slide-render deck-slide mode-light" style="${
		themeVars(resolvedTheme)
	}"><section class="deck-content"><p>Unknown slide type: ${
		esc(slideForRender?.type || 'n/a')
	}</p></section></article>`;
}
