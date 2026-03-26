import { resolveThemePalette } from '$lib/color-palette';
import { resolveLayoutPreset } from '$lib/deck/layout';
import { parseDeckInput } from '$lib/deck/schema';
import { buildSlidesFromSpecs, getDefaultImagePrompt, SLIDE_SPECS } from '$lib/deck/slide-registry';
import type {
	AppTheme,
	AvailableSlide,
	CharacterAsset,
	Content,
	DeckModel,
	DeckTheme,
	FieldDefinition,
	Project,
	SlideWithLayout,
	TemplateDefinition,
} from '$lib/deck/types';
import { resolveImageModeForSlide, resolveSlotPolicy } from '$lib/slot-policy';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TEMPLATE_PREMIUM_PROPOSAL = 'pitch-proposal';

const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
	[TEMPLATE_PREMIUM_PROPOSAL]: {
		id: TEMPLATE_PREMIUM_PROPOSAL,
		label: 'Notso Premium Proposal',
		description: '15-slide premium pitch deck for animated chatbot proposals.',
		version: '2.0.0',
		slides: SLIDE_SPECS.map(({ id, label, type, field, required, optional, defaultIncluded }) => ({
			id,
			label,
			type,
			field,
			required,
			optional,
			defaultIncluded,
		})),
	},
};

export const EDITABLE_FIELD_DEFINITIONS: readonly FieldDefinition[] = [
	{ name: 'projectTitle', label: 'Project title' },
	{ name: 'coverOneLiner', label: 'Cover one-liner' },
	{ name: 'subtitle', label: 'Subtitle' },
	{ name: 'proposalDate', label: 'Proposal date' },
	{ name: 'mascotName', label: 'Mascot name' },
	{ name: 'problemPoints', label: 'Problem points' },
	{ name: 'opportunityPoints', label: 'Opportunity points' },
	{ name: 'solutionPillars', label: 'Solution pillars' },
	{ name: 'whatNotsoIntro', label: 'What Notso intro' },
	{ name: 'whatNotsoCards', label: 'What Notso cards' },
	{ name: 'buddyDescription', label: 'Buddy description' },
	{ name: 'buddyPersonality', label: 'Buddy personality bullets' },
	{ name: 'toneSliders', label: 'Tone sliders' },
	{ name: 'experienceConcept', label: 'Experience concept' },
	{ name: 'chatFlow', label: 'Chat flow' },
	{ name: 'interactionExample', label: 'Example interaction' },
	{ name: 'businessImpact', label: 'Business impact' },
	{ name: 'analyticsDescription', label: 'Analytics description' },
	{ name: 'analyticsBullets', label: 'Analytics bullets' },
	{ name: 'deliverables', label: 'Deliverables' },
	{ name: 'pricing', label: 'Pricing' },
	{ name: 'timeline', label: 'Timeline' },
	{ name: 'closingText', label: 'Closing text' },
	{ name: 'teamCards', label: 'Team cards' },
	{ name: 'characterAssets', label: 'Character assets' },
	{ name: 'imagePrompts', label: 'Image prompts' },
	{ name: 'layoutPreset', label: 'Layout preset' },
	{ name: 'layoutPresetLock', label: 'Layout preset lock' },
	{ name: 'harmonyMode', label: 'Color harmony mode' },
	{ name: 'paletteShuffleSeed', label: 'Color shuffle seed' },
	{ name: 'lockAccentColor', label: 'Lock accent color' },
	{ name: 'lockSecondaryColor', label: 'Lock secondary color' },
	{ name: 'primaryColor', label: 'Deck primary' },
	{ name: 'accentColor', label: 'Deck accent' },
	{ name: 'secondaryColor', label: 'Deck secondary' },
	{ name: 'backgroundColor', label: 'Deck background' },
	{ name: 'textColor', label: 'Deck text' },
	{ name: 'headingFont', label: 'Deck heading font' },
	{ name: 'bodyFont', label: 'Deck body font' },
];

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function resolveImageAssetForSlide(
	slideId: string,
	assets: CharacterAsset[] = [],
): CharacterAsset | null {
	if (!Array.isArray(assets) || !assets.length) return null;

	const id = slideId.toLowerCase();
	const mascotSlides = new Set([
		'cover',
		'meet-buddy',
		'example-interaction',
		'closing',
	]);

	const exact = assets.find((asset) => asset.placement === id);
	if (exact) return exact;

	if (mascotSlides.has(id)) {
		return (
			assets.find(
				(asset) => asset.placement === 'all-mascot' || asset.placement === 'mascot',
			) ?? assets[0] ?? null
		);
	}

	return assets.find((asset) => asset.placement === 'all') ?? null;
}

