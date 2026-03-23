import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitList, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderProblem(slide, theme, deckData) {
  const target = getTargetField(slide);
  const points = fitList(ensureItems(slide.points, ['Users do not get instant answers.', 'Support repeats the same work.', 'Automation feels generic.']), 4, 90);

  const body = `<div class="stack-layout">
    ${renderHeadline({
      kicker: 'Client Situation',
      title: 'What Is Blocking Growth Today',
      accentPhrase: 'Blocking Growth',
      subtitle: '',
      target,
      align: 'center'
    })}
    <div class="grid-3" ${attrTarget(target, `${slide.title} points`)}>
      ${points.slice(0, 3).map((point, i) => `<article class="panel short-card"><span class="card-index">${String(i + 1).padStart(2, '0')}</span><p>${esc(fitText(point, 80))}</p></article>`).join('')}
    </div>
    <div class="split-layout">
      <article class="panel summary-panel" ${attrTarget(target, `${slide.title} summary`)}>
        <h3>Core message</h3>
        <p>${esc(fitText(points[0], 120))}</p>
      </article>
      ${renderImageSlot({
        slide,
        deckData,
        target: 'imagePrompts',
        label: 'Problem image',
        helper: 'Visualize current friction state',
        ratio: '4:3'
      })}
    </div>
  </div>`;

  return renderFrame({ slide, theme, body });
}
