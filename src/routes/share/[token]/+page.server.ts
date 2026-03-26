import { resolveRoute } from '$app/paths';
import { getOutputDir } from '$lib/server/storage';
import { readShare } from '$lib/share-store';
import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Shape of the deck blob persisted inside a share record. */
interface ShareDeckPayload extends DeckData {
	slides: SlideData[];
	theme: ThemeData;
}

const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

function isShareDeckPayload(value: unknown): value is ShareDeckPayload {
	if (typeof value !== 'object' || value === null) return false;
	return (
		'slides' in value
		&& 'theme' in value
		&& Array.isArray(value.slides)
		&& typeof value.theme === 'object'
		&& value.theme !== null
	);
}

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;
	if (!token) error(404, 'Token required');

	const record = await readShare(getOutputDir(), token);
	if (!record) error(404, 'Share link not found');

	if (typeof record.createdAt === 'string') {
		const age = Date.now() - new Date(record.createdAt).getTime();
		if (age > TTL_MS) {
			error(410, 'This shared deck has expired.');
		}
	}

	const raw: unknown = record.slideData;
	if (!isShareDeckPayload(raw)) error(404, 'Deck data missing');

	return {
		token,
		slideData: raw,
		downloadUrl: resolveRoute('/api/download/[token]', { token }),
	};
};
