import { type AutofillResult, generateAutofill } from '$lib/ai/orchestrator';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const payload: Record<string, unknown> = await request.json();
	const output: AutofillResult = await generateAutofill(payload);
	return json({ success: true, ...output });
};
