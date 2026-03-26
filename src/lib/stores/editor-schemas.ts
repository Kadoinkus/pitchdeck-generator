/**
 * Zod schemas for localStorage parsing in the editor store.
 */
import { z } from 'zod';

// --- Character Assets ---

export const CharacterAssetSchema = z.object({
	id: z.string().default(''),
	name: z.string().default(''),
	size: z.number().default(0),
	dataUrl: z.string(),
	placement: z.string().default('all-mascot'),
});

export type CharacterAsset = z.infer<typeof CharacterAssetSchema>;

export const CharacterAssetsSchema = z
	.unknown()
	.transform((v) => {
		if (typeof v === 'string' && v.trim()) {
			try {
				return JSON.parse(v);
			} catch {
				return [];
			}
		}
		return Array.isArray(v) ? v : [];
	})
	.pipe(z.array(z.unknown()))
	.transform((arr) =>
		arr
			.filter((item): item is Record<string, unknown> =>
				typeof item === 'object' && item !== null && 'dataUrl' in item && typeof item.dataUrl === 'string'
			)
			.map((item) => CharacterAssetSchema.parse(item))
			.slice(0, 10)
	);

// --- Draft Payload ---

export const DraftPayloadSchema = z
	.unknown()
	.transform((v) => {
		if (typeof v !== 'object' || v === null) return null;
		const obj = v as Record<string, unknown>;
		// Handle both { payload: {...} } and flat payload shapes
		if ('payload' in obj && typeof obj.payload === 'object' && obj.payload !== null) {
			return obj.payload as Record<string, unknown>;
		}
		return obj;
	});

// --- Slide Data ---

const SlideSchema = z.object({
	type: z.string(),
}).passthrough();

const ProjectSchema = z.object({
	projectTitle: z.string().optional(),
	clientName: z.string().optional(),
});

export const SlideDataSchema = z.object({
	slides: z.array(SlideSchema).min(1),
	theme: z.record(z.string(), z.unknown()),
	project: ProjectSchema.optional(),
}).passthrough();

export type DeckResultSlideData = z.infer<typeof SlideDataSchema>;

// --- Deck Result ---

export const DeckResultSchema = z.object({
	downloadUrl: z.string().min(1),
	pdfUrl: z.string().nullish().transform((v) => v ?? null),
	shareUrl: z.string().nullish().transform((v) => v ?? null),
	shareToken: z.string().nullish().transform((v) => v ?? null),
	payloadHash: z.string().nullish().transform((v) => v ?? null),
	publishedAt: z.string().nullish().transform((v) => v ?? null),
	publishedSignature: z.string().nullish().transform((v) => v ?? null),
	slideData: SlideDataSchema,
});

export type DeckResult = z.infer<typeof DeckResultSchema>;

// --- Parse Helpers ---

export function parseDraft(raw: string | null): Record<string, unknown> | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return DraftPayloadSchema.parse(parsed);
	} catch {
		return null;
	}
}

export function parseDeckResult(raw: string | null): DeckResult | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return DeckResultSchema.parse(parsed);
	} catch {
		return null;
	}
}

export function parseCharacterAssets(raw: unknown): CharacterAsset[] {
	return CharacterAssetsSchema.parse(raw);
}
