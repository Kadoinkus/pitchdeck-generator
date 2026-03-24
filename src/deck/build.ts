import { resolveThemePalette } from '../color-palette.ts';
import { resolveImageModeForSlide, resolveSlotPolicy } from '../slot-policy.ts';
import { safeText } from '../utils.ts';
import { resolveLayoutPreset } from './layout.ts';
import { parseDeckInput } from './schema.ts';
import type {
	AppTheme,
	AvailableSlide,
	CharacterAsset,
	Content,
	DeckModel,
	DeckTheme,
	FieldDefinition,
	Project,
	SlideData,
	SlideType,
	SlideWithLayout,
	TemplateDefinition,
} from './types.ts';

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
		slides: [
			{
				id: 'cover',
				label: 'Cover',
				type: 'cover',
				field: 'projectTitle',
				required: true,
				optional: false,
				defaultIncluded: true,
			},
			{
				id: 'problem',
				label: 'The Problem',
				type: 'problem',
				field: 'problemPoints',
				required: true,
				optional: false,
				defaultIncluded: true,
			},
			{
				id: 'opportunity',
				label: 'The Opportunity',
				type: 'opportunity',
				field: 'opportunityPoints',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'solution',
				label: 'The Solution',
				type: 'solution',
				field: 'solutionPillars',
				required: true,
				optional: false,
				defaultIncluded: true,
			},
			{
				id: 'what-notso-does',
				label: 'What Notso AI Does',
				type: 'what-notso-does',
				field: 'whatNotsoCards',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'meet-buddy',
				label: 'Meet The Buddy',
				type: 'meet-buddy',
				field: 'buddyDescription',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'experience-concept',
				label: 'Experience Concept',
				type: 'experience-concept',
				field: 'experienceConcept',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'chat-flow',
				label: 'Chat Flow',
				type: 'chat-flow',
				field: 'chatFlow',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'example-interaction',
				label: 'Example Interaction',
				type: 'example-interaction',
				field: 'interactionExample',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'business-impact',
				label: 'Business Impact',
				type: 'business-impact',
				field: 'businessImpact',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'data-analytics',
				label: 'Data & Analytics',
				type: 'data-analytics',
				field: 'analyticsBullets',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'what-you-get',
				label: 'What You Get',
				type: 'what-you-get',
				field: 'deliverables',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'pricing',
				label: 'Pricing',
				type: 'pricing',
				field: 'pricing',
				required: true,
				optional: false,
				defaultIncluded: true,
			},
			{
				id: 'timeline',
				label: 'Timeline',
				type: 'timeline',
				field: 'timeline',
				required: false,
				optional: true,
				defaultIncluded: true,
			},
			{
				id: 'closing',
				label: 'Closing',
				type: 'closing',
				field: 'closingText',
				required: true,
				optional: false,
				defaultIncluded: true,
			},
		],
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

function withSlide(
	id: string,
	type: SlideType,
	title: string,
	subtitle: string,
	purpose: string,
	sourceField: string,
	extra: Record<string, unknown> = {},
): SlideData {
	return { id, type, title, subtitle, purpose, sourceField, ...extra };
}

