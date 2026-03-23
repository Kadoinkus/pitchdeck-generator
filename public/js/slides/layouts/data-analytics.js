import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitList, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderDataAnalytics(slide, theme, deckData) {
  const target = getTargetField(slide);
  const bullets = fitList(ensureItems(slide.bullets, ['Live dashboard', 'Top questions and trends', 'Conversation analytics']), 6, 72);

  const body = `<div class="split-layout">
    <article class="panel text-panel">
      ${renderHeadline({
        kicker: 'Data & Analytics',
        title: 'Insights That Matter',
        accentPhrase: 'Matter',
        target,
        compact: true
      })}
      <p class="paragraph" ${attrTarget('analyticsDescription', `${slide.title} description`)}>${esc(fitText(slide.description || '', 220))}</p>
      <ul class="bullet-list" ${attrTarget(target, `${slide.title} bullets`)}>
        ${bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join('')}
      </ul>
    </article>
    ${renderImageSlot({
      slide,
      deckData,
      target: 'imagePrompts',
      label: 'Analytics image',
      helper: 'Dashboard with charts and KPIs',
      ratio: '4:3',
      className: 'is-large'
    })}
  </div>`;

  return renderFrame({ slide, theme, body });
}
