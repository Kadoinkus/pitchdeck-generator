import { renderFrame, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitList, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';
import { renderImagePanel, renderTitlePanel } from '../panels/index.js';

export function renderExperienceConcept(slide, theme, deckData) {
  const target = getTargetField(slide);
  const points = fitList(ensureItems(slide.points, ['Welcome user', 'Route intent', 'Suggest best options', 'Drive clear CTA']), 5, 78);

  const body = `<div class="split-layout">
    <article class="text-surface text-panel" ${attrTarget(target, `${slide.title} narrative`)}>
      ${renderTitlePanel({
        slide,
        kicker: 'Experience Concept',
        title: 'How The Assistant Guides The Journey',
        accentPhrase: 'Guides The Journey',
        target,
        compact: true,
        asPanel: false,
        variant: 'transparent'
      })}
      <ul class="bullet-list">
        ${points.map((point) => `<li>${esc(point)}</li>`).join('')}
      </ul>
    </article>
    <article class="panel flow-panel">
      <div class="flow-list" ${attrTarget(target, `${slide.title} steps`)}>
        ${points.slice(0, 4).map((point, i) => `<div class="flow-step"><span>${i + 1}</span><p>${esc(fitText(point, 56))}</p></div>`).join('')}
      </div>
      ${renderImagePanel({
        slide,
        deckData,
        target: 'imagePrompts',
        label: 'Experience concept image',
        helper: 'Diagram of mascot across touchpoints',
        ratio: '4:3'
      })}
    </article>
  </div>`;

  return renderFrame({ slide, theme, body });
}
