import { getEditableFieldDefinitions } from '$lib/deck-model.ts';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({
		success: true,
		fields: getEditableFieldDefinitions(),
	});
};
