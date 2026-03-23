import { defineHandler } from 'nitro';
import { readShare, type ShareRecord } from '../../../src/share-store.ts';
import { getOutputDir } from '../../utils/storage.ts';

export default defineHandler(async (event) => {
	const token: string | undefined = event.context.params?.token;
	if (!token) {
		return Response.json(
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
		return Response.json(
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
});
