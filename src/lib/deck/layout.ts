import type { BackgroundMode, ImageRatio, LayoutPreset, SlideType } from '$lib/deck/types';
import { RATIO_16_9, RATIO_1_1, RATIO_4_3 } from '$lib/deck/types';

export const DEFAULT_LAYOUT_PRESET = 'notso-premium-v1';

const DEFAULT_PRESET: LayoutPreset = {
	id: DEFAULT_LAYOUT_PRESET,
	label: 'Notso Premium v1',
	slideLayoutByType: {
		'cover': 'hook-cover',
		'problem': 'problem-grid',
		'opportunity': 'opportunity-split',
		'solution': 'solution-centered',
		'what-notso-does': 'capability-grid',
		'meet-buddy': 'buddy-hero',
		'experience-concept': 'concept-split',
		'chat-flow': 'flow-split',
		'example-interaction': 'interaction-hero',
		'business-impact': 'impact-dark',
		'data-analytics': 'analytics-split',
		'what-you-get': 'deliverables-dark',
		'pricing': 'pricing-3cards',
		'timeline': 'timeline-horizontal',
		'closing': 'closing-dark',
	} satisfies Record<SlideType, string>,
	imageRatioByType: {
		'cover': RATIO_16_9,
		'problem': RATIO_4_3,
		'opportunity': RATIO_4_3,
		'solution': RATIO_1_1,
		'what-notso-does': RATIO_1_1,
		'meet-buddy': RATIO_1_1,
		'experience-concept': RATIO_4_3,
		'chat-flow': RATIO_4_3,
		'example-interaction': RATIO_16_9,
		'business-impact': RATIO_1_1,
		'data-analytics': RATIO_4_3,
		'what-you-get': RATIO_1_1,
		'pricing': RATIO_4_3,
		'timeline': RATIO_16_9,
		'closing': RATIO_4_3,
	} satisfies Record<SlideType, ImageRatio>,
	backgroundModeByType: {
		'cover': 'light',
		'problem': 'light',
		'opportunity': 'light',
		'solution': 'light',
		'what-notso-does': 'light',
		'meet-buddy': 'light',
		'experience-concept': 'light',
		'chat-flow': 'light',
		'example-interaction': 'light',
		'business-impact': 'dark',
		'data-analytics': 'light',
		'what-you-get': 'dark',
		'pricing': 'light',
		'timeline': 'light',
		'closing': 'dark',
	} satisfies Record<SlideType, BackgroundMode>,
};

const LAYOUT_PRESETS: Record<string, LayoutPreset> = {
	[DEFAULT_LAYOUT_PRESET]: DEFAULT_PRESET,
};

export function resolveLayoutPreset(rawPresetId: unknown): LayoutPreset {
	const candidate = String(rawPresetId ?? DEFAULT_LAYOUT_PRESET).trim();
	return LAYOUT_PRESETS[candidate] ?? DEFAULT_PRESET;
}
