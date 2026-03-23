import { attrTarget, renderFrame } from "../core/components.js";
import { getTargetField } from "../core/fields.js";
import { ensureItems, esc, fitList, fitText } from "../core/utils.js";
import { renderImagePanel, renderTitlePanel } from "../panels/index.js";

export function renderMeetBuddy(slide, theme, deckData) {
	const target = getTargetField(slide);
	const traits = fitList(
		ensureItems(slide.personality, [
			"Friendly and clear",
			"Emotion-aware",
			"Brand-consistent",
			"Conversion-focused",
		]),
		5,
		72,
	);
	const tone = ensureItems(slide.toneSliders, [
		{ label: "Friendly", value: 86 },
		{ label: "Professional", value: 76 },
		{ label: "Playful", value: 68 },
		{ label: "Direct", value: 82 },
	]).slice(0, 4);
	const visual = renderImagePanel({
		slide,
		deckData,
		target: "imagePrompts",
		label: "Buddy image",
		helper: "Large mascot render with expressions",
		ratio: "4:3",
		className: "is-large",
	});
	const layoutClass = visual
		? "split-layout buddy-layout"
		: "stack-layout buddy-layout";

	const body = `<div class="${layoutClass}">
    <article class="text-surface text-panel">
      ${renderTitlePanel({
				slide,
				kicker: "Meet The Digital Buddy",
				title: `Meet ${slide.mascotName || deckData?.project?.mascotName || "Your Mascot"}`,
				accentPhrase: slide.mascotName || deckData?.project?.mascotName || "",
				target,
				compact: true,
				asPanel: false,
				variant: "transparent",
			})}
      <p class="paragraph" ${attrTarget(target, `${slide.title} description`)}>${esc(fitText(slide.description || "", 210))}</p>
      <ul class="bullet-list" ${attrTarget("buddyPersonality", `${slide.title} traits`)}>
        ${traits.map((trait) => `<li>${esc(trait)}</li>`).join("")}
      </ul>
      <div class="tone-list" ${attrTarget("toneSliders", `${slide.title} tone`)}>
        ${tone.map((item) => `<div class="tone-row"><span>${esc(item.label || "")}</span><div class="tone-track"><i style="width:${Math.max(10, Math.min(100, Number(item.value) || 70))}%"></i></div></div>`).join("")}
      </div>
    </article>
    ${visual}
  </div>`;

	return renderFrame({ slide, theme, body });
}
