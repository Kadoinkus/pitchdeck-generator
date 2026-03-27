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
			config = loadConfig();
			initialized = true;
		},

		update(next: AiUserConfig) {
			config = next;
			saveConfig(next);
		},

		setProvider(providerId: ProviderId) {
			const next = getDefaultConfig(providerId);
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
