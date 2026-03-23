import { defineHandler } from 'nitro';
import { buildSlideData } from '../../src/slide-data.ts';

export default defineHandler(async (event) => {
	const payload = await event.req.json();
	const slideData = buildSlideData(payload);
	return { success: true, slideData };
});
