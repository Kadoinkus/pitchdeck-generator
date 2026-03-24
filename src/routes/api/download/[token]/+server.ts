import { getOutputDir } from '$lib/server/storage';
import { readShare, type ShareRecord } from '$lib/share-store';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const token: string | undefined = params.token;
	if (!token) {
		return json(
			{ success: false, message: 'Download token missing.' },
			{ status: 400 },
		);
	}

	const record: ShareRecord | null = await readShare(getOutputDir(), token);
	const base64 = typeof record?.pptxBase64 === 'string' ? record.pptxBase64 : '';
	const fileName = typeof record?.fileName === 'string' && record.fileName !== ''
		? record.fileName
		: `pitchdeck-${token}.pptx`;

	if (!record || base64 === '') {
		return json(
			{ success: false, message: 'Deck download not found.' },
			{ status: 404 },
		);
	}

	const bytes = Buffer.from(base64, 'base64');
	return new Response(bytes, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'Content-Disposition': `attachment; filename="${fileName}"`,
		},
	});
};
