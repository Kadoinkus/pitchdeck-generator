import { getTemplateDefinitions } from '$lib/deck-model';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({
		success: true,
		templates: getTemplateDefinitions(),
	});
};
