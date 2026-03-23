import { defineHandler } from 'nitro';
import { type ChatRequest, type ChatResult, runChatAssistant } from '../../../src/ai/orchestrator.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default defineHandler(async (event) => {
	const raw = await event.req.json();
	if (!isRecord(raw)) {
		return Response.json(
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
	return { success: true, ...output };
});
