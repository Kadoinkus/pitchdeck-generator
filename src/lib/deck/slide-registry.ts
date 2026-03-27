import type { Content, Project, SlideData, SlideType } from '$lib/deck/types';

/* ------------------------------------------------------------------ */
/*  SlideSpec — single source of truth for each slide                 */
/* ------------------------------------------------------------------ */

export interface SlideSpec {
	readonly id: string;
	readonly label: string;
	readonly type: SlideType;
	readonly field: string;
	readonly required: boolean;
	readonly optional: boolean;
	readonly defaultIncluded: boolean;
	readonly title: string | ((project: Project) => string);
	readonly subtitle: string | ((project: Project) => string);
	readonly purpose: string;
	readonly defaultImagePrompt: string | ((project: Project) => string);
	readonly buildContent: (project: Project, content: Content) => Record<string, unknown>;
}

function resolveText(value: string | ((project: Project) => string), project: Project): string {
	return typeof value === 'function' ? value(project) : value;
}

/* ------------------------------------------------------------------ */
/*  Registry                                                          */
/* ------------------------------------------------------------------ */

export const SLIDE_SPECS: readonly SlideSpec[] = [
	{
		id: 'cover',
		label: 'Cover',
		type: 'cover',
		field: 'projectTitle',
		required: true,
		optional: false,
		defaultIncluded: true,
		title: (p) => p.projectTitle,
		subtitle: (p) => p.coverOneLiner,
		purpose: 'Create immediate emotional impact and context.',
		defaultImagePrompt: (p) =>
			`Hero composition with ${p.mascotName} overlapping device UI for ${p.clientName}.`,
		buildContent: (p) => ({
			oneLiner: p.coverOneLiner,
			proposalDate: p.proposalDate,
			mascotName: p.mascotName,
			clientName: p.clientName,
		}),
	},
	{
		id: 'problem',
		label: 'The Problem',
		type: 'problem',
		field: 'problemPoints',
		required: true,
		optional: false,
		defaultIncluded: true,
		title: 'The Problem',
		subtitle: 'What is blocking growth today.',
		purpose: 'Create tension and urgency.',
		defaultImagePrompt: (p) =>
			`Clean problem-state visual showing friction in support journey for ${p.clientName}.`,
		buildContent: (_p, c) => ({ points: c.problemPoints }),
	},
	{
		id: 'opportunity',
		label: 'The Opportunity',
		type: 'opportunity',
		field: 'opportunityPoints',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'The Opportunity',
		subtitle: 'What becomes possible with the right assistant.',
		purpose: 'Shift from friction to possibility.',
		defaultImagePrompt: (p) =>
			`Optimistic before/after visual of user support improvement with ${p.mascotName}.`,
		buildContent: (_p, c) => ({ points: c.opportunityPoints }),
	},
	{
		id: 'solution',
		label: 'The Solution',
		type: 'solution',
		field: 'solutionPillars',
		required: true,
		optional: false,
		defaultIncluded: true,
		title: 'The Solution',
		subtitle: 'Character + AI + interaction model.',
		purpose: 'Provide simple clarity of approach.',
		defaultImagePrompt:
			'Three-block solution visual: character, AI intelligence, interaction layer.',
		buildContent: (_p, c) => ({ pillars: c.solutionPillars }),
	},
	{
		id: 'what-notso-does',
		label: 'What Notso AI Does',
		type: 'what-notso-does',
		field: 'whatNotsoCards',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'What Notso AI Does',
		subtitle: 'A productized approach to animated AI assistants.',
		purpose: 'Build credibility with clear capability blocks.',
		defaultImagePrompt:
			'2x2 capability card visual with product-style iconography and mascot accents.',
		buildContent: (_p, c) => ({ intro: c.whatNotsoIntro, cards: c.whatNotsoCards }),
	},
	{
		id: 'meet-buddy',
		label: 'Meet The Buddy',
		type: 'meet-buddy',
		field: 'buddyDescription',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: (p) => `Meet ${p.mascotName}`,
		subtitle: 'Personality and tone profile.',
		purpose: 'Create emotional connection with the mascot.',
		defaultImagePrompt: (p) =>
			`${p.mascotName} full-body hero render with expressive personality variations.`,
		buildContent: (p, c) => ({
			mascotName: p.mascotName,
			description: c.buddyDescription,
			personality: c.buddyPersonality,
			toneSliders: c.toneSliders,
		}),
	},
	{
		id: 'experience-concept',
		label: 'Experience Concept',
		type: 'experience-concept',
		field: 'experienceConcept',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'Experience Concept',
		subtitle: 'How the assistant moves across product moments.',
		purpose: 'Show interaction concept and visual journey.',
		defaultImagePrompt: (p) =>
			`Concept diagram with ${p.mascotName} moving between key product moments.`,
		buildContent: (_p, c) => ({ points: c.experienceConcept }),
	},
	{
		id: 'chat-flow',
		label: 'Chat Flow',
		type: 'chat-flow',
		field: 'chatFlow',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'Chat Flow',
		subtitle: 'The logic behind each conversation.',
		purpose: 'Explain the operational conversation steps.',
		defaultImagePrompt: 'Structured chat funnel visual with simple step transitions.',
		buildContent: (_p, c) => ({ steps: c.chatFlow }),
	},
	{
		id: 'example-interaction',
		label: 'Example Interaction',
		type: 'example-interaction',
		field: 'interactionExample',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'Example Interaction',
		subtitle: 'How it feels in a real user moment.',
		purpose: 'Make the concept tangible with a realistic interaction.',
		defaultImagePrompt: 'Large phone/tablet mockup with realistic chat bubbles and mascot overlap.',
		buildContent: (p, c) => ({ messages: c.interactionExample, mascotName: p.mascotName }),
	},
	{
		id: 'business-impact',
		label: 'Business Impact',
		type: 'business-impact',
		field: 'businessImpact',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'Business Impact',
		subtitle: 'The commercial outcome of this assistant.',
		purpose: 'Sell business value in one glance.',
		defaultImagePrompt:
			'Bold dark-slide impact icons for conversion, support, engagement, and brand lift.',
		buildContent: (_p, c) => ({ impacts: c.businessImpact }),
	},
	{
		id: 'data-analytics',
		label: 'Data & Analytics',
		type: 'data-analytics',
		field: 'analyticsBullets',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'Data & Analytics',
		subtitle: 'Insights that improve performance over time.',
		purpose: 'Show the intelligence and measurable layer.',
		defaultImagePrompt: 'Dashboard mockup with clean charts and mascot helper element.',
		buildContent: (_p, c) => ({ description: c.analyticsDescription, bullets: c.analyticsBullets }),
	},
	{
		id: 'what-you-get',
		label: 'What You Get',
		type: 'what-you-get',
		field: 'deliverables',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'What You Get',
		subtitle: 'Deliverables packaged for deployment and growth.',
		purpose: 'Clarify exactly what is included.',
		defaultImagePrompt: 'Four-column product deliverable visual with icons and concise labels.',
		buildContent: (_p, c) => ({ sections: c.deliverables }),
	},
	{
		id: 'pricing',
		label: 'Pricing',
		type: 'pricing',
		field: 'pricing',
		required: true,
		optional: false,
		defaultIncluded: true,
		title: 'Pricing',
		subtitle: 'Flexible solutions based on ambition and scope.',
		purpose: 'Make decision-making easy.',
		defaultImagePrompt:
			'Premium SaaS three-tier pricing card visual with highlighted recommended tier.',
		buildContent: (_p, c) => ({ packages: c.pricing }),
	},
	{
		id: 'timeline',
		label: 'Timeline',
		type: 'timeline',
		field: 'timeline',
		required: false,
		optional: true,
		defaultIncluded: true,
		title: 'Timeline',
		subtitle: 'A clear 3-month execution path.',
		purpose: 'Reduce risk with transparent phasing.',
		defaultImagePrompt: 'Horizontal three-phase timeline visual with milestones.',
		buildContent: (_p, c) => ({ phases: c.timeline }),
	},
	{
		id: 'closing',
		label: 'Closing',
		type: 'closing',
		field: 'closingText',
		required: true,
		optional: false,
		defaultIncluded: true,
		title: "Let's Build This Together",
		subtitle: 'From concept to launch-ready experience.',
		purpose: 'Drive commitment and next action.',
		defaultImagePrompt: (p) => `${p.mascotName} closing hero visual with confident CTA atmosphere.`,
		buildContent: (p, c) => ({
			headline: `Let's build ${p.mascotName}`,
			text: c.closingText,
			team: c.teamCards,
			contactName: p.contactName,
			contactEmail: p.contactEmail,
			contactPhone: p.contactPhone,
			mascotName: p.mascotName,
		}),
	},
];

export const SLIDE_SPEC_BY_ID = new Map(
	SLIDE_SPECS.map((spec) => [spec.id, spec]),
);

/* ------------------------------------------------------------------ */
/*  Derived helpers                                                    */
/* ------------------------------------------------------------------ */

// CAUTION: buildContent result is spread after base fields (id, type, title, etc.)
// If buildContent ever returns those keys, they'll shadow base fields.
export function buildSlidesFromSpecs(project: Project, content: Content): SlideData[] {
	return SLIDE_SPECS.map((spec) => ({
		id: spec.id,
		type: spec.type,
		title: resolveText(spec.title, project),
		subtitle: resolveText(spec.subtitle, project),
		purpose: spec.purpose,
		sourceField: spec.field,
		...spec.buildContent(project, content),
	}));
}

export function getDefaultImagePrompt(slideId: string, project: Project): string {
	const spec = SLIDE_SPEC_BY_ID.get(slideId);
	if (!spec) return `Premium visual for ${project.clientName} proposal slide.`;
	return resolveText(spec.defaultImagePrompt, project);
}
