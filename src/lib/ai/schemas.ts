/**
 * Zod schemas for AI provider response parsing.
 * All external AI responses must be parsed through these schemas.
 */
import { z } from 'zod';

// --- Primitives ---

/** Coerce unknown → trimmed string, fallback on undefined/null/error. */
const str = (fallback = '') => z.coerce.string().trim().catch(fallback).default(fallback);

// --- Suggested Changes (chat/autofill responses) ---

export const SuggestedChangeSchema = z.object({
	field: str(),
	label: str(),
	value: str(),
});

export type SuggestedChange = z.infer<typeof SuggestedChangeSchema>;

export const SuggestedChangesSchema = z
	.array(SuggestedChangeSchema.passthrough())
	.catch([])
	.transform((arr) => arr.filter((c) => c.field !== ''));

// --- Autofill Draft ---

export const AutofillDraftSchema = z
	.record(z.string(), z.coerce.string().trim())
	.catch({});

// --- Image Prompts ---

export const ImagePromptSchema = z.object({
	slideId: str(),
	slideTitle: str(),
	prompt: str(),
});

export type ImagePrompt = z.infer<typeof ImagePromptSchema>;

export const ImagePromptsSchema = z
	.array(ImagePromptSchema.passthrough())
	.catch([])
	.transform((arr) =>
		arr.map((item, index) => ({
			slideId: item.slideId || `slide-${index + 1}`,
			slideTitle: item.slideTitle || item.slideId || `Slide ${index + 1}`,
			prompt: item.prompt,
		}))
	);

export const ImageDraftSchema = z.object({
	combinedPromptText: str(),
	prompts: ImagePromptsSchema.default([]),
});

export type ImageDraft = z.infer<typeof ImageDraftSchema>;

// --- Chat Response ---

export const ChatResponseSchema = z.object({
	reply: str('Suggestions are ready.'),
	suggestedChanges: SuggestedChangesSchema.default([]),
});

// --- Autofill Response ---

export const AutofillResponseSchema = z.object({
	draft: AutofillDraftSchema.default({}),
	imageDraft: ImageDraftSchema.catch({ combinedPromptText: '', prompts: [] }),
});

// --- AI Config (from form payload) ---

const provider = z.coerce.string().trim().toLowerCase().catch('local').default('local');
const model = str('gpt-5.4-mini');
const optStr = str();

/** Parses raw form data with `ai*` prefixed fields into normalized config. */
export const AiConfigSchema = z
	.object({
		aiTextProvider: provider,
		aiTextModel: model,
		aiTextApiKey: optStr,
		aiTextBaseUrl: optStr,
		aiImageProvider: provider,
		aiImageModel: model,
		aiImageApiKey: optStr,
		aiImageBaseUrl: optStr,
		aiApiKey: optStr,
		aiBaseUrl: optStr,
	})
	.transform((d) => ({
		textProvider: d.aiTextProvider,
		textModel: d.aiTextModel,
		textApiKey: d.aiTextApiKey || d.aiApiKey,
		textBaseUrl: d.aiTextBaseUrl || d.aiBaseUrl,
		imageProvider: d.aiImageProvider,
		imageModel: d.aiImageModel,
		imageApiKey: d.aiImageApiKey || d.aiApiKey,
		imageBaseUrl: d.aiImageBaseUrl || d.aiBaseUrl,
	}));

export type AiConfig = z.infer<typeof AiConfigSchema>;

// --- Chat Request ---

export const ChatRequestSchema = z.object({
	targetField: str('global-concept'),
	message: str('Improve this section.'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
