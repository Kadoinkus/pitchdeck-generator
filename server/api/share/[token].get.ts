import { defineHandler } from 'nitro';
import { readShare, type ShareRecord } from '../../../src/share-store.ts';
import { getOutputDir } from '../../utils/storage.ts';

export default defineHandler(async (event) => {
	const token: string | undefined = event.context.params?.token;
	if (!token) {
		return Response.json(
			{ success: false, message: 'Share token is missing.' },
			{ status: 400 },
		);
	}

	const record: ShareRecord | null = await readShare(getOutputDir(), token);
	if (!record) {
		return Response.json(
			{ success: false, message: 'Share link not found.' },
			{ status: 404 },
		);
	}

	return {
		success: true,
		token: record.token,
		createdAt: record.createdAt,
		slideData: record.slideData || null,
		downloadUrl: `/api/download/${record.token}`,
	};
});
