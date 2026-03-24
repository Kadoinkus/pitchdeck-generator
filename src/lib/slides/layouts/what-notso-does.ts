import { RATIO_4_3 } from '$lib/deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, esc, fitText } from '../core/utils.ts';
import { renderIconFeaturePanel, renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderWhatNotsoDoes(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const cards = ensureItems(slide.cards, [
		{ title: 'Strategy', description: 'Voice, role, and emotional behavior.' },
		{ title: 'Design', description: 'Mascot and motion direction.' },
		{ title: 'Conversation', description: 'Structured chat logic.' },
		{ title: 'Analytics', description: 'Track and optimize outcomes.' },
	]).slice(0, 4);
	const cardCount = cards.length;

	const body = `<div class="split-layout what-layout">
    <article class="text-surface text-panel" ${attrTarget('whatNotsoIntro', `${slide.title} intro`)}>
      ${
		renderTitlePanel({
			slide,
			kicker: 'What We Do',
			title: 'AI-powered Character Experiences',
			accentPhrase: 'Character Experiences',
			target,
			compact: true,
			asPanel: false,
			variant: 'transparent',
		})
	}
      <p class="paragraph">${esc(fitText(slide.intro || '', 220))}</p>
      ${
		renderImagePanel({
			slide,
			deckData,
			target: 'imagePrompts',
			label: 'What Notso does image',
			helper: 'Mascot capability overview visual',
			ratio: RATIO_4_3,
		})
	}
    </article>
    <div class="grid-2x2" ${attrTarget(target, `${slide.title} cards`)}>
      ${
		cards
			.map((card) =>
				renderIconFeaturePanel({
					slideType: slide?.type,
					sectionKey: 'cards',
					panelCount: cardCount,
					target,
					label: `${card.title || 'Card'} panel`,
					title: card.title || '',
					text: card.description || '',
					maxTitleChars: 26,
					maxTextChars: 92,
				})
			)
			.join('')
	}
    </div>
  </div>`;

	return renderFrame({ slide, theme, body });
}
