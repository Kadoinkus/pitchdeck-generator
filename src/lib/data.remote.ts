import { prerender } from '$app/server';
import { PROVIDER_IDS, PROVIDERS } from '$lib/ai/registry';
import { getTemplateDefinitions } from '$lib/deck-model';

/** Static template definitions — prerendered at build time. */
export const getTemplates = prerender(() => {
	return getTemplateDefinitions();
});

/** Static AI provider definitions — prerendered at build time. */
export const getProviders = prerender(() => {
	return PROVIDER_IDS.map((id) => ({
		id,
		label: PROVIDERS[id].label,
		requiresKey: PROVIDERS[id].requiresKey,
	}));
});
