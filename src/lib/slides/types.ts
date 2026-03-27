import type { CharacterAsset, ImageRatio } from '$lib/deck/types';
import type { SlotPolicy } from '$lib/slides/core/slot-policy';

export type { ImageRatio };

export interface SlideData {
	id?: string;
	type?: string;
	title?: string;
	subtitle?: string;
	oneLiner?: string;
	proposalDate?: string;
	mascotName?: string;
	points?: string[];
	pillars?: Array<{ title: string; description: string }>;
	intro?: string;
	cards?: Array<{ title: string; description: string }>;
	description?: string;
	personality?: string[];
	toneSliders?: Array<{ label: string; value: number }>;
	steps?: string[];
	messages?: string[];
	impacts?: string[];
	bullets?: string[];
	sections?: Array<{ title: string; bullets: string[] }>;
	packages?: Array<{ name: string; price: string; description: string }>;
	phases?: Array<{ title: string; description: string }>;
	headline?: string;
	text?: string;
	team?: Array<{ title: string; description: string }>;
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
	imagePrompt?: string;
	imageRatio?: ImageRatio;
	imageMode?: string;
	hideImages?: boolean;
	sourceField?: string;
	slotPolicy?: SlotPolicy;
	textMode?: string;
	backgroundMode?: string;
	imageAsset?: { dataUrl?: string; name?: string };
	analyticsDescription?: string;
}

export interface ThemeData {
	primaryColor?: string;
	accentColor?: string;
	secondaryColor?: string;
	backgroundColor?: string;
	textColor?: string;
	headingFont?: string;
	bodyFont?: string;
	brandName?: string;
}

export interface DeckData {
	project?: {
		clientName?: string;
		clientUrl?: string;
		projectTitle?: string;
		coverOneLiner?: string;
		proposalDate?: string;
		mascotName?: string;
		contactName?: string;
		contactEmail?: string;
		contactPhone?: string;
		/** Canonical source; also present in content for legacy compat. */
		characterAssets?: CharacterAsset[];
	};
	content?: {
		characterAssets?: CharacterAsset[];
	};
	deckTheme?: ThemeData;
}
