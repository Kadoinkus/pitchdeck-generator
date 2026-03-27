import type { z } from 'zod';
import type { AiUserConfig } from './config';
import { AiError, type AiErrorResponse } from './errors';
import { localChatAssist, localGenerateAutofill } from './providers/local-provider';
import { isLocalProvider } from './registry';
import { AutofillResponseSchema, ChatResponseSchema } from './schemas';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

function isLocalURL(url: string): boolean {
	return (
		url.startsWith('http://localhost')
		|| url.startsWith('http://127.0.0.1')
		|| url.startsWith('http://0.0.0.0')
	);
}

function shouldUseLocalRoute(config: AiUserConfig): boolean {
	return isLocalProvider(config.providerId) || isLocalURL(config.baseURL);
}

async function* streamLocalLLM(
	config: AiUserConfig,
	messages: ChatMessage[],
): AsyncGenerator<string> {
	const res = await fetch(`${config.baseURL}/chat/completions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: config.modelId,
			messages,
			stream: true,
		}),
	});

	if (!res.ok) {
		throw AiError.fromResponse(res.status, await res.text());
	}

	const reader = res.body?.getReader();
	if (!reader) throw new AiError('NETWORK_ERROR', 'No response body');

	const decoder = new TextDecoder();
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		yield decoder.decode(value);
	}
}

async function fetchRemote(
	config: AiUserConfig,
	messages: ChatMessage[],
): Promise<string> {
	const res = await fetch('/api/ai/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ config, messages }),
	});

	if (!res.ok) {
		const body: AiErrorResponse = await res.json();
		throw new AiError(body.error.code, body.error.message);
	}

	return JSON.stringify(await res.json());
}

export async function* chat(
	config: AiUserConfig | null,
	messages: ChatMessage[],
	deckData: Record<string, unknown> = {},
): AsyncGenerator<string> {
	// No config or no baseURL on custom = template fallback
	if (!config || (config.providerId === 'custom' && !config.baseURL)) {
		const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
		const result = await localChatAssist(deckData, {
			message: lastUserMessage?.content ?? '',
			targetField: 'global-concept',
		});
		yield JSON.stringify(ChatResponseSchema.parse(result));
		return;
	}

	if (shouldUseLocalRoute(config)) {
		if (!config.baseURL) {
			// Local provider without baseURL = template fallback
			const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
			const result = await localChatAssist(deckData, {
				message: lastUserMessage?.content ?? '',
				targetField: 'global-concept',
			});
			yield JSON.stringify(ChatResponseSchema.parse(result));
			return;
		}
		yield* streamLocalLLM(config, messages);
	} else {
		yield await fetchRemote(config, messages);
	}
}

export async function autofill(
	config: AiUserConfig | null,
	deckData: Record<string, unknown>,
): Promise<z.infer<typeof AutofillResponseSchema>> {
	// No config = template fallback
	if (!config || (config.providerId === 'custom' && !config.baseURL)) {
		const result = await localGenerateAutofill(deckData);
		return AutofillResponseSchema.parse(result);
	}

	if (shouldUseLocalRoute(config) && !config.baseURL) {
		const result = await localGenerateAutofill(deckData);
		return AutofillResponseSchema.parse(result);
	}

	const res = await fetch('/api/ai/autofill', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ config, deckData }),
	});

	if (!res.ok) {
		const body: AiErrorResponse = await res.json();
		throw new AiError(body.error.code, body.error.message);
	}

	return AutofillResponseSchema.parse(await res.json());
}
