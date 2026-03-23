import type { IncomingMessage, ServerResponse } from 'node:http';
import { readShare, type ShareRecord } from '../../src/share-store.ts';
import {
	extractLastPathSegment,
	handleOptions,
	isMethod,
	sendBinary,
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
		sendJson(res, 400, { success: false, message: 'Download token missing.' });
		return;
	}

	void readShare(getOutputDir(), token)
		.then((record: ShareRecord | null) => {
			const base64 = typeof record?.pptxBase64 === 'string' ? record.pptxBase64 : '';
			const fileName =
				typeof record?.fileName === 'string' && record.fileName !== ''
					? record.fileName
					: `pitchdeck-${token}.pptx`;

			if (!record || base64 === '') {
				sendJson(res, 404, { success: false, message: 'Deck download not found.' });
				return;
			}

			const bytes = Buffer.from(base64, 'base64');
			sendBinary(
				res,
				200,
				bytes,
				'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				fileName,
			);
		})
		.catch((error: unknown) => {
			console.error('Deck download failed:', error);
			sendJson(res, 500, {
				success: false,
				message: 'Could not download deck file.',
			});
		});
}
