import { getOutputDir } from '$lib/server/storage';
import { readShare, type ShareRecord } from '$lib/share-store';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const token: string | undefined = params.token;
	if (!token) {
		return json(
			{ success: false, message: 'Share token is missing.' },
			{ status: 400 },
		);
	}

	const record: ShareRecord | null = await readShare(getOutputDir(), token);
	if (!record) {
		return json(
			{ success: false, message: 'Share link not found.' },
			{ status: 404 },
		);
	}

	return json({
		success: true,
		token: record.token,
		createdAt: record.createdAt,
		slideData: record.slideData || null,
		downloadUrl: `/api/download/${record.token}`,
	});
};
