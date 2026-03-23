import { attrTarget, renderFrame } from '../core/components.ts';
import { esc, fitText } from '../core/utils.ts';
import { renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderCover(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const project = deckData?.project || {};
	const mascot = slide.mascotName || project.mascotName || 'Buddy';
	const visual = renderImagePanel({
		slide,
		deckData,
		target: 'imagePrompts',
		label: 'Cover image',
		helper: 'Hero mascot and product UI mockup',
		ratio: '16:9',
		className: 'is-large',
	});
	const layoutClass = visual ? 'cover-layout' : 'stack-layout cover-layout';

	const body = `<div class="${layoutClass}">
    <div class="cover-copy">
      ${
		renderTitlePanel({
			slide,
			kicker: 'Notso AI Proposal',
			title: fitText(
				slide.title || project.projectTitle || 'AI Mascot Proposal',
				52,
			),
			accentPhrase: mascot,
			subtitle: fitText(slide.oneLiner || project.coverOneLiner || '', 140),
			target: 'projectTitle',
			align: 'left',
			variant: 'transparent',
		})
	}
      <div class="meta-pills">
        <span ${attrTarget('proposalDate', 'Proposal date')}>${
		esc(fitText(slide.proposalDate || project.proposalDate || '', 28))
	}</span>
        <span ${attrTarget('clientName', 'Client name')}>For ${esc(fitText(project.clientName || 'Client', 32))}</span>
      </div>
      <p class="meta-url" ${attrTarget('clientUrl', 'Client URL')}>${esc(fitText(project.clientUrl || '', 58))}</p>
    </div>
    ${visual ? `<div class="cover-visual">${visual}</div>` : ''}
  </div>`;

	return renderFrame({ slide, theme, body });
}
