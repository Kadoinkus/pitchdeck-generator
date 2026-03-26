import { localChatAssist, localGenerateAutofill } from '$lib/ai/providers/local-provider';
import { openAIAutofill, openAIChatAssist } from '$lib/ai/providers/openai-provider';
import {
	type AiConfig,
	AiConfigSchema,
	type ImageDraft,
	type ImagePrompt,
	type SuggestedChange,
	SuggestedChangesSchema,
} from '$lib/ai/schemas';
import { getEditableFieldDefinitions } from '$lib/deck-model';

export type { AiConfig, ImageDraft, ImagePrompt, SuggestedChange };

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
	return SuggestedChangesSchema.parse(changes).filter(
		(change) => EDITABLE_FIELDS.has(change.field) && change.value !== '',
	);
}

function resolveAiConfig(rawData: Record<string, unknown> = {}): AiConfig {
	const base = AiConfigSchema.parse({
		textProvider: rawData.aiTextProvider,
		textModel: rawData.aiTextModel,
		textApiKey: rawData.aiTextApiKey,
		textBaseUrl: rawData.aiTextBaseUrl,
		imageProvider: rawData.aiImageProvider,
		imageModel: rawData.aiImageModel,
		imageApiKey: rawData.aiImageApiKey,
		imageBaseUrl: rawData.aiImageBaseUrl,
	});

	// Apply env fallbacks
	return {
		...base,
		textApiKey: base.textApiKey || process.env.OPENAI_API_KEY || '',
		textBaseUrl: base.textBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
		imageApiKey: base.imageApiKey || process.env.OPENAI_API_KEY || '',
		imageBaseUrl: base.imageBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
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
		reply: typeof response.reply === 'string' ? response.reply.trim() : 'Suggestions are ready.',
		suggestedChanges: sanitizeChanges(response.suggestedChanges),
	};
}
