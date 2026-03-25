import type {
	AutofillResult,
	ChatRequest,
	ChatResult,
	ImagePrompt,
	ProviderConfig,
	SuggestedChange,
} from '$lib/ai/orchestrator';
import { buildDeckModel, getEditableFieldDefinitions } from '$lib/deck-model';
import { isRecord, safeText } from '$lib/utils';

const ALL_FIELDS = getEditableFieldDefinitions().map((field) => field.name);
const ALLOWED_FIELDS = new Set(ALL_FIELDS);

const AUTOFILL_FIELDS = [
	'projectTitle',
	'coverOneLiner',
	'subtitle',
	'proposalDate',
	'mascotName',
	'problemPoints',
	'opportunityPoints',
	'solutionPillars',
	'whatNotsoIntro',
	'whatNotsoCards',
	'buddyDescription',
	'buddyPersonality',
	'toneSliders',
	'experienceConcept',
	'chatFlow',
	'interactionExample',
	'businessImpact',
	'analyticsDescription',
	'analyticsBullets',
	'deliverables',
	'pricing',
	'timeline',
	'closingText',
	'teamCards',
	'contactName',
	'contactEmail',
	'contactPhone',
];

const CHAT_FIELDS = [...AUTOFILL_FIELDS, 'imagePrompts'];

const MULTILINE_FIELDS = new Set([
	'problemPoints',
	'opportunityPoints',
	'solutionPillars',
	'whatNotsoCards',
	'buddyPersonality',
	'toneSliders',
	'experienceConcept',
	'chatFlow',
	'interactionExample',
	'businessImpact',
	'analyticsBullets',
	'deliverables',
	'pricing',
	'timeline',
	'teamCards',
]);

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenAIChatParams {
	apiKey: string;
	baseUrl: string;
	model: string;
	messages: ChatMessage[];
	temperature?: number;
}

interface OpenAIChoice {
	message?: {
		content?: string;
	};
}

interface OpenAIChatResponse {
	choices?: OpenAIChoice[];
}

function isOpenAIChatResponse(value: unknown): value is OpenAIChatResponse {
	return typeof value === 'object' && value !== null && 'choices' in value;
}

function normalizeBaseUrl(baseUrl: unknown): string {
	const value = safeText(baseUrl, 'https://api.openai.com/v1');
	return value.endsWith('/') ? value.slice(0, -1) : value;
}

function extractJsonObject(text: unknown): Record<string, unknown> {
	const trimmed = String(text || '').trim();
	if (!trimmed) throw new Error('AI response was empty.');

	try {
		const parsed: Record<string, unknown> = JSON.parse(trimmed);
		return parsed;
	} catch {
		const start = trimmed.indexOf('{');
		const end = trimmed.lastIndexOf('}');
		if (start < 0 || end <= start) {
			throw new Error('AI response did not contain JSON.');
		}

		const extracted: Record<string, unknown> = JSON.parse(
			trimmed.slice(start, end + 1),
		);
		return extracted;
	}
}

async function callOpenAIChat({
	apiKey,
	baseUrl,
	model,
	messages,
	temperature = 0.4,
}: OpenAIChatParams): Promise<string> {
	const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			temperature,
			messages,
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`OpenAI request failed (${response.status}): ${body.slice(0, 240)}`,
		);
	}

	const result: unknown = await response.json();
	if (!isOpenAIChatResponse(result)) {
		throw new Error('OpenAI returned unexpected response format.');
	}

	const content = result.choices?.[0]?.message?.content;
	if (!content) throw new Error('OpenAI returned no message content.');

	return content;
}

function sanitizeSuggestedChanges(changes: unknown): SuggestedChange[] {
	if (!Array.isArray(changes)) return [];

	return changes
		.map((change: unknown) => {
			const item: Record<string, unknown> | null | undefined = isRecord(change)
				? change
				: null;
			return {
				field: safeText(item?.field),
				label: safeText(item?.label),
				value: safeText(item?.value),
			};
		})
		.filter(
			(change): change is SuggestedChange =>
				change.field !== ''
				&& ALLOWED_FIELDS.has(change.field)
				&& change.value !== '',
		);
}

function sanitizeDraft(draft: unknown): Record<string, string> {
	const output: Record<string, string> = {};
	if (!isRecord(draft)) return output;

	AUTOFILL_FIELDS.forEach((fieldName) => {
		if (!(fieldName in draft)) return;
		output[fieldName] = safeText(draft[fieldName]);
	});

	return output;
}

