import { RATIO_16_9 } from '$lib/deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems } from '../core/utils.ts';
import { renderIconFeaturePanel, renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderTimeline(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const phases = ensureItems(slide.phases, [
		{ title: 'Month 1', description: 'Discovery and concept alignment.' },
		{
			title: 'Month 2',
			description: 'Design production and flow implementation.',
		},
		{ title: 'Month 3', description: 'Integration, launch, and optimization.' },
	]).slice(0, 4);
	const phaseCount = phases.length;

	const body = `<div class="stack-layout">
    ${
		renderTitlePanel({
			slide,
			kicker: 'Implementation Timeline',
			title: 'A Clear Path To Launch',
			accentPhrase: 'To Launch',
			target,
			align: 'center',
			variant: 'transparent',
		})
	}
    <div class="grid-3 timeline-grid" ${attrTarget(target, `${slide.title} phases`)}>
      ${
		phases
			.map((phase, i) =>
				renderIconFeaturePanel({
					slideType: slide?.type,
					sectionKey: 'phases',
					panelCount: phaseCount,
					target,
					label: `${phase.title || 'Phase'} card`,
					index: i,
					title: phase.title || '',
					text: phase.description || '',
					className: 'timeline-card panel-card-with-icon',
					maxTitleChars: 20,
					maxTextChars: 72,
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
			label: 'Timeline visual',
			helper: 'Roadmap flow and milestone markers',
			ratio: RATIO_16_9,
		})
	}
  </div>`;

	return renderFrame({ slide, theme, body });
}
