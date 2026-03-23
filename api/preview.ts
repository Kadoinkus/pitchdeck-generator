import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildSlideData } from '../src/slide-data.ts';
import { handleOptions, isMethod, type JsonObject, readJsonBody, sendJson } from './_lib/http.ts';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
	if (handleOptions(req, res)) {
		return;
	}

	if (!isMethod(req, 'POST')) {
		sendJson(res, 405, { success: false, message: 'Method not allowed.' });
		return;
	}

	void readJsonBody(req)
		.then((payload: JsonObject) => {
			const slideData = buildSlideData(payload);
			sendJson(res, 200, { success: true, slideData });
		})
		.catch((error: unknown) => {
			console.error('Preview build failed:', error);
			sendJson(res, 500, {
				success: false,
				message: 'Could not build preview.',
			});
		});
}
