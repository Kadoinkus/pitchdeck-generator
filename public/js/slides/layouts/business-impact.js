import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitList } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderBusinessImpact(slide, theme, deckData) {
  const target = getTargetField(slide);
  const impacts = fitList(ensureItems(slide.impacts, ['Increase conversion', 'Reduce support load', 'Boost engagement', 'Strengthen brand recall']), 4, 42);

  const body = `<div class="stack-layout impact-layout">
    ${renderHeadline({
      kicker: 'Business Impact',
      title: 'Results That Drive Revenue',
      accentPhrase: 'Drive Revenue',
      target,
      align: 'center'
    })}
    <div class="grid-4" ${attrTarget(target, `${slide.title} impact points`)}>
      ${impacts.map((impact) => `<article class="panel impact-card"><p>${esc(impact)}</p></article>`).join('')}
    </div>
    ${renderImageSlot({
      slide,
      deckData,
      target: 'imagePrompts',
      label: 'Business impact image',
      helper: 'Impact icons and outcome visual',
      ratio: '16:9'
    })}
  </div>`;

  return renderFrame({ slide, theme, body });
}
