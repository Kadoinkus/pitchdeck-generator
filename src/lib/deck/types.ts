import type { HarmonyMode } from '$lib/color-palette';
import type { ImageMode, SlotPolicy, TextMode } from '$lib/slot-policy';

export type { HarmonyMode, ImageMode, SlotPolicy, TextMode };

/* ------------------------------------------------------------------ */
/*  Domain value types                                                 */
/* ------------------------------------------------------------------ */

export type SlideType =
	| 'cover'
	| 'problem'
	| 'opportunity'
	| 'solution'
	| 'what-notso-does'
	| 'meet-buddy'
	| 'experience-concept'
	| 'chat-flow'
	| 'example-interaction'
	| 'business-impact'
	| 'data-analytics'
	| 'what-you-get'
	| 'pricing'
	| 'timeline'
	| 'closing';

export type BackgroundMode = 'light' | 'dark';

export interface ImageRatio {
	readonly w: number;
	readonly h: number;
}

export const RATIO_16_9: ImageRatio = { w: 16, h: 9 };
export const RATIO_4_3: ImageRatio = { w: 4, h: 3 };
export const RATIO_1_1: ImageRatio = { w: 1, h: 1 };
export const RATIO_3_4: ImageRatio = { w: 3, h: 4 };

export function ratioCssClass(ratio: ImageRatio): string {
	return `ratio-${ratio.w}-${ratio.h}`;
}

/* ------------------------------------------------------------------ */
/*  Structured data types                                              */
/* ------------------------------------------------------------------ */

export interface SlideDefinition {
	id: string;
	label: string;
	type: SlideType;
	field: string;
	required: boolean;
	optional: boolean;
	defaultIncluded: boolean;
}

export interface FieldDefinition {
	name: string;
	label: string;
}

export interface Pair {
	title: string;
	description: string;
}

export interface Triple {
	name: string;
	price: string;
	description: string;
}

export interface ToneSlider {
	label: string;
	value: number;
}

export interface Deliverable {
	title: string;
	bullets: string[];
}

export interface CharacterAsset {
	id: string;
	name: string;
	dataUrl: string;
	placement: string;
}

/* ------------------------------------------------------------------ */
/*  Template & layout metadata                                         */
/* ------------------------------------------------------------------ */

export interface TemplateDefinition {
	id: string;
	label: string;
	description: string;
	version: string;
	slides: SlideDefinition[];
}

export interface LayoutPreset {
	id: string;
	label: string;
	slideLayoutByType: Record<SlideType, string>;
	imageRatioByType: Record<SlideType, ImageRatio>;
	backgroundModeByType: Record<SlideType, BackgroundMode>;
}

/* ------------------------------------------------------------------ */
/*  Slide data                                                         */
/* ------------------------------------------------------------------ */

export interface SlideData {
	id: string;
	type: SlideType;
	title: string;
	subtitle: string;
	purpose: string;
	sourceField: string;
	[key: string]: unknown;
}

export interface SlideWithLayout extends SlideData {
	layoutKey: string;
	imageRatio: ImageRatio;
	backgroundMode: BackgroundMode;
	imagePrompt: string;
	imageAsset: CharacterAsset | null;
	slotPolicy: SlotPolicy;
	imageMode: ImageMode;
	textMode: TextMode;
}

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

export interface AppTheme {
	surfaceTop: string;
	surfaceBottom: string;
	card: string;
	line: string;
	text: string;
	muted: string;
	primaryColor: string;
	accentColor: string;
	secondaryColor: string;
}

export interface DeckTheme {
	brandName: string;
	primaryColor: string;
	accentColor: string;
	secondaryColor: string;
	backgroundColor: string;
	textColor: string;
	harmonyMode: HarmonyMode;
	paletteShuffleSeed: number;
	headingFont: string;
	bodyFont: string;
	/** Allow additional properties for extensibility and Record<string, unknown> compatibility. */
	[key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Domain models                                                      */
/* ------------------------------------------------------------------ */

export interface Project {
	clientName: string;
	clientUrl: string;
	projectTitle: string;
	coverOneLiner: string;
	subtitle: string;
	proposalDate: string;
	mascotName: string;
	deckVersion: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	characterAssets: CharacterAsset[];
}

export interface Content {
	problemPoints: string[];
	opportunityPoints: string[];
	solutionPillars: Pair[];
	whatNotsoIntro: string;
	whatNotsoCards: Pair[];
	buddyDescription: string;
	buddyPersonality: string[];
	toneSliders: ToneSlider[];
	experienceConcept: string[];
	chatFlow: string[];
	interactionExample: string[];
	businessImpact: string[];
	analyticsDescription: string;
	analyticsBullets: string[];
	deliverables: Deliverable[];
	pricing: Triple[];
	timeline: Pair[];
	closingText: string;
	teamCards: Pair[];
	characterAssets: CharacterAsset[];
	imagePrompts: Partial<Record<string, string>>;
	/** Allow dynamic field access for AI providers. */
	[key: string]: unknown;
}

export interface AvailableSlide extends SlideDefinition {
	included: boolean;
}

export interface DeckModel {
	template: {
		id: string;
		label: string;
		description: string;
		version: string;
	};
	excludedSlides: string[];
	availableSlides: AvailableSlide[];
	project: Project;
	content: Content;
	appTheme: AppTheme;
	deckTheme: DeckTheme;
	/** @deprecated Use deckTheme. Alias kept for client-side backward compatibility. */
	theme: DeckTheme;
	layout: {
		presetId: string;
		presetLabel: string;
		locked: boolean;
	};
	slides: SlideWithLayout[];
	/** Allow extensibility for JSON round-trip and Record<string, unknown> compatibility. */
	[key: string]: unknown;
}
