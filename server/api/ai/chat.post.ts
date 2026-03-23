import { defineHandler } from 'nitro';
import { type ChatRequest, type ChatResult, runChatAssistant } from '../../../src/ai/orchestrator.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default defineHandler(async (event) => {
	const body = await event.req.json();
	const payload = isRecord(body.payload) ? body.payload : {};
	const chatRequest: ChatRequest = {
		targetField: body.targetField,
		message: body.message,
	};
	const output: ChatResult = await runChatAssistant(payload, chatRequest);
	return { success: true, ...output };
});
