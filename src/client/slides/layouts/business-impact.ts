import { RATIO_16_9 } from '../../../deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, fitList } from '../core/utils.ts';
import { renderImagePanel, renderMetricPanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderBusinessImpact(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const impacts = fitList(
		ensureItems(slide.impacts, [
			'Increase conversion',
			'Reduce support load',
			'Boost engagement',
			'Strengthen brand recall',
		]),
		4,
		42,
	);
	const impactCount = impacts.length;

	const body = `<div class="stack-layout impact-layout">
    ${
		renderTitlePanel({
			slide,
			kicker: 'Business Impact',
			title: 'Results That Drive Revenue',
			accentPhrase: 'Drive Revenue',
			target,
			align: 'center',
			variant: 'transparent',
		})
	}
    <div class="grid-4" ${attrTarget(target, `${slide.title} impact points`)}>
      ${
		impacts
			.map((impact) =>
				renderMetricPanel({
					slideType: slide?.type,
					sectionKey: 'impacts',
					panelCount: impactCount,
					target,
					label: `${impact} metric`,
					value: impact,
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
			label: 'Business impact image',
			helper: 'Impact icons and outcome visual',
			ratio: RATIO_16_9,
		})
	}
  </div>`;

	return renderFrame({ slide, theme, body });
}