export async function openAIAutofill(
	rawData: Record<string, unknown> = {},
	config: ProviderConfig,
): Promise<AutofillResult> {
	const model = buildDeckModel(rawData);
	const { project, template, availableSlides } = model;
	const includedSlides = availableSlides
		.filter((slide) => slide.included)
		.map((slide) => slide.id);
	const fieldGuide = AUTOFILL_FIELDS.map((fieldName) => {
		const formatHint = MULTILINE_FIELDS.has(fieldName)
			? 'multiline string'
			: 'single line string';
		return `- ${fieldName}: ${formatHint}`;
	}).join('\n');

	const prompt = `\
Return JSON only. No markdown.
Create premium sales-deck copy for an animated AI chatbot proposal.
Template: ${template.label}
Client: ${project.clientName}
Client URL: ${project.clientUrl}
Included slides: ${includedSlides.join(', ')}

Field requirements:
${fieldGuide}

Multiline formatting rules:
- Use one item per line for list-like fields.
- For structured lists use "Title :: Description" per line.
- Keep all lines concise, persuasive, and client-ready.

Output JSON schema:
{
  "draft": { "...": "..." },
  "imageDraft": {
    "prompts": [
      {"slideId":"cover","slideTitle":"Cover","prompt":"..."}
    ]
  }
}

Image prompt rules:
- One prompt per included slide id.
- No text overlays in image prompts.
- Describe composition, mood, subject, and style clearly.`;

	const content = await callOpenAIChat({
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		model: config.model,
		temperature: 0.45,
		messages: [
			{
				role: 'system',
				content: 'You are a proposal deck content generator. Always respond with strict JSON.',
			},
			{ role: 'user', content: prompt },
		],
	});

	const parsed = extractJsonObject(content);
	const imageDraftRaw = isRecord(parsed.imageDraft)
		? parsed.imageDraft
		: undefined;
	const prompts: unknown[] = Array.isArray(imageDraftRaw?.prompts)
		? imageDraftRaw.prompts
		: [];

	const sanitizedPrompts: ImagePrompt[] = prompts
		.map((item: unknown, index: number) => {
			const entry = isRecord(item) ? item : null;
			return {
				slideId: safeText(
					entry?.slideId,
					includedSlides[index] || `slide-${index + 1}`,
				),
				slideNumber: index + 1,
				slideTitle: safeText(
					entry?.slideTitle,
					safeText(entry?.slideId, `Slide ${index + 1}`),
				),
				prompt: safeText(entry?.prompt),
			};
		})
		.filter((item) => item.prompt !== '');

	return {
		provider: 'openai',
		draft: sanitizeDraft(parsed.draft),
		imageDraft: {
			prompts: sanitizedPrompts,
			combinedPromptText: sanitizedPrompts
				.map(
					(item) => `Slide ${item.slideNumber} (${item.slideId}) :: ${item.prompt}`,
				)
				.join('\n'),
		},
	};
}

export async function openAIChatAssist(
	rawData: Record<string, unknown> = {},
	chatRequest: ChatRequest = {},
	config: ProviderConfig,
): Promise<ChatResult> {
	const targetField = safeText(chatRequest.targetField, 'global-concept');
	const message = safeText(chatRequest.message, 'Improve this section.');

	const model = buildDeckModel(rawData);
	const context = {
		targetField,
		message,
		clientName: model.project.clientName,
		clientUrl: model.project.clientUrl,
		template: model.template.label,
		currentValue: safeText(rawData[targetField], ''),
		allowedFields: CHAT_FIELDS,
	};

	const prompt = `\
Return JSON only.
You are editing one part of a premium proposal deck.
JSON schema:
{
  "reply": "Short guidance reply",
  "suggestedChanges": [
    {"field":"coverOneLiner","label":"Cover one-liner","value":"..."}
  ]
}

Context: ${JSON.stringify(context)}

Rules:
- suggestedChanges.field must be from allowedFields.
- If targetField is "global-concept", suggest up to 3 high-impact fields.
- Keep wording concise, premium, and implementation-ready.`;

	const content = await callOpenAIChat({
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		model: config.model,
		temperature: 0.55,
		messages: [
			{
				role: 'system',
				content: 'You are a deck editing copilot. Always return strict JSON only.',
			},
			{ role: 'user', content: prompt },
		],
	});

	const parsed = extractJsonObject(content);

	return {
		provider: 'openai',
		reply: safeText(parsed.reply, 'Draft suggestions prepared.'),
		suggestedChanges: sanitizeSuggestedChanges(parsed.suggestedChanges),
	};
}
