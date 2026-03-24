import { getEditableFieldDefinitions } from '../deck-model.ts';
import { isRecord, safeText } from '../utils.ts';
import { localChatAssist, localGenerateAutofill } from './providers/local-provider.ts';
import { openAIAutofill, openAIChatAssist } from './providers/openai-provider.ts';

export interface SuggestedChange {
	field: string;
	label: string;
	value: string;
}

export interface ImagePrompt {
	slideId: string;
	slideNumber: number;
	slideTitle: string;
	prompt: string;
}

export interface ImageDraft {
	prompts: ImagePrompt[];
	combinedPromptText: string;
}

export interface AutofillResult {
	provider: string;
	draft: Record<string, string>;
	imageDraft: ImageDraft;
}

export interface ChatResult {
	provider: string;
	reply: string;
	suggestedChanges: SuggestedChange[];
}

export interface ChatRequest {
	targetField?: unknown;
	message?: unknown;
}

interface AiConfig {
	textProvider: string;
	textModel: string;
	textApiKey: string;
	textBaseUrl: string;
	imageProvider: string;
	imageModel: string;
	imageApiKey: string;
	imageBaseUrl: string;
}

export interface ProviderConfig {
	apiKey: string;
	model: string;
	baseUrl: string;
}

interface ProviderDefinition {
	id: string;
	label: string;
}

interface AiProviderDefinitions {
	textProviders: ProviderDefinition[];
	imageProviders: ProviderDefinition[];
}

const EDITABLE_FIELDS = new Set(
	getEditableFieldDefinitions().map((field) => field.name),
);

function sanitizeChanges(changes: unknown): SuggestedChange[] {
	if (!Array.isArray(changes)) return [];

	return changes
		.map((change: unknown) => {
			const item = isRecord(change) ? change : null;
			return {
				field: safeText(item?.field),
				label: safeText(item?.label),
				value: safeText(item?.value),
			};
		})
		.filter(
			(change): change is SuggestedChange =>
				change.field !== ''
				&& EDITABLE_FIELDS.has(change.field)
				&& change.value !== '',
		);
}

function resolveAiConfig(rawData: Record<string, unknown> = {}): AiConfig {
	return {
		textProvider: safeText(rawData.aiTextProvider, 'local').toLowerCase(),
		textModel: safeText(rawData.aiTextModel, 'gpt-4.1-mini'),
		textApiKey: safeText(
			rawData.aiTextApiKey,
			process.env.OPENAI_API_KEY || '',
		),
		textBaseUrl: safeText(
			rawData.aiTextBaseUrl,
			process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
		),

		imageProvider: safeText(rawData.aiImageProvider, 'local').toLowerCase(),
		imageModel: safeText(rawData.aiImageModel, 'gpt-4.1-mini'),
		imageApiKey: safeText(
			rawData.aiImageApiKey,
			process.env.OPENAI_API_KEY || '',
		),
		imageBaseUrl: safeText(
			rawData.aiImageBaseUrl,
			process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
		),
	};
}

export function getAiProviderDefinitions(): AiProviderDefinitions {
	return {
		textProviders: [
			{ id: 'local', label: 'Local draft engine (no key)' },
			{ id: 'openai', label: 'OpenAI compatible endpoint' },
		],
		imageProviders: [
			{ id: 'local', label: 'Local prompt engine (no key)' },
			{ id: 'openai', label: 'OpenAI compatible endpoint' },
		],
	};
}

export async function generateAutofill(
	rawData: Record<string, unknown> = {},
): Promise<AutofillResult> {
	const config = resolveAiConfig(rawData);
	let output: AutofillResult | null = null;

	if (config.textProvider === 'openai' && config.textApiKey) {
		try {
			output = await openAIAutofill(rawData, {
				apiKey: config.textApiKey,
				model: config.textModel,
				baseUrl: config.textBaseUrl,
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(
				'OpenAI autofill failed, falling back to local engine:',
				message,
			);
		}
	}

	if (!output) {
		output = await localGenerateAutofill(rawData);
	}

	return {
		...output,
		draft: output.draft || {},
		imageDraft: output.imageDraft || { prompts: [], combinedPromptText: '' },
	};
}

export async function runChatAssistant(
	rawData: Record<string, unknown> = {},
	chatRequest: ChatRequest = {},
): Promise<ChatResult> {
	const config = resolveAiConfig(rawData);
	let response: ChatResult | null = null;

	if (config.textProvider === 'openai' && config.textApiKey) {
		try {
			response = await openAIChatAssist(rawData, chatRequest, {
				apiKey: config.textApiKey,
				model: config.textModel,
				baseUrl: config.textBaseUrl,
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(
				'OpenAI chat assistant failed, falling back to local engine:',
				message,
			);
		}
	}

	if (!response) {
		response = await localChatAssist(rawData, chatRequest);
	}

	return {
		provider: response.provider || 'local',
		reply: safeText(response.reply, 'Suggestions are ready.'),
		suggestedChanges: sanitizeChanges(response.suggestedChanges),
	};
}
