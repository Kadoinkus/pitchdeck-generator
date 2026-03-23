import { defineHandler } from 'nitro';
import { getAiProviderDefinitions } from '../../../src/ai/orchestrator.ts';

export default defineHandler(() => ({
	success: true,
	providers: getAiProviderDefinitions(),
}));
