import { type ChatRequest, type ChatResult, runChatAssistant } from '$lib/ai/orchestrator.ts';
import { isRecord } from '$lib/utils.ts';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const raw: unknown = await request.json();
	if (!isRecord(raw)) {
		return json(
			{ success: false, message: 'Invalid request body.' },
			{ status: 400 },
		);
	}
	const payload = isRecord(raw.payload) ? raw.payload : {};
	const chatRequest: ChatRequest = {
		targetField: raw.targetField,
		message: raw.message,
	};
	const output: ChatResult = await runChatAssistant(payload, chatRequest);
	return json({ success: true, ...output });
};
