import { prerender } from '$app/server';
import { getAiProviderDefinitions } from '$lib/ai/orchestrator';
import { getTemplateDefinitions } from '$lib/deck-model';

/** Static template definitions — prerendered at build time. */
export const getTemplates = prerender(() => {
	return getTemplateDefinitions();
});

/** Static AI provider definitions — prerendered at build time. */
export const getProviders = prerender(() => {
	return getAiProviderDefinitions();
});
