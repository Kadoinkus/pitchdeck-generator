import { RATIO_1_1 } from '$lib/deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, esc, fitText } from '../core/utils.ts';
import { renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderWhatYouGet(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const sections = ensureItems(slide.sections, [
		{
			title: 'Deployment-ready mascot',
			bullets: [
				'Branded character',
				'Expressive animation',
				'Launch-ready assets',
			],
		},
		{
			title: 'Multichannel access',
			bullets: ['Website widget', 'Mobile support', 'Campaign deployment'],
		},
		{
			title: 'Performance insights',
			bullets: ['Live dashboard', 'Monthly reports', 'Optimization loops'],
		},
		{
			title: 'Brand activation media',
			bullets: ['Social visuals', 'Video snippets', 'Campaign pack'],
		},
	]).slice(0, 4);

	const body = `<div class="stack-layout">
    ${
		renderTitlePanel({
			slide,
			kicker: 'What You Get',
			title: 'Everything Needed To Launch Fast',
			accentPhrase: 'Launch Fast',
			target,
			align: 'center',
			variant: 'transparent',
		})
	}
    <div class="grid-4 deliverable-grid" ${attrTarget(target, `${slide.title} deliverables`)}>
      ${
		sections
			.map(
				(section, index) =>
					`<article class="panel deliverable-card">
        ${
						renderImagePanel({
							slide,
							deckData,
							target: 'imagePrompts',
							label: `${slide.title} image ${index + 1}`,
							helper: `${section.title} visual`,
							ratio: RATIO_1_1,
							className: 'is-micro',
							hideTitle: true,
							hideHint: true,
						})
					}
        <h3>${esc(fitText(section.title || '', 30))}</h3>
        <ul>
          ${
						ensureItems(section.bullets, [])
							.slice(0, 3)
							.map((bullet) => `<li>${esc(fitText(bullet, 48))}</li>`)
							.join('')
					}
        </ul>
      </article>`,
			)
			.join('')
	}
    </div>
  </div>`;

	return renderFrame({ slide, theme, body });
}
