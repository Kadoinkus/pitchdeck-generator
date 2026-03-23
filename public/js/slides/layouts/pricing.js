import { renderFrame, renderHeadline, attrTarget } from '../core/components.js';
import { ensureItems, splitFeatureLines, esc, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderPricing(slide, theme, deckData) {
  const target = getTargetField(slide);
  const tiers = ensureItems(slide.packages, [
    { name: 'Basic - Chat', price: 'EUR 2.600,-', description: '3D mascot template;Template rig;Emotion based and gamified' },
    { name: 'Premium - Chat', price: 'EUR 24.000,-', description: 'Custom designed mascot;40+ animations;Advanced LLM integration' },
    { name: 'Pro - Chat & Voice', price: 'EUR 38.000,-', description: 'Voice support;Advanced analytics;Pro media package' }
  ]).slice(0, 3);

  const body = `<div class="stack-layout">
    ${renderHeadline({
      kicker: 'Flexible Solutions',
      title: 'Pricing That Fits Your Vision',
      accentPhrase: 'Your Vision',
      target,
      align: 'center'
    })}
    <div class="grid-3 pricing-grid" ${attrTarget(target, `${slide.title} pricing`)}>
      ${tiers.map((tier, i) => `<article class="panel pricing-card ${i === 1 ? 'is-featured' : ''} ${i === 2 ? 'is-dark' : ''}">
        <h3>${esc(fitText(tier.name || '', 24))}</h3>
        <p class="price">${esc(fitText(tier.price || '', 24))}</p>
        <ul>
          ${splitFeatureLines(tier.description, 5).map((line) => `<li>${esc(fitText(line, 44))}</li>`).join('')}
        </ul>
      </article>`).join('')}
    </div>
  </div>`;

  return renderFrame({ slide, theme, body });
}
