import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitList } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderOpportunity(slide, theme, deckData) {
  const target = getTargetField(slide);
  const points = fitList(ensureItems(slide.points, ['Turn support into guided conversion.', 'Increase engagement with mascot interactions.', 'Scale conversations with premium brand tone.']), 4, 86);

  const body = `<div class="split-layout opportunity-layout">
    <article class="panel text-panel" ${attrTarget(target, `${slide.title} opportunity text`)}>
      ${renderHeadline({
        kicker: 'The Opportunity',
        title: 'A Better Experience Creates More Conversion',
        accentPhrase: 'More Conversion',
        target,
        align: 'left',
        compact: true
      })}
      <ul class="bullet-list">
        ${points.map((point) => `<li>${esc(point)}</li>`).join('')}
      </ul>
    </article>
    ${renderImageSlot({
      slide,
      deckData,
      target: 'imagePrompts',
      label: 'Opportunity image',
      helper: 'Before and after support journey visual',
      ratio: '4:3',
      className: 'is-large'
    })}
  </div>`;

  return renderFrame({ slide, theme, body });
}
