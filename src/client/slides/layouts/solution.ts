import { RATIO_16_9 } from '../../../deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems } from '../core/utils.ts';
import { renderIconFeaturePanel, renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderSolution(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const pillars = ensureItems(slide.pillars, [
		{ title: 'Character', description: 'A recognizable mascot personality.' },
		{ title: 'AI', description: 'Context-aware routing and responses.' },
		{
			title: 'Interaction',
			description: 'Clear flows that guide next action.',
		},
	]).slice(0, 3);
	const pillarCount = pillars.length;

	const body = `<div class="stack-layout">
    ${
		renderTitlePanel({
			slide,
			kicker: 'The Solution',
			title: 'Character + AI + Interaction',
			accentPhrase: 'AI',
			target,
			align: 'center',
			variant: 'transparent',
		})
	}
    <div class="grid-3" ${attrTarget(target, `${slide.title} pillars`)}>
      ${
		pillars
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
					maxTextChars: 86,
				})
			)
			.join('')
	}
    </div>
    ${
		renderImagePanel({
			slide,
			deckData,
			target: 'imagePrompts',
			label: 'Solution visual',
			helper: 'Simple pillar architecture visual',
			ratio: RATIO_16_9,
		})
	}
  </div>`;

	return renderFrame({ slide, theme, body });
}
