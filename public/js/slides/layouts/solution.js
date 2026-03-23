import { renderFrame, attrTarget } from '../core/components.js';
import { ensureItems } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';
import { renderIconFeaturePanel, renderImagePanel, renderTitlePanel } from '../panels/index.js';

export function renderSolution(slide, theme, deckData) {
  const target = getTargetField(slide);
  const pillars = ensureItems(slide.pillars, [
    { title: 'Character', description: 'A recognizable mascot personality.' },
    { title: 'AI', description: 'Context-aware routing and responses.' },
    { title: 'Interaction', description: 'Clear flows that guide next action.' }
  ]).slice(0, 3);
  const pillarCount = pillars.length;

  const body = `<div class="stack-layout">
    ${renderTitlePanel({
      slide,
      kicker: 'The Solution',
      title: 'Character + AI + Interaction',
      accentPhrase: 'AI',
      target,
      align: 'center',
      variant: 'transparent'
    })}
    <div class="grid-3" ${attrTarget(target, `${slide.title} pillars`)}>
      ${pillars
        .map((pillar) =>
          renderIconFeaturePanel({
            slideType: slide?.type,
            sectionKey: 'pillars',
            panelCount: pillarCount,
            target,
            label: `${pillar.title || 'Pillar'} panel`,
            title: pillar.title || '',
            text: pillar.description || '',
            maxTitleChars: 24,
            maxTextChars: 86
          })
        )
        .join('')}
    </div>
    ${renderImagePanel({
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
