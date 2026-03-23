import { defineHandler } from 'nitro';
import { getEditableFieldDefinitions } from '../../src/deck-model.ts';

export default defineHandler(() => ({
	success: true,
	fields: getEditableFieldDefinitions(),
}));
