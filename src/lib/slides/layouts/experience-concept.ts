import { RATIO_4_3 } from '$lib/deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, esc, fitList, fitText } from '../core/utils.ts';
import { renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderExperienceConcept(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const points = fitList(
		ensureItems(slide.points, [
			'Welcome user',
			'Route intent',
			'Suggest best options',
			'Drive clear CTA',
		]),
		5,
		78,
	);

	const body = `<div class="split-layout">
    <article class="text-surface text-panel" ${attrTarget(target, `${slide.title} narrative`)}>
      ${
		renderTitlePanel({
			slide,
			kicker: 'Experience Concept',
			title: 'How The Assistant Guides The Journey',
			accentPhrase: 'Guides The Journey',
			target,
			compact: true,
			asPanel: false,
			variant: 'transparent',
		})
	}
      <ul class="bullet-list">
        ${points.map((point) => `<li>${esc(point)}</li>`).join('')}
      </ul>
    </article>
    <article class="panel flow-panel">
      <div class="flow-list" ${attrTarget(target, `${slide.title} steps`)}>
        ${
		points
			.slice(0, 4)
			.map(
				(point, i) => `<div class="flow-step"><span>${i + 1}</span><p>${esc(fitText(point, 56))}</p></div>`,
			)
			.join('')
	}
      </div>
      ${
		renderImagePanel({
			slide,
			deckData,
			target: 'imagePrompts',
			label: 'Experience concept image',
			helper: 'Diagram of mascot across touchpoints',
			ratio: RATIO_4_3,
		})
	}
    </article>
  </div>`;

	return renderFrame({ slide, theme, body });
}