function resolveTemplateId(templateId: string): string {
	return TEMPLATE_DEFINITIONS[templateId] ? templateId : TEMPLATE_PREMIUM_PROPOSAL;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function getTemplateDefinitions(): TemplateDefinition[] {
	return Object.values(TEMPLATE_DEFINITIONS).map((template) => ({
		id: template.id,
		label: template.label,
		description: template.description,
		version: template.version,
		slides: template.slides,
	}));
}

export function getEditableFieldDefinitions(): readonly FieldDefinition[] {
	return EDITABLE_FIELD_DEFINITIONS;
}

export function buildDeckModel(rawData: unknown = {}): DeckModel {
	const d = parseDeckInput(rawData);

	const templateId = resolveTemplateId(d.templateId);
	const template = TEMPLATE_DEFINITIONS[templateId];
	if (!template) {
		throw new Error(`Unknown template: ${templateId}`);
	}

	const excludedSlides = new Set(d.excludedSlides);
	const layoutPreset = resolveLayoutPreset(d.layoutPreset);

	const paletteResult = resolveThemePalette({
		primaryColor: d.primaryColor,
		harmonyMode: d.harmonyMode,
		shuffleSeed: d.paletteShuffleSeed,
		locks: {
			accentColor: d.lockAccentColor,
			secondaryColor: d.lockSecondaryColor,
		},
		manualColors: {
			accentColor: d.deckAccentColor || d.accentColor,
			secondaryColor: d.deckSecondaryColor || d.secondaryColor,
			backgroundColor: d.deckBackgroundColor || d.backgroundColor,
			textColor: d.deckTextColor || d.textColor,
		},
	});

	const appTheme: AppTheme = {
		surfaceTop: '#EAF4FF',
		surfaceBottom: '#F8FBFF',
		card: '#FFFFFF',
		line: '#CFDDFF',
		text: '#102347',
		muted: '#4F5F83',
		primaryColor: '#0B1F4D',
		accentColor: '#00C4CC',
		secondaryColor: '#7D2AE8',
	};

	const deckTheme: DeckTheme = {
		brandName: d.brandName,
		primaryColor: paletteResult.theme.primaryColor,
		accentColor: paletteResult.theme.accentColor,
		secondaryColor: paletteResult.theme.secondaryColor,
		backgroundColor: paletteResult.theme.backgroundColor,
		textColor: paletteResult.theme.textColor,
		harmonyMode: paletteResult.harmonyMode,
		paletteShuffleSeed: paletteResult.shuffleSeed,
		headingFont: d.deckHeadingFont || d.headingFont || 'Sora',
		bodyFont: d.deckBodyFont || d.bodyFont || 'Inter',
	};

	const project: Project = {
		clientName: d.clientName,
		clientUrl: d.clientUrl,
		projectTitle: d.projectTitle,
		coverOneLiner: d.coverOneLiner,
		subtitle: d.subtitle,
		proposalDate: d.proposalDate,
		mascotName: d.mascotName,
		deckVersion: d.deckVersion,
		contactName: d.contactName,
		contactEmail: d.contactEmail,
		contactPhone: d.contactPhone,
		characterAssets: d.characterAssets,
	};

	/* Project-dependent content defaults ------------------------------- */
	const problemPoints = d.problemPoints.length
		? d.problemPoints.slice(0, 4)
		: [
			`${project.clientName} loses momentum when visitors do not get instant answers.`,
			'Support teams repeat the same pre-sales and service responses manually.',
			'Current automation lacks brand personality and emotional connection.',
		];

	const opportunityPoints = d.opportunityPoints.length
		? d.opportunityPoints.slice(0, 4)
		: [
			'Convert static support into guided, interactive discovery.',
			'Reduce service load with intelligent first-line responses.',
			`Create a memorable branded assistant with ${project.mascotName}.`,
		];

	const buddyDescription = d.buddyDescription
		|| `${project.mascotName} is a playful but practical assistant that guides users with empathy, clarity, and speed.`;

	const closingText = d.closingText
		|| `Let's build ${project.mascotName} together and launch a premium conversational experience.`;

	const imagePrompts = d.imagePrompts;

	const content: Content = {
		problemPoints,
		opportunityPoints,
		solutionPillars: d.solutionPillars,
		whatNotsoIntro: d.whatNotsoIntro,
		whatNotsoCards: d.whatNotsoCards,
		buddyDescription,
		buddyPersonality: d.buddyPersonality,
		toneSliders: d.toneSliders,
		experienceConcept: d.experienceConcept,
		chatFlow: d.chatFlow,
		interactionExample: d.interactionExample,
		businessImpact: d.businessImpact,
		analyticsDescription: d.analyticsDescription,
		analyticsBullets: d.analyticsBullets,
		deliverables: d.deliverables,
		pricing: d.pricing,
		timeline: d.timeline,
		closingText,
		teamCards: d.teamCards,
		characterAssets: project.characterAssets,
		imagePrompts,
	};

	const allSlides = buildSlidesFromSpecs(project, content);

	const slidesWithLayout: SlideWithLayout[] = allSlides.map((slide) => {
		const lockedLayout = layoutPreset.slideLayoutByType[slide.type];
		const imageRatio = layoutPreset.imageRatioByType[slide.type];
		const backgroundMode = layoutPreset.backgroundModeByType[slide.type];
		const fallbackLayout = lockedLayout || slide.type;
		const layoutKey = d.layoutPresetLock
			? fallbackLayout
			: String(d[`layout_${slide.id}`] ?? fallbackLayout).trim();
		const slotPolicy = resolveSlotPolicy(slide.type);
		const imageMode = resolveImageModeForSlide(slide.type, '');

		return {
			...slide,
			layoutKey,
			imageRatio,
			backgroundMode,
			imagePrompt: content.imagePrompts[slide.id]
				|| getDefaultImagePrompt(slide.id, project),
			imageAsset: resolveImageAssetForSlide(slide.id, content.characterAssets),
			slotPolicy,
			imageMode,
			textMode: slotPolicy.text.mode,
		};
	});

	let slides = slidesWithLayout.filter(
		(slide) => !excludedSlides.has(slide.id),
	);
	if (!slides.length) slides = slidesWithLayout.slice(0, 1);

	const availableSlides: AvailableSlide[] = template.slides.map(
		(slideMeta) => ({
			...slideMeta,
			included: !excludedSlides.has(slideMeta.id),
		}),
	);

	return {
		template: {
			id: template.id,
			label: template.label,
			description: template.description,
			version: template.version,
		},
		excludedSlides: Array.from(excludedSlides),
		availableSlides,
		project,
		content,
		appTheme,
		deckTheme,
		theme: deckTheme,
		layout: {
			presetId: layoutPreset.id,
			presetLabel: layoutPreset.label,
			locked: d.layoutPresetLock,
		},
		slides,
	};
}
