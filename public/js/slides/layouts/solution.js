import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderSolution(slide, theme, deckData) {
  const target = getTargetField(slide);
  const pillars = ensureItems(slide.pillars, [
    { title: 'Character', description: 'A recognizable mascot personality.' },
    { title: 'AI', description: 'Context-aware routing and responses.' },
    { title: 'Interaction', description: 'Clear flows that guide next action.' }
  ]).slice(0, 3);

  const body = `<div class="stack-layout">
    ${renderHeadline({
      kicker: 'The Solution',
      title: 'Character + AI + Interaction',
      accentPhrase: 'AI',
      target,
      align: 'center'
    })}
    <div class="grid-3" ${attrTarget(target, `${slide.title} pillars`)}>
      ${pillars.map((pillar) => `<article class="panel feature-card"><h3>${esc(fitText(pillar.title || '', 24))}</h3><p>${esc(fitText(pillar.description || '', 86))}</p></article>`).join('')}
    </div>
    ${renderImageSlot({
      slide,
      deckData,
      target: 'imagePrompts',
      label: 'Solution visual',
      helper: 'Simple pillar architecture visual',
      ratio: '16:9'
    })}
  </div>`;

  return renderFrame({ slide, theme, body });
}
