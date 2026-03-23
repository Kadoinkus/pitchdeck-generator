// @ts-nocheck
import { attrTarget, renderFrame } from "../core/components.js";
import { getTargetField } from "../core/fields.js";
import { ensureItems, esc, fitList } from "../core/utils.js";
import { renderImagePanel, renderTitlePanel } from "../panels/index.js";

export function renderOpportunity(slide, theme, deckData) {
	const target = getTargetField(slide);
	const points = fitList(
		ensureItems(slide.points, [
			"Turn support into guided conversion.",
			"Increase engagement with mascot interactions.",
			"Scale conversations with premium brand tone.",
		]),
		4,
		86,
	);
	const visual = renderImagePanel({
		slide,
		deckData,
		target: "imagePrompts",
		label: "Opportunity image",
		helper: "Before and after support journey visual",
		ratio: "4:3",
		className: "is-large",
	});
	const layoutClass = visual
		? "split-layout opportunity-layout"
		: "stack-layout opportunity-layout";

	const body = `<div class="${layoutClass}">
    <article class="text-surface text-panel" ${attrTarget(target, `${slide.title} opportunity text`)}>
      ${renderTitlePanel({
				slide,
				kicker: "The Opportunity",
				title: "A Better Experience Creates More Conversion",
				accentPhrase: "More Conversion",
				target,
				align: "left",
				compact: true,
				asPanel: false,
				variant: "transparent",
			})}
      <ul class="bullet-list">
        ${points.map((point) => `<li>${esc(point)}</li>`).join("")}
      </ul>
    </article>
    ${visual}
  </div>`;

	return renderFrame({ slide, theme, body });
}

