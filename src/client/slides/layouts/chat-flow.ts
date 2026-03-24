import { RATIO_4_3 } from '../../../deck/types.ts';
import { attrTarget, renderFrame } from '../core/components.ts';
import { getTargetField } from '../core/fields.ts';
import { ensureItems, esc, fitList, fitText } from '../core/utils.ts';
import { renderImagePanel, renderTitlePanel } from '../panels/index.ts';
import type { DeckData, SlideData, ThemeData } from '../types.ts';

export function renderChatFlow(
	slide: SlideData,
	theme: ThemeData,
	deckData: DeckData,
): string {
	const target = getTargetField(slide);
	const steps = fitList(
		ensureItems(slide.steps, [
			'Greeting',
			'Discovery',
			'Suggestions',
			'Personalization',
			'Conversion',
		]),
		6,
		48,
	);

	const body = `<div class="split-layout">
    <article class="text-surface text-panel">
      ${
		renderTitlePanel({
			slide,
			kicker: 'Chat Flow',
			title: 'Conversation Logic That Converts',
			accentPhrase: 'Converts',
			target,
			compact: true,
			asPanel: false,
			variant: 'transparent',
		})
	}
      <p class="paragraph">Every conversation follows a clear structure to reduce friction and move users to the right next action.</p>
      <ul class="bullet-list">
        <li>Intent routing with context memory</li>
        <li>Simple decision points and transitions</li>
        <li>Escalation path for human handoff</li>
      </ul>
    </article>
    <article class="panel flow-panel" ${attrTarget(target, `${slide.title} steps`)}>
      <div class="vertical-steps">
        ${
		steps.map((step, i) => `<div class="flow-step"><span>${i + 1}</span><p>${esc(fitText(step, 44))}</p></div>`).join(
			'',
		)
	}
      </div>
      ${
		renderImagePanel({
			slide,
			deckData,
			target: 'imagePrompts',
			label: 'Chat flow image',
			helper: 'Step-based funnel illustration',
			ratio: RATIO_4_3,
		})
	}
    </article>
  </div>`;

	return renderFrame({ slide, theme, body });
}
