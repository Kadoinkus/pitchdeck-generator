import { safeText } from '../utils.ts';
import type { BackgroundMode, ImageRatio, LayoutPreset, SlideType } from './types.ts';

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
		'cover': '16:9',
		'problem': '4:3',
		'opportunity': '4:3',
		'solution': '1:1',
		'what-notso-does': '1:1',
		'meet-buddy': '1:1',
		'experience-concept': '4:3',
		'chat-flow': '4:3',
		'example-interaction': '16:9',
		'business-impact': '1:1',
		'data-analytics': '4:3',
		'what-you-get': '1:1',
		'pricing': '4:3',
		'timeline': '16:9',
		'closing': '4:3',
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
	const candidate = safeText(rawPresetId, DEFAULT_LAYOUT_PRESET);
	return LAYOUT_PRESETS[candidate] ?? DEFAULT_PRESET;
}
