import { AiError, type AiErrorResponse } from '$lib/ai/errors';
import { PROVIDERS } from '$lib/ai/registry';
import { ChatResponseSchema } from '$lib/ai/schemas';
import { createProvider, isKnownProvider } from '$lib/ai/server-provider';
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
	messages: z.array(
		z.object({
			role: z.enum(['user', 'assistant', 'system']),
			content: z.string(),
		}),
	),
	context: z.record(z.string(), z.unknown()).optional(),
});

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const parsed = RequestSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ error: { code: 'PARSE_ERROR', message: 'Invalid request' } } satisfies AiErrorResponse,
			{ status: 400 },
		);
	}

	const { config, messages } = parsed.data;

	const { providerId } = config;

	if (!isKnownProvider(providerId)) {
		return json(
			{ error: { code: 'PROVIDER_ERROR', message: 'Unknown provider' } } satisfies AiErrorResponse,
			{ status: 400 },
		);
	}

	const providerDef = PROVIDERS[providerId];

	if (providerDef.requiresKey && !config.apiKey) {
		return json(
			{ error: { code: 'NO_API_KEY', message: 'API key required' } } satisfies AiErrorResponse,
			{ status: 400 },
		);
	}

	try {
		const provider = createProvider({ ...config, providerId });
		const { output } = await generateText({
			model: provider(config.modelId),
			output: Output.object({ schema: ChatResponseSchema }),
			messages,
		});

		return json(output);
	} catch (err) {
		const error = err instanceof AiError ? err : AiError.fromResponse(500, String(err));
		return json({ error: { code: error.code, message: error.message } } satisfies AiErrorResponse, {
			status: 500,
		});
	}
};
