import type { IncomingMessage, ServerResponse } from 'node:http';
import { readShare, type ShareRecord } from '../../src/share-store.ts';
import {
	extractLastPathSegment,
	handleOptions,
	isMethod,
	sendJson,
} from '../_lib/http.ts';
import { getOutputDir } from '../_lib/storage.ts';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
	if (handleOptions(req, res)) {
		return;
	}

	if (!isMethod(req, 'GET')) {
		sendJson(res, 405, { success: false, message: 'Method not allowed.' });
		return;
	}

	const token = extractLastPathSegment(req.url);
	if (!token) {
		sendJson(res, 400, { success: false, message: 'Share token is missing.' });
		return;
	}

	void readShare(getOutputDir(), token)
		.then((record: ShareRecord | null) => {
			if (!record) {
				sendJson(res, 404, { success: false, message: 'Share link not found.' });
				return;
			}

			sendJson(res, 200, {
				success: true,
				token: record.token,
				createdAt: record.createdAt,
				slideData: record.slideData || null,
				downloadUrl: `/api/download/${record.token}`,
			});
		})
		.catch((error: unknown) => {
			console.error('Share lookup failed:', error);
			sendJson(res, 500, {
				success: false,
				message: 'Could not load shared deck.',
			});
		});
}
