import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, fitList } from '../core/utils.ts';
import { renderIconFeaturePanel, renderImagePanel, renderSummaryPanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderProblem(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const points = fitList(
		ensureItems(slide.points, [
			'Users do not get instant answers.',
			'Support repeats the same work.',
			'Automation feels generic.',
		]),
		4,
		90,
	);
	const pointCards = points.slice(0, 3);
	const visual = renderImagePanel({
		slide,
		deckData,
		target: 'imagePrompts',
		label: 'Problem image',
		helper: 'Visualize current friction state',
		ratio: '16:9',
	});
	const bottomLayoutClass = visual ? 'split-layout' : 'stack-layout';

	const body = `<div class="stack-layout">
    ${
		renderTitlePanel({
			slide,
			kicker: 'Client Situation',
			title: 'What Is Blocking Growth Today',
			accentPhrase: 'Blocking Growth',
			subtitle: '',
			target,
			align: 'center',
			variant: 'transparent',
		})
	}
    <div class="grid-3" ${attrTarget(target, `${slide.title} points`)}>
      ${
		pointCards
			.map((point, i) =>
				renderIconFeaturePanel({
					slideType: slide?.type,
					sectionKey: 'points',
					panelCount: pointCards.length,
					target,
					label: `${slide.title} point ${i + 1}`,
					index: i,
					title: '',
					text: point,
					className: 'short-card panel-card-with-icon',
					showTitle: false,
					maxTextChars: 80,
				})
			)
			.join('')
	}
    </div>
    <div class="${bottomLayoutClass}">
      ${
		renderSummaryPanel({
			target,
			label: `${slide.title} summary`,
			title: 'Core message',
			text: points[0] || '',
			maxTextChars: 120,
		})
	}
      ${visual}
    </div>
  </div>`;

	return renderFrame({ slide, theme, body });
}
