import type { IncomingMessage, ServerResponse } from 'node:http';
import { type ChatRequest, type ChatResult, runChatAssistant } from '../../src/ai/orchestrator.ts';
import { handleOptions, isMethod, type JsonObject, readJsonBody, sendJson } from '../_lib/http.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function handler(req: IncomingMessage, res: ServerResponse): void {
	if (handleOptions(req, res)) {
		return;
	}

	if (!isMethod(req, 'POST')) {
		sendJson(res, 405, { success: false, message: 'Method not allowed.' });
		return;
	}

	void readJsonBody(req)
		.then((body: JsonObject) => {
			const payload = isRecord(body.payload) ? body.payload : {};
			const chatRequest: ChatRequest = {
				targetField: body.targetField,
				message: body.message,
			};
			return runChatAssistant(payload, chatRequest);
		})
		.then((output: ChatResult) => {
			sendJson(res, 200, { success: true, ...output });
		})
		.catch((error: unknown) => {
			console.error('AI chat failed:', error);
			sendJson(res, 500, {
				success: false,
				message: 'Could not generate AI chat response.',
			});
		});
}
