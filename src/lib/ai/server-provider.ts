import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createXai } from '@ai-sdk/xai';
import { PROVIDER_IDS, type ProviderId } from './registry';

export function isKnownProvider(id: string): id is ProviderId {
	return (PROVIDER_IDS as readonly string[]).includes(id);
}

export function createProvider(
	config: { providerId: ProviderId; apiKey: string; baseURL: string },
) {
	if (config.providerId === 'openai') {
		return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
	}
	if (config.providerId === 'anthropic') {
		return createAnthropic({ apiKey: config.apiKey, baseURL: config.baseURL });
	}
	if (config.providerId === 'xai') {
		return createXai({ apiKey: config.apiKey, baseURL: config.baseURL });
	}

	return createOpenAICompatible({
		name: config.providerId,
		baseURL: config.baseURL,
		headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
	});
}
