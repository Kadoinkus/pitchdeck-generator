import { RATIO_4_3 } from '../../../deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, esc, fitList, fitText } from '../core/utils.ts';
import { renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderDataAnalytics(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const bullets = fitList(
		ensureItems(slide.bullets, [
			'Live dashboard',
			'Top questions and trends',
			'Conversation analytics',
		]),
		6,
		72,
	);
	const visual = renderImagePanel({
		slide,
		deckData,
		target: 'imagePrompts',
		label: 'Analytics image',
		helper: 'Dashboard with charts and KPIs',
		ratio: RATIO_4_3,
		className: 'is-large',
	});
	const layoutClass = visual ? 'split-layout' : 'stack-layout';

	const body = `<div class="${layoutClass}">
    <article class="text-surface text-panel">
      ${
		renderTitlePanel({
			slide,
			kicker: 'Data & Analytics',
			title: 'Insights That Matter',
			accentPhrase: 'Matter',
			target,
			compact: true,
			asPanel: false,
			variant: 'transparent',
		})
	}
      <p class="paragraph" ${attrTarget('analyticsDescription', `${slide.title} description`)}>${
		esc(fitText(slide.description || '', 220))
	}</p>
      <ul class="bullet-list" ${attrTarget(target, `${slide.title} bullets`)}>
        ${bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join('')}
      </ul>
    </article>
    ${visual}
  </div>`;

	return renderFrame({ slide, theme, body });
}
