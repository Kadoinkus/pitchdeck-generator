/**
 * Zod schemas for AI provider response parsing.
 * All external AI responses must be parsed through these schemas.
 */
import { string, z } from 'zod';

// --- Primitives ---

/** Coerce unknown to trimmed string with fallback. */
const text = (fallback = '') => z.unknown().transform((v) => String(v ?? fallback).trim());

/** Coerce unknown to string, empty if nullish. */
const optionalText = () => z.unknown().transform((v) => (v == null ? '' : String(v).trim()));

// --- Suggested Changes (chat/autofill responses) ---

export const SuggestedChangeSchema = z.object({
	field: optionalText(),
	label: optionalText(),
	value: optionalText(),
});

export type SuggestedChange = z.infer<typeof SuggestedChangeSchema>;

export const SuggestedChangesSchema = z
	.unknown()
	.transform((v) => (Array.isArray(v) ? v : []))
	.pipe(z.array(z.unknown()))
	.transform((arr) =>
		arr
			.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
			.map((item) => SuggestedChangeSchema.parse(item))
			.filter((c) => c.field !== '')
	);

// --- Autofill Draft ---

export const AutofillDraftSchema = z
	.unknown()
	.transform((v) => typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {})
	.transform((obj) => {
		const result: Record<string, string> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value != null) {
				result[key] = String(value).trim();
			}
		}
		return result;
	});

// --- Image Prompts ---

export const ImagePromptSchema = z.object({
	slideId: optionalText(),
	slideTitle: optionalText(),
	prompt: optionalText(),
});

export type ImagePrompt = z.infer<typeof ImagePromptSchema>;

export const ImagePromptsSchema = z
	.unknown()
	.transform((v) => (Array.isArray(v) ? v : []))
	.pipe(z.array(z.unknown()))
	.transform((arr) =>
		arr
			.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
			.map((item, index) => {
				const parsed = ImagePromptSchema.parse(item);
				return {
					slideId: parsed.slideId || `slide-${index + 1}`,
					slideTitle: parsed.slideTitle || parsed.slideId || `Slide ${index + 1}`,
					prompt: parsed.prompt,
				};
			})
	);

export const ImageDraftSchema = z.object({
	combinedPromptText: optionalText(),
	prompts: ImagePromptsSchema.default([]),
});

export type ImageDraft = z.infer<typeof ImageDraftSchema>;

// --- Chat Response ---

export const ChatResponseSchema = z.object({
	reply: text('Suggestions are ready.'),
	suggestedChanges: SuggestedChangesSchema.default([]),
});

// --- Autofill Response ---

export const AutofillResponseSchema = z.object({
	draft: AutofillDraftSchema.default({}),
	imageDraft: z
		.unknown()
		.transform((v) =>
			typeof v === 'object' && v !== null ? ImageDraftSchema.parse(v) : { combinedPromptText: '', prompts: [] }
		),
});

// --- AI Config (from form payload) ---

export const AiConfigSchema = z.object({
	textProvider: text('local').transform((s) => s.toLowerCase()),
	textModel: string().default('gpt-5.4-mini'),
	textApiKey: text(''),
	textBaseUrl: text(''),
	imageProvider: text('local').transform((s) => s.toLowerCase()),
	imageModel: string().default('gpt-5.4-mini'),
	imageApiKey: text(''),
	imageBaseUrl: text(''),
});

export type AiConfig = z.infer<typeof AiConfigSchema>;

/** Parse AI config from raw form data with field name mapping. */
export function parseAiConfig(rawData: Record<string, unknown>): AiConfig {
	return AiConfigSchema.parse({
		textProvider: rawData.aiTextProvider,
		textModel: rawData.aiTextModel,
		textApiKey: rawData.aiTextApiKey ?? rawData.aiApiKey,
		textBaseUrl: rawData.aiTextBaseUrl ?? rawData.aiBaseUrl,
		imageProvider: rawData.aiImageProvider,
		imageModel: rawData.aiImageModel,
		imageApiKey: rawData.aiImageApiKey ?? rawData.aiApiKey,
		imageBaseUrl: rawData.aiImageBaseUrl ?? rawData.aiBaseUrl,
	});
}

// --- Chat Request ---

export const ChatRequestSchema = z.object({
	targetField: text('global-concept'),
	message: text('Improve this section.'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
