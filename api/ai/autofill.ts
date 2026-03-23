import type { IncomingMessage, ServerResponse } from 'node:http';
import {
	type AutofillResult,
	generateAutofill,
} from '../../src/ai/orchestrator.ts';
import { handleOptions, isMethod, type JsonObject, readJsonBody, sendJson } from '../_lib/http.ts';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
	if (handleOptions(req, res)) {
		return;
	}

	if (!isMethod(req, 'POST')) {
		sendJson(res, 405, { success: false, message: 'Method not allowed.' });
		return;
	}

	void readJsonBody(req)
		.then((payload: JsonObject) => generateAutofill(payload))
		.then((output: AutofillResult) => {
			sendJson(res, 200, { success: true, ...output });
		})
		.catch((error: unknown) => {
			console.error('AI autofill failed:', error);
			sendJson(res, 500, {
				success: false,
				message: 'Could not generate AI autofill content.',
			});
		});
}
