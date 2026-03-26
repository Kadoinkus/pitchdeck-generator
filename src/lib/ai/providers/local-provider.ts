import type { AutofillResult, ChatRequest, ChatResult } from '$lib/ai/orchestrator';
import { ChatRequestSchema } from '$lib/ai/schemas';
import { buildDeckModel, getEditableFieldDefinitions } from '$lib/deck-model';

const FIELD_LABELS = new Map(
	getEditableFieldDefinitions().map((field) => [field.name, field.label]),
);

function domainFromUrl(url: unknown): string {
	try {
		const urlStr = typeof url === 'string' && url.trim() ? url.trim() : '';
		const parsed = new URL(
			urlStr.startsWith('http') ? urlStr : `https://${urlStr}`,
		);
		return parsed.hostname.replace(/^www\./i, '');
	} catch {
		return typeof url === 'string' && url.trim() ? url.trim() : 'client website';
	}
}

function listToString(items: string[]): string {
	return items
		.map((item) => String(item).trim())
		.filter(Boolean)
		.join('\n');
}

type DeckModel = ReturnType<typeof buildDeckModel>;

export async function localGenerateAutofill(
	rawData: Record<string, unknown> = {},
): Promise<AutofillResult> {
	const model = buildDeckModel(rawData);
	const { project, deckTheme, slides } = model;
	const domain = domainFromUrl(project.clientUrl);

	const draft: Record<string, string> = {
		projectTitle: `AI Mascot for ${project.clientName}`,
		coverOneLiner: 'A playful, animated chatbot experience that feels premium and converts.',
		subtitle: `Premium digital buddy strategy for ${project.clientName}.`,
		proposalDate: 'June 2026',
		mascotName: project.mascotName || 'Sven',

		problemPoints: listToString([
			`${project.clientName} loses conversion momentum when visitors do not get instant answers.`,
			'Support teams repeatedly handle similar questions manually.',
			`Automation on ${domain} feels generic and not brand-distinctive.`,
		]),
		opportunityPoints: listToString([
			'Turn support into guided conversion moments.',
			'Increase engagement with a memorable character experience.',
			'Scale conversations while keeping premium brand tone.',
		]),
		solutionPillars: listToString([
			'Character :: A recognizable mascot with clear brand personality.',
			'AI :: Context-aware replies and smart routing.',
			'Interaction :: Clean UI flows that move users to next actions.',
		]),
		whatNotsoIntro:
			`Notso AI designs and deploys animated AI assistants that combine personality with measurable business value for ${project.clientName}.`,
		whatNotsoCards: listToString([
			'Strategy & Personality :: Define voice, role, and emotional behavior.',
			'Design & Animation :: Build polished mascot visuals and motion.',
			'Smart Conversations :: Structure intent flows for conversion and support.',
			'Measurable Impact :: Track behavior, trends, and outcomes.',
		]),
		buddyDescription: `${
			project.mascotName || 'Sven'
		} is a helpful, expressive guide designed to keep interactions clear, friendly, and conversion-focused.`,
		buddyPersonality: listToString([
			'Friendly and confident',
			'Helpful under pressure',
			'Consistent brand voice',
			'Fast and clear guidance',
		]),
		toneSliders: listToString([
			'Friendly :: 88',
			'Professional :: 76',
			'Playful :: 68',
			'Direct :: 82',
		]),
		experienceConcept: listToString([
			'Mascot welcomes users and frames intent quickly.',
			'Context-aware prompts guide users toward the right path.',
			'Recommendations adapt with each interaction.',
			'Clear CTA closes each flow with measurable action.',
		]),
		chatFlow: listToString([
			'Greeting',
			'Discovery',
			'Suggestions',
			'Personalization',
			'Conversion',
		]),
		interactionExample: listToString([
			'User: I need help selecting the right chair.',
			`${project.mascotName || 'Sven'}: Great, do you want ergonomic or lounge style?`,
			'User: Ergonomic for long work sessions.',
			`${project.mascotName || 'Sven'}: I recommend Comfort LX006, want a quick comparison?`,
		]),
		businessImpact: listToString([
			'Increase conversion',
			'Lower support load',
			'Boost engagement',
			'Strengthen brand recall',
		]),
		analyticsDescription:
			'Every interaction is tracked and analyzed so teams can improve messaging, product guidance, and conversion outcomes.',
		analyticsBullets: listToString([
			'Live dashboard for interactions and conversion',
			'Top questions and intent trends',
			'Dwell time and drop-off insight',
			'Exportable monthly reports',
		]),
		deliverables: listToString([
			'Deployment-ready mascot :: Branded character; expressive animations; launch assets',
			'Multichannel access :: Website widget; mobile support; campaign deployment',
			'Performance insights :: Real-time dashboard; monthly reporting; optimization notes',
			'Brand activation media :: Social visuals; video snippets; campaign-ready pack',
		]),
		pricing: listToString([
			'Basic - Chat :: EUR 2.600,- :: 3D mascot template;custom chat flows;emotion interactions',
			'Premium - Chat :: EUR 24.000,- :: custom mascot;40+ animations;advanced LLM integration',
			'Pro - Chat & Voice :: EUR 38.000,- :: voice layer;advanced analytics;pro media package',
		]),
		timeline: listToString([
			'Month 1 :: Discovery, strategy, concept sign-off.',
			'Month 2 :: Design, animation, flow implementation.',
			'Month 3 :: Integration, launch, optimization.',
		]),
		closingText: `Let's build ${
			project.mascotName || 'Sven'
		} and launch a premium conversational experience for ${project.clientName}.`,
		teamCards: listToString([
			'Strategy Lead :: Scope, priorities, and direction',
			'Conversation Designer :: Dialogue logic and quality',
			'Motion Designer :: Character and visual system',
			'Implementation Engineer :: Integration and launch',
		]),
	};

	const prompts = slides.map((slide, index) => ({
		slideId: slide.id,
		slideNumber: index + 1,
		slideTitle: slide.title,
		prompt:
			`Premium clean slide visual for "${slide.title}". Notso style, mascot-forward, high whitespace, colors ${deckTheme.primaryColor}, ${deckTheme.accentColor}, ${deckTheme.secondaryColor}, no text overlays.`,
	}));

	return {
		provider: 'local',
		draft,
		imageDraft: {
			prompts,
			combinedPromptText: prompts
				.map(
					(item) => `Slide ${item.slideNumber} (${item.slideId}) :: ${item.prompt}`,
				)
				.join('\n'),
		},
	};
}

