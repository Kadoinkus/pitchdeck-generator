import {
	type AiUserConfig,
	clearConfig,
	getDefaultConfig,
	loadConfig,
	saveConfig,
} from '$lib/ai/config';
import { type ProviderId, PROVIDERS } from '$lib/ai/registry';

function createAiStore() {
	let config = $state<AiUserConfig | null>(null);
	let initialized = $state(false);

	return {
		get config() {
			return config;
		},
		get hasKey() {
			if (!config) return false;
			const provider = PROVIDERS[config.providerId];
			return !provider.requiresKey || !!config.apiKey;
		},
		get initialized() {
			return initialized;
		},
		get needsSetup() {
			return initialized && !this.hasKey;
		},

		init() {
			if (initialized) return;
			config = loadConfig();
			initialized = true;
		},

		update(next: AiUserConfig) {
			config = next;
			saveConfig(next);
		},

		setProvider(providerId: ProviderId) {
			const next = getDefaultConfig(providerId);
			// Preserves API key when switching between providers that share key formats
			// (e.g., OpenAI-compatible endpoints). May confuse users switching between
			// incompatible providers — consider clearing key unless providers are compatible.
			if (config?.apiKey && PROVIDERS[providerId].requiresKey) {
				next.apiKey = config.apiKey;
			}
			config = next;
			saveConfig(next);
		},

		clear() {
			config = null;
			clearConfig();
		},
	};
}

export const ai = createAiStore();
