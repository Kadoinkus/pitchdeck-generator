import { query } from '$app/server';
import { getAiProviderDefinitions } from '$lib/ai/orchestrator';
import { getTemplateDefinitions } from '$lib/deck-model';

export const getTemplates = query(() => {
	return getTemplateDefinitions();
});

export const getProviders = query(() => {
	return getAiProviderDefinitions();
});
