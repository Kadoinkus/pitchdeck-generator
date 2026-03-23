import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAiProviderDefinitions } from '../../src/ai/orchestrator.ts';
import { handleOptions, isMethod, sendJson } from '../_lib/http.ts';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
	if (handleOptions(req, res)) {
		return;
	}

	if (!isMethod(req, 'GET')) {
		sendJson(res, 405, { success: false, message: 'Method not allowed.' });
		return;
	}

	sendJson(res, 200, { success: true, providers: getAiProviderDefinitions() });
}
