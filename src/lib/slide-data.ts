import { buildDeckModel } from '$lib/deck-model';

export function buildSlideData(
	data: Record<string, unknown>,
): ReturnType<typeof buildDeckModel> {
	return buildDeckModel(data);
}
