import type { AnthropicProvider } from '@ai-sdk/anthropic';
import type { OpenAIProvider } from '@ai-sdk/openai';
import type { XaiProvider } from '@ai-sdk/xai';

// Extract known literal model IDs from provider interfaces (the types themselves
// are not exported, but the provider interfaces are — use Parameters to reach them).
type ExtractLiterals<T> = T extends `${infer L}` ? L : never;
type KnownOpenAI = ExtractLiterals<Parameters<OpenAIProvider['chat']>[0]>;
type KnownAnthropic = ExtractLiterals<Parameters<AnthropicProvider['chat']>[0]>;
type KnownXai = ExtractLiterals<Parameters<XaiProvider['chat']>[0]>;

export const PROVIDERS = {
	openai: {
		label: 'OpenAI',
		defaultBaseURL: 'https://api.openai.com/v1',
		models: [
			'gpt-5.4',
			'gpt-5.4-mini',
			'gpt-4o',
			'gpt-4o-mini',
		] as const satisfies readonly KnownOpenAI[],
		requiresKey: true,
		compatible: false,
	},
	anthropic: {
		label: 'Anthropic',
		defaultBaseURL: 'https://api.anthropic.com/v1',
		models: [
			'claude-sonnet-4-6',
			'claude-opus-4-6',
			'claude-haiku-4-5',
		] as const satisfies readonly KnownAnthropic[],
		requiresKey: true,
		compatible: false,
	},
	xai: {
		label: 'xAI (Grok)',
		defaultBaseURL: 'https://api.x.ai/v1',
		models: [
			'grok-4',
			'grok-4-latest',
			'grok-3',
			'grok-3-mini',
		] as const satisfies readonly KnownXai[],
		requiresKey: true,
		compatible: false,
	},
	groq: {
		label: 'Groq',
		defaultBaseURL: 'https://api.groq.com/openai/v1',
		models: ['llama-3.2-70b-versatile', 'mixtral-8x7b-32768'] as const,
		requiresKey: true,
		compatible: true,
	},
	openrouter: {
		label: 'OpenRouter',
		defaultBaseURL: 'https://openrouter.ai/api/v1',
		models: [] as const,
		requiresKey: true,
		compatible: true,
	},
	lmstudio: {
		label: 'LM Studio',
		defaultBaseURL: 'http://localhost:1234/v1',
		models: [] as const,
		requiresKey: false,
		compatible: true,
	},
	ollama: {
		label: 'Ollama',
		defaultBaseURL: 'http://localhost:11434/v1',
		models: [] as const,
		requiresKey: false,
		compatible: true,
	},
	custom: {
		label: 'Custom Endpoint',
		defaultBaseURL: '',
		models: [] as const,
		requiresKey: false,
		compatible: true,
	},
} as const;

export type ProviderId = keyof typeof PROVIDERS;
export type ProviderDef = (typeof PROVIDERS)[ProviderId];

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export const LOCAL_PROVIDERS = new Set<ProviderId>(['lmstudio', 'ollama', 'custom']);

export function isLocalProvider(providerId: ProviderId): boolean {
	return LOCAL_PROVIDERS.has(providerId);
}
