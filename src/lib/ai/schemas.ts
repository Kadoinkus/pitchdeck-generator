/**
 * Zod schemas for AI provider response parsing.
 * All external AI responses must be parsed through these schemas.
 */
import { z } from 'zod';

// --- Suggested Changes (chat/autofill responses) ---

export const SuggestedChangeSchema = z.object({
	field: z.coerce.string().trim().catch(''),
	label: z.coerce.string().trim().catch(''),
	value: z.coerce.string().trim().catch(''),
});

export type SuggestedChange = z.infer<typeof SuggestedChangeSchema>;

export const SuggestedChangesSchema = z
	.array(SuggestedChangeSchema.passthrough())
	.catch([])
	.transform((arr) => arr.filter((c) => c.field !== ''));

// --- Autofill Draft ---

export const AutofillDraftSchema = z.record(z.string(), z.coerce.string().trim()).catch({});

// --- Image Prompts ---

export const ImagePromptSchema = z.object({
	slideId: z.coerce.string().trim().catch(''),
	slideTitle: z.coerce.string().trim().catch(''),
	prompt: z.coerce.string().trim().catch(''),
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
	combinedPromptText: z.coerce.string().trim().catch(''),
	prompts: ImagePromptsSchema.default([]),
});

export type ImageDraft = z.infer<typeof ImageDraftSchema>;

// --- Chat Response ---

export const ChatResponseSchema = z.object({
	reply: z.coerce.string().trim().catch('Suggestions are ready.'),
	suggestedChanges: SuggestedChangesSchema.default([]),
});

// --- Autofill Response ---

export const AutofillResponseSchema = z.object({
	draft: AutofillDraftSchema.default({}),
	imageDraft: ImageDraftSchema.catch({ combinedPromptText: '', prompts: [] }),
});

// --- AI Config (from form payload) ---

export const AiConfigSchema = z
	.object({
		aiTextProvider: z.coerce.string().trim().toLowerCase().default('local'),
		aiTextModel: z.coerce.string().trim().default('gpt-5.4-mini'),
		aiTextApiKey: z.coerce.string().trim().default(''),
		aiTextBaseUrl: z.coerce.string().trim().default(''),
		aiImageProvider: z.coerce.string().trim().toLowerCase().default('local'),
		aiImageModel: z.coerce.string().trim().default('gpt-5.4-mini'),
		aiImageApiKey: z.coerce.string().trim().default(''),
		aiImageBaseUrl: z.coerce.string().trim().default(''),
		aiApiKey: z.coerce.string().trim().default(''),
		aiBaseUrl: z.coerce.string().trim().default(''),
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
	targetField: z.coerce.string().trim().default('global-concept'),
	message: z.coerce.string().trim().default('Improve this section.'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
