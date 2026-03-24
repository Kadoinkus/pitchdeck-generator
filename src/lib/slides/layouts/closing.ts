import { RATIO_4_3 } from '$lib/deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, esc, fitText } from '../core/utils.ts';
import { renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderClosing(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const team = ensureItems(slide.team, [
		{ title: 'Strategy', description: 'Direction and scope' },
		{ title: 'Conversation', description: 'Flow and quality' },
		{ title: 'Motion', description: 'Character animation' },
		{ title: 'Engineering', description: 'Integration and launch' },
	]).slice(0, 4);

	const body = `<div class="split-layout closing-layout">
    <article class="text-surface text-panel closing-copy">
      ${
		renderTitlePanel({
			slide,
			kicker: 'Next Step',
			title: fitText(
				slide.headline
					|| `Let's Build ${slide.mascotName || deckData?.project?.mascotName || 'This Together'}`,
				46,
			),
			accentPhrase: slide.mascotName || deckData?.project?.mascotName || '',
			subtitle: '',
			target,
			compact: true,
			asPanel: false,
			variant: 'transparent',
		})
	}
      <p class="paragraph" ${attrTarget(target, 'Closing statement')}>${esc(fitText(slide.text || '', 220))}</p>
      <div class="contact-lines">
        <p ${attrTarget('contactName', 'Contact name')}>${esc(fitText(slide.contactName || '', 34))}</p>
        <p ${attrTarget('contactEmail', 'Contact email')}>${esc(fitText(slide.contactEmail || '', 40))}</p>
        <p ${attrTarget('contactPhone', 'Contact phone')}>${esc(fitText(slide.contactPhone || '', 30))}</p>
      </div>
    </article>
    <div class="closing-right">
      ${
		renderImagePanel({
			slide,
			deckData,
			target: 'imagePrompts',
			label: 'Closing image',
			helper: 'Hero mascot CTA visual',
			ratio: RATIO_4_3,
			className: 'is-large',
		})
	}
      <div class="grid-2x2" ${attrTarget('teamCards', 'Team cards')}>
        ${
		team.map((item) =>
			`<article class="panel team-card"><h4>${esc(fitText(item.title || '', 22))}</h4><p>${
				esc(fitText(item.description || '', 52))
			}</p></article>`
		).join('')
	}
      </div>
    </div>
  </div>`;

	return renderFrame({ slide, theme, body });
}
