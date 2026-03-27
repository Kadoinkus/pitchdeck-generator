import { AiError, type AiErrorResponse } from '$lib/ai/errors';
import { type ProviderId, PROVIDERS } from '$lib/ai/registry';
import { AutofillResponseSchema } from '$lib/ai/schemas';
import { buildDeckModel } from '$lib/deck-model';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createXai } from '@ai-sdk/xai';
import { json } from '@sveltejs/kit';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const RequestSchema = z.object({
	config: z.object({
		providerId: z.string(),
		modelId: z.string(),
		baseURL: z.string(),
		apiKey: z.string(),
	}),
	deckData: z.record(z.string(), z.unknown()),
});

function createProvider(config: { providerId: string; apiKey: string; baseURL: string }) {
	const providerId = config.providerId as ProviderId;

	if (providerId === 'openai') {
		return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
	}
	if (providerId === 'anthropic') {
		return createAnthropic({ apiKey: config.apiKey, baseURL: config.baseURL });
	}
	if (providerId === 'xai') {
		return createXai({ apiKey: config.apiKey, baseURL: config.baseURL });
	}

	return createOpenAICompatible({
		name: providerId,
		baseURL: config.baseURL,
		headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
	});
}

function buildAutofillPrompt(deckData: Record<string, unknown>): string {
	const model = buildDeckModel(deckData);
	const { project, template, availableSlides } = model;
	const includedSlides = availableSlides.filter((s) => s.included).map((s) => s.id);

	return `Return JSON only. No markdown.
Create premium sales-deck copy for an animated AI chatbot proposal.
Template: ${template.label}
Client: ${project.clientName}
Client URL: ${project.clientUrl}
Included slides: ${includedSlides.join(', ')}

Output JSON schema:
{
  "draft": { "fieldName": "value", ... },
  "imageDraft": {
    "combinedPromptText": "...",
    "prompts": [{"slideId":"cover","slideTitle":"Cover","prompt":"..."}]
  }
}`;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const parsed = RequestSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ error: { code: 'PARSE_ERROR', message: 'Invalid request' } } satisfies AiErrorResponse,
			{
				status: 400,
			},
		);
	}

	const { config, deckData } = parsed.data;
	const providerDef = PROVIDERS[config.providerId as ProviderId];

	if (providerDef?.requiresKey && !config.apiKey) {
		return json(
			{ error: { code: 'NO_API_KEY', message: 'API key required' } } satisfies AiErrorResponse,
			{
				status: 400,
			},
		);
	}

	try {
		const provider = createProvider(config);
		const { output } = await generateText({
			model: provider(config.modelId),
			output: Output.object({ schema: AutofillResponseSchema }),
			prompt: buildAutofillPrompt(deckData),
		});

		return json(output);
	} catch (err) {
		const error = err instanceof AiError ? err : AiError.fromResponse(500, String(err));
		return json({ error: { code: error.code, message: error.message } } satisfies AiErrorResponse, {
			status: 500,
		});
	}
};
