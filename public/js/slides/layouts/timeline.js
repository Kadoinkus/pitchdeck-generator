import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderTimeline(slide, theme, deckData) {
  const target = getTargetField(slide);
  const phases = ensureItems(slide.phases, [
    { title: 'Month 1', description: 'Discovery and concept alignment.' },
    { title: 'Month 2', description: 'Design production and flow implementation.' },
    { title: 'Month 3', description: 'Integration, launch, and optimization.' }
  ]).slice(0, 4);

  const body = `<div class="stack-layout">
    ${renderHeadline({
      kicker: 'Implementation Timeline',
      title: 'A Clear Path To Launch',
      accentPhrase: 'To Launch',
      target,
      align: 'center'
    })}
    <div class="grid-3 timeline-grid" ${attrTarget(target, `${slide.title} phases`)}>
      ${phases.map((phase, i) => `<article class="panel timeline-card"><span class="card-index">${String(i + 1).padStart(2, '0')}</span><h3>${esc(fitText(phase.title || '', 20))}</h3><p>${esc(fitText(phase.description || '', 72))}</p></article>`).join('')}
    </div>
    ${renderImageSlot({
      slide,
      deckData,
      target: 'imagePrompts',
      label: 'Timeline visual',
      helper: 'Roadmap flow and milestone markers',
      ratio: '16:9'
    })}
  </div>`;

  return renderFrame({ slide, theme, body });
}
