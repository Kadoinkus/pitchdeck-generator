import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { esc, fitText } from '../core/utils.js';

export function renderCover(slide, theme, deckData) {
  const project = deckData?.project || {};
  const mascot = slide.mascotName || project.mascotName || 'Buddy';

  const body = `<div class="cover-layout">
    <div class="cover-copy">
      ${renderHeadline({
        kicker: 'Notso AI Proposal',
        title: fitText(slide.title || project.projectTitle || 'AI Mascot Proposal', 52),
        accentPhrase: mascot,
        subtitle: fitText(slide.oneLiner || project.coverOneLiner || '', 140),
        target: 'projectTitle',
        align: 'left'
      })}
      <div class="meta-pills">
        <span ${attrTarget('proposalDate', 'Proposal date')}>${esc(fitText(slide.proposalDate || project.proposalDate || '', 28))}</span>
        <span ${attrTarget('clientName', 'Client name')}>For ${esc(fitText(project.clientName || 'Client', 32))}</span>
      </div>
      <p class="meta-url" ${attrTarget('clientUrl', 'Client URL')}>${esc(fitText(project.clientUrl || '', 58))}</p>
    </div>
    <div class="cover-visual">
      ${renderImageSlot({
        slide,
        deckData,
        target: 'imagePrompts',
        label: 'Cover image',
        helper: 'Hero mascot and product UI mockup',
        ratio: '16:9',
        className: 'is-large'
      })}
    </div>
  </div>`;

  return renderFrame({ slide, theme, body });
}
