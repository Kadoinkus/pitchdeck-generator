import { buildDeckModel } from '$lib/deck-model';

/** @deprecated Use buildDeckModel directly */
export function buildSlideData(
	data: Record<string, unknown>,
): ReturnType<typeof buildDeckModel> {
	return buildDeckModel(data);
}
