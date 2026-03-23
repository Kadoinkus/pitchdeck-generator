// @ts-nocheck
import { themeVars } from "./theme.js";
import { esc, findAssetForSlide, fitText } from "./utils.js";

export function attrTarget(target, label, className = "ai-clickable") {
	return `class="${className}" data-ai-target="${esc(target)}" data-ai-label="${esc(label)}"`;
}

function highlightTitle(title, accentPhrase) {
	const t = String(title || "");
	const phrase = String(accentPhrase || "").trim();
	if (!phrase) return esc(t);

	const index = t.toLowerCase().indexOf(phrase.toLowerCase());
	if (index < 0) return esc(t);

	const before = esc(t.slice(0, index));
	const hit = esc(t.slice(index, index + phrase.length));
	const after = esc(t.slice(index + phrase.length));
	return `${before}<span class="accent-text">${hit}</span>${after}`;
}

export function renderHeadline({
	kicker = "",
	title = "",
	accentPhrase = "",
	subtitle = "",
	target = "global-concept",
	align = "left",
	compact = false,
	maxTitleChars = 58,
	maxSubtitleChars = 140,
} = {}) {
	const safeKicker = fitText(kicker, 46);
	const safeTitle = fitText(title, maxTitleChars);
	const safeSubtitle = fitText(subtitle, maxSubtitleChars);

	return `<header class="headline-block ${align === "center" ? "is-center" : "is-left"} ${compact ? "is-compact" : ""}">
    ${safeKicker ? `<p class="headline-kicker" ${attrTarget(target, `${safeKicker} kicker`)}>${esc(safeKicker)}</p>` : ""}
    <h1 class="headline-title" ${attrTarget(target, `${safeTitle || "Title"} headline`)}>${highlightTitle(safeTitle, accentPhrase)}</h1>
    ${safeSubtitle ? `<p class="headline-subtitle" ${attrTarget(target, `${safeTitle || "Title"} subtitle`)}>${esc(safeSubtitle)}</p>` : ""}
  </header>`;
}

function ratioClass(ratio = "16:9") {
	if (ratio === "3:4") return "ratio-3-4";
	if (ratio === "1:1") return "ratio-1-1";
	if (ratio === "4:3") return "ratio-4-3";
	return "ratio-16-9";
}

export function renderImageSlot({
	slide,
	deckData,
	target = "imagePrompts",
	label = "Slide image",
	helper = "Add image",
	ratio = "4:3",
	className = "",
	hideTitle = false,
	hideHint = false,
	forceVisible = false,
} = {}) {
	const isHidden = Boolean(slide?.hideImages);
	if (isHidden && !forceVisible) return "";

	const asset = findAssetForSlide(slide, deckData);
	const activeRatio = slide?.imageRatio || ratio;
	const modeClass =
		(slide?.imageMode || "cover") === "contain" ? "mode-contain" : "mode-cover";
	const cls = `${ratioClass(activeRatio)} ${modeClass} ${className}`.trim();

	if (asset?.dataUrl) {
		return `<figure ${attrTarget(target, label, `image-slot ${cls}`)}>
      <div class="image-frame has-image">
        <img src="${esc(asset.dataUrl)}" alt="${esc(asset.name || "Character reference image")}" loading="lazy" />
      </div>
    </figure>`;
	}

	return `<figure ${attrTarget(target, label, `image-slot ${cls}`)}>
    <div class="image-frame">
      <span class="image-icon">🖼</span>
      ${hideTitle ? "" : '<p class="image-title">Missing image</p>'}
      ${hideHint ? "" : `<p class="image-hint">${esc(fitText(helper, 80))}</p>`}
    </div>
  </figure>`;
}

export function renderFrame({ slide, theme, body }) {
	const modeClass =
		slide?.backgroundMode === "dark" ? "mode-dark" : "mode-light";
	const textMode =
		String(slide?.textMode || "fit").toLowerCase() === "clamp"
			? "text-mode-clamp"
			: "text-mode-fit";

	return `<article class="slide-render deck-slide ${modeClass} ${textMode} ${esc(slide?.type || "generic")}-slide" style="${themeVars(theme)}">
    <section class="deck-content">
      ${body}
    </section>
    <footer class="deck-footer">${esc(theme?.brandName || "Notso AI")}</footer>
  </article>`;
}

