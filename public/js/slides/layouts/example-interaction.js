import { renderFrame, renderHeadline, renderImageSlot, attrTarget } from '../core/components.js';
import { ensureItems, esc, fitList, fitText } from '../core/utils.js';
import { getTargetField } from '../core/fields.js';

export function renderExampleInteraction(slide, theme, deckData) {
  const target = getTargetField(slide);
  const lines = fitList(ensureItems(slide.messages, [
    'User: I need help picking the right option.',
    'Buddy: Great, what is your main priority?',
    'User: Comfort for long work sessions.',
    'Buddy: I recommend Comfort LX006. Want a quick comparison?'
  ]), 7, 92);

  const body = `<div class="stack-layout">
    ${renderHeadline({
      kicker: 'Example Interaction',
      title: 'How The Experience Feels In Practice',
      accentPhrase: 'Feels In Practice',
      target,
      align: 'center'
    })}
    <div class="split-layout interaction-layout">
      <article class="panel device-panel" ${attrTarget(target, `${slide.title} messages`)}>
        <div class="chat-thread">
          ${lines.map((line) => {
            const text = String(line || '');
            const i = text.indexOf(':');
            const speaker = i > 0 ? text.slice(0, i).trim() : '';
            const content = i > 0 ? text.slice(i + 1).trim() : text;
            const bubbleClass = speaker.toLowerCase().includes('user') ? 'is-user' : 'is-assistant';
            return `<div class="chat-bubble ${bubbleClass}">${speaker ? `<strong>${esc(fitText(speaker, 20))}</strong>` : ''}<p>${esc(fitText(content, 82))}</p></div>`;
          }).join('')}
        </div>
      </article>
      ${renderImageSlot({
        slide,
        deckData,
        target: 'imagePrompts',
        label: 'Example interaction image',
        helper: 'Phone/tablet interaction with mascot',
        ratio: '4:3',
        className: 'is-large'
      })}
    </div>
  </div>`;

  return renderFrame({ slide, theme, body });
}
