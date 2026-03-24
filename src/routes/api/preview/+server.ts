import { buildSlideData } from '$lib/slide-data';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const payload: Record<string, unknown> = await request.json();
	const slideData = buildSlideData(payload);
	return json({ success: true, slideData });
};
