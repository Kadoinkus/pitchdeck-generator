import { buildDeckModel } from "./deck-model.js";

export function buildSlideData(data: Record<string, unknown>): ReturnType<typeof buildDeckModel> {
	return buildDeckModel(data);
}