function defaultImagePrompt(
	type: SlideType,
	project: Project,
	mascotName: string,
): string {
	switch (type) {
		case 'cover':
			return `Hero composition with ${mascotName} overlapping device UI for ${project.clientName}.`;
		case 'problem':
			return `Clean problem-state visual showing friction in support journey for ${project.clientName}.`;
		case 'opportunity':
			return `Optimistic before/after visual of user support improvement with ${mascotName}.`;
		case 'solution':
			return 'Three-block solution visual: character, AI intelligence, interaction layer.';
		case 'what-notso-does':
			return '2x2 capability card visual with product-style iconography and mascot accents.';
		case 'meet-buddy':
			return `${mascotName} full-body hero render with expressive personality variations.`;
		case 'experience-concept':
			return `Concept diagram with ${mascotName} moving between key product moments.`;
		case 'chat-flow':
			return 'Structured chat funnel visual with simple step transitions.';
		case 'example-interaction':
			return 'Large phone/tablet mockup with realistic chat bubbles and mascot overlap.';
		case 'business-impact':
			return 'Bold dark-slide impact icons for conversion, support, engagement, and brand lift.';
		case 'data-analytics':
			return 'Dashboard mockup with clean charts and mascot helper element.';
		case 'what-you-get':
			return 'Four-column product deliverable visual with icons and concise labels.';
		case 'pricing':
			return 'Premium SaaS three-tier pricing card visual with highlighted recommended tier.';
		case 'timeline':
			return 'Horizontal three-phase timeline visual with milestones.';
		case 'closing':
			return `${mascotName} closing hero visual with confident CTA atmosphere.`;
		default:
			return `Premium visual for ${project.clientName} proposal slide.`;
	}
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

	const imagePrompts = d.imagePrompts.length
		? d.imagePrompts.slice(0, 30)
		: [
			`Cover hero visual with ${project.mascotName} and tablet mockup for ${project.clientName}.`,
			'Problem-state visual with fragmented customer support journey.',
			'Opportunity visual showing before/after support transformation.',
			'Solution visual with 3 modular pillars: character, AI, interaction.',
			'Capability grid visual with icon-based cards and mascot accents.',
			`${project.mascotName} full character hero render with expressions.`,
			'Experience concept visual flow with mascot between touchpoints.',
			'Chat funnel visual with step-by-step conversation blocks.',
			'Large interaction mockup with realistic chat bubbles and mascot.',
			'Dark impact slide with bold conversion/support/engagement icons.',
			'Analytics dashboard visual with clean charts and KPIs.',
			'Four-column deliverables visual with productized sections.',
			'Premium SaaS pricing comparison cards with highlighted tier.',
			'Horizontal 3-phase timeline with milestones.',
			`Closing hero visual for ${project.mascotName} with confident CTA.`,
		];

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

	const allSlides: SlideData[] = [
		withSlide(
			'cover',
			'cover',
			project.projectTitle,
			project.coverOneLiner,
			'Create immediate emotional impact and context.',
			'projectTitle',
			{
				oneLiner: project.coverOneLiner,
				proposalDate: project.proposalDate,
				mascotName: project.mascotName,
				clientName: project.clientName,
			},
		),
		withSlide(
			'problem',
			'problem',
			'The Problem',
			'What is blocking growth today.',
			'Create tension and urgency.',
			'problemPoints',
			{
				points: content.problemPoints,
			},
		),
		withSlide(
			'opportunity',
			'opportunity',
			'The Opportunity',
			'What becomes possible with the right assistant.',
			'Shift from friction to possibility.',
			'opportunityPoints',
			{
				points: content.opportunityPoints,
			},
		),
		withSlide(
			'solution',
			'solution',
			'The Solution',
			'Character + AI + interaction model.',
			'Provide simple clarity of approach.',
			'solutionPillars',
			{
				pillars: content.solutionPillars,
			},
		),
		withSlide(
			'what-notso-does',
			'what-notso-does',
			'What Notso AI Does',
			'A productized approach to animated AI assistants.',
			'Build credibility with clear capability blocks.',
			'whatNotsoCards',
			{
				intro: content.whatNotsoIntro,
				cards: content.whatNotsoCards,
			},
		),
		withSlide(
			'meet-buddy',
			'meet-buddy',
			`Meet ${project.mascotName}`,
			'Personality and tone profile.',
			'Create emotional connection with the mascot.',
			'buddyDescription',
			{
				mascotName: project.mascotName,
				description: content.buddyDescription,
				personality: content.buddyPersonality,
				toneSliders: content.toneSliders,
			},
		),
		withSlide(
			'experience-concept',
			'experience-concept',
			'Experience Concept',
			'How the assistant moves across product moments.',
			'Show interaction concept and visual journey.',
			'experienceConcept',
			{
				points: content.experienceConcept,
			},
		),
		withSlide(
			'chat-flow',
			'chat-flow',
			'Chat Flow',
			'The logic behind each conversation.',
			'Explain the operational conversation steps.',
			'chatFlow',
			{
				steps: content.chatFlow,
			},
		),
		withSlide(
			'example-interaction',
			'example-interaction',
			'Example Interaction',
			'How it feels in a real user moment.',
			'Make the concept tangible with a realistic interaction.',
			'interactionExample',
			{
				messages: content.interactionExample,
				mascotName: project.mascotName,
			},
		),
		withSlide(
			'business-impact',
			'business-impact',
			'Business Impact',
			'The commercial outcome of this assistant.',
			'Sell business value in one glance.',
			'businessImpact',
			{
				impacts: content.businessImpact,
			},
		),
		withSlide(
			'data-analytics',
			'data-analytics',
			'Data & Analytics',
			'Insights that improve performance over time.',
			'Show the intelligence and measurable layer.',
			'analyticsBullets',
			{
				description: content.analyticsDescription,
				bullets: content.analyticsBullets,
			},
		),
		withSlide(
			'what-you-get',
			'what-you-get',
			'What You Get',
			'Deliverables packaged for deployment and growth.',
			'Clarify exactly what is included.',
			'deliverables',
			{
				sections: content.deliverables,
			},
		),
		withSlide(
			'pricing',
			'pricing',
			'Pricing',
			'Flexible solutions based on ambition and scope.',
			'Make decision-making easy.',
			'pricing',
			{
				packages: content.pricing,
			},
		),
		withSlide(
			'timeline',
			'timeline',
			'Timeline',
			'A clear 3-month execution path.',
			'Reduce risk with transparent phasing.',
			'timeline',
			{
				phases: content.timeline,
			},
		),
		withSlide(
			'closing',
			'closing',
			"Let's Build This Together",
			'From concept to launch-ready experience.',
			'Drive commitment and next action.',
			'closingText',
			{
				headline: `Let's build ${project.mascotName}`,
				text: content.closingText,
				team: content.teamCards,
				contactName: project.contactName,
				contactEmail: project.contactEmail,
				contactPhone: project.contactPhone,
				mascotName: project.mascotName,
			},
		),
	];

	const slidesWithLayout: SlideWithLayout[] = allSlides.map((slide, index) => {
		const lockedLayout = layoutPreset.slideLayoutByType[slide.type];
		const imageRatio = layoutPreset.imageRatioByType[slide.type];
		const backgroundMode = layoutPreset.backgroundModeByType[slide.type];
		const layoutKey = d.layoutPresetLock
			? lockedLayout || slide.type
			: safeText(d[`layout_${slide.id}`], lockedLayout || slide.type);
		const slotPolicy = resolveSlotPolicy(slide.type);
		const imageMode = resolveImageModeForSlide(slide.type, '');

		return {
			...slide,
			layoutKey,
			imageRatio,
			backgroundMode,
			imagePrompt: content.imagePrompts[index]
				|| defaultImagePrompt(slide.type, project, project.mascotName),
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
