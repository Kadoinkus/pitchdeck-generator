import {
	attrTarget,
	renderHeadline,
	renderImageSlot,
} from "../core/components.js";
import { renderPanelIcon } from "../core/icon-policy.js";
import { iconByKeyword } from "../core/icons.js";
import { esc, fitText, splitFeatureLines } from "../core/utils.js";
import type { DeckData, SlideData } from "../types.js";
import { panelClassName } from "./variants.js";

interface TitlePanelOptions {
	slide?: SlideData;
	target?: string;
	kicker?: string;
	title?: string;
	accentPhrase?: string;
	subtitle?: string;
	align?: string;
	compact?: boolean;
	asPanel?: boolean;
	variant?: string;
	className?: string;
	maxTitleChars?: number;
	maxSubtitleChars?: number;
}

interface ImagePanelOptions {
	slide?: SlideData;
	deckData?: DeckData;
	target?: string;
	label?: string;
	helper?: string;
	ratio?: string;
	className?: string;
	variant?: string;
	hideTitle?: boolean;
	hideHint?: boolean;
	forceVisible?: boolean;
}

interface SummaryPanelOptions {
	target?: string;
	label?: string;
	title?: string;
	text?: string;
	variant?: string;
	className?: string;
	maxTitleChars?: number;
	maxTextChars?: number;
}

interface IconFeaturePanelOptions {
	slideType?: string;
	sectionKey?: string;
	panelCount?: number;
	target?: string;
	label?: string;
	index?: number | null;
	title?: string;
	text?: string;
	variant?: string;
	className?: string;
	showTitle?: boolean;
	showText?: boolean;
	maxTitleChars?: number;
	maxTextChars?: number;
}

interface PricingTier {
	name?: string;
	price?: string;
	description?: string;
}

interface PricingCardPanelOptions {
	tier?: PricingTier;
	index?: number;
	titleTarget?: string;
	variant?: string;
	maxNameChars?: number;
	maxPriceChars?: number;
	maxFeatureChars?: number;
}

interface MetricPanelOptions {
	slideType?: string;
	sectionKey?: string;
	panelCount?: number;
	target?: string;
	label?: string;
	value?: string;
	variant?: string;
	className?: string;
	maxValueChars?: number;
}

export function renderTitlePanel({
	slide,
	target = "global-concept",
	kicker = "",
	title = "",
	accentPhrase = "",
	subtitle = "",
	align = "left",
	compact = false,
	asPanel = true,
	variant = "transparent",
	className = "text-surface",
	maxTitleChars = 58,
	maxSubtitleChars = 140,
}: TitlePanelOptions = {}): string {
	const headline = renderHeadline({
		kicker,
		title,
		accentPhrase,
		subtitle,
		target,
		align,
		compact,
		maxTitleChars,
		maxSubtitleChars,
	});

	if (!asPanel) return headline;
	return `<article class="${panelClassName({ variant, className })}">${headline}</article>`;
}

export function renderImagePanel({
	slide,
	deckData,
	target = "imagePrompts",
	label = "Slide image",
	helper = "Add image",
	ratio = "4:3",
	className = "",
	variant = "",
	hideTitle = false,
	hideHint = false,
	forceVisible = false,
}: ImagePanelOptions = {}): string {
	const content = renderImageSlot({
		slide,
		deckData,
		target,
		label,
		helper,
		ratio,
		className,
		hideTitle,
		hideHint,
		forceVisible,
	});

	if (!variant) return content;
	return `<article class="${panelClassName({ variant })}">${content}</article>`;
}

export function renderSummaryPanel({
	target = "global-concept",
	label = "Summary panel",
	title = "",
	text = "",
	variant = "solid",
	className = "summary-panel",
	maxTitleChars = 32,
	maxTextChars = 130,
}: SummaryPanelOptions = {}): string {
	return `<article class="${panelClassName({ variant, className })}" ${attrTarget(target, label)}>
    <h3>${esc(fitText(title, maxTitleChars))}</h3>
    <p>${esc(fitText(text, maxTextChars))}</p>
  </article>`;
}

export function renderIconFeaturePanel({
	slideType = "",
	sectionKey = "",
	panelCount = 0,
	target = "global-concept",
	label = "Feature panel",
	index = null,
	title = "",
	text = "",
	variant = "solid",
	className = "feature-card panel-card-with-icon",
	showTitle = true,
	showText = true,
	maxTitleChars = 28,
	maxTextChars = 92,
}: IconFeaturePanelOptions = {}): string {
	const iconName = iconByKeyword(`${title} ${text}`);
	const indexMarkup = Number.isFinite(index)
		? `<span class="card-index">${String((index ?? 0) + 1).padStart(2, "0")}</span>`
		: "";

	return `<article class="${panelClassName({ variant, className })}" ${attrTarget(target, label)}>
    ${indexMarkup}
    ${renderPanelIcon({
			slideType,
			sectionKey,
			panelCount,
			iconName,
			label: `${title || "Feature"} icon`,
		})}
    ${showTitle ? `<h3>${esc(fitText(title, maxTitleChars))}</h3>` : ""}
    ${showText ? `<p>${esc(fitText(text, maxTextChars))}</p>` : ""}
  </article>`;
}

export function renderPricingCardPanel({
	tier = {},
	index = 0,
	titleTarget = "pricing",
	variant = "solid",
	maxNameChars = 26,
	maxPriceChars = 24,
	maxFeatureChars = 44,
}: PricingCardPanelOptions = {}): string {
	const classNames = [
		panelClassName({ variant, className: "pricing-card" }),
		index === 1 ? "is-featured" : "",
		index === 2 ? "is-dark" : "",
	]
		.filter(Boolean)
		.join(" ");

	return `<article class="${classNames}" ${attrTarget(titleTarget, `${tier.name || "Tier"} pricing card`)}>
    <h3>${esc(fitText(tier.name || "", maxNameChars))}</h3>
    <p class="price">${esc(fitText(tier.price || "", maxPriceChars))}</p>
    <ul>
      ${splitFeatureLines(tier.description, 5)
				.map((line) => `<li>${esc(fitText(line, maxFeatureChars))}</li>`)
				.join("")}
    </ul>
  </article>`;
}

export function renderMetricPanel({
	slideType = "",
	sectionKey = "",
	panelCount = 0,
	target = "global-concept",
	label = "Metric panel",
	value = "",
	variant = "solid",
	className = "impact-card panel-card-with-icon",
	maxValueChars = 42,
}: MetricPanelOptions = {}): string {
	const iconName = iconByKeyword(String(value || ""));

	return `<article class="${panelClassName({ variant, className })}" ${attrTarget(target, label)}>
    ${renderPanelIcon({
			slideType,
			sectionKey,
			panelCount,
			iconName,
			label: `${value || "Metric"} icon`,
		})}
    <p>${esc(fitText(value, maxValueChars))}</p>
  </article>`;
}
