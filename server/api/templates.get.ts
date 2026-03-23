import { defineHandler } from 'nitro';
import { getTemplateDefinitions } from '../../src/deck-model.ts';

export default defineHandler(() => ({
	success: true,
	templates: getTemplateDefinitions(),
}));