function rewriteLines(
	currentValue: unknown,
	message: string,
	fallbackLines: string[],
): string {
	const lines = typeof currentValue === 'string'
		? currentValue.split('\n').map((line) => line.trim()).filter(Boolean)
		: [];

	const seed = lines.length ? lines : fallbackLines;
	return seed
		.slice(0, 6)
		.map((line, index) => (index === 0 ? `${line} (${message})` : line))
		.join('\n');
}

function defaultFieldValue(
	fieldName: string,
	model: DeckModel,
	message: string,
): string {
	const mascot = model.project.mascotName || 'Sven';

	switch (fieldName) {
		case 'subtitle':
			return `Premium animated assistant concept for ${model.project.clientName}, tuned to ${message}.`;
		case 'coverOneLiner':
			return `A mascot-first chatbot concept focused on ${message}.`;
		case 'closingText':
			return `Let's build ${mascot} and launch a premium experience focused on ${message}.`;
		case 'imagePrompts':
			return model.slides
				.map(
					(slide, index) => `Slide ${index + 1} (${slide.id}) :: ${slide.title} visual updated for ${message}.`,
				)
				.join('\n');
		default:
			return `${FIELD_LABELS.get(fieldName) || fieldName} updated for ${message}.`;
	}
}

function getContentField(
	content: DeckModel['content'],
	fieldName: string,
): unknown {
	// Content has index signature, safe to access by key
	return (content as Record<string, unknown>)[fieldName];
}

export async function localChatAssist(
	rawData: Record<string, unknown> = {},
	chatRequest: ChatRequest = {},
): Promise<ChatResult> {
	const model = buildDeckModel(rawData);
	const { targetField, message } = ChatRequestSchema.parse(chatRequest);

	if (targetField === 'global-concept') {
		return {
			provider: 'local',
			reply: `Refocused the core narrative toward: ${message}. Apply any suggestion below.`,
			suggestedChanges: [
				{
					field: 'coverOneLiner',
					label: FIELD_LABELS.get('coverOneLiner') || 'coverOneLiner',
					value: `A premium mascot-powered chatbot concept focused on ${message}.`,
				},
				{
					field: 'opportunityPoints',
					label: FIELD_LABELS.get('opportunityPoints') || 'opportunityPoints',
					value: rewriteLines(
						rawData.opportunityPoints,
						message,
						model.content.opportunityPoints,
					),
				},
				{
					field: 'businessImpact',
					label: FIELD_LABELS.get('businessImpact') || 'businessImpact',
					value: rewriteLines(
						rawData.businessImpact,
						message,
						model.content.businessImpact,
					),
				},
			],
		};
	}

	const rawValue = rawData[targetField];
	const currentValue = typeof rawValue === 'string' ? rawValue.trim() : '';
	const contentFieldValue = getContentField(model.content, targetField);
	const fallback: string[] = Array.isArray(contentFieldValue)
		? contentFieldValue.map((v: unknown) => String(v))
		: [defaultFieldValue(targetField, model, message)];
	const nextValue = currentValue
		? rewriteLines(currentValue, message, fallback)
		: defaultFieldValue(targetField, model, message);

	return {
		provider: 'local',
		reply: `Prepared an update for ${FIELD_LABELS.get(targetField) || targetField}.`,
		suggestedChanges: [
			{
				field: targetField,
				label: FIELD_LABELS.get(targetField) || targetField,
				value: nextValue,
			},
		],
	};
}
