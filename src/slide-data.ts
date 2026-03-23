import { buildDeckModel } from './deck-model.ts';

export function buildSlideData(
	data: Record<string, unknown>,
): ReturnType<typeof buildDeckModel> {
	return buildDeckModel(data);
}
