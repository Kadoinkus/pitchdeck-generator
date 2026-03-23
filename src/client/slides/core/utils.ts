export interface CharacterAsset {
	id: string;
	name: string;
	dataUrl: string;
	placement: string;
}

export interface ImageAssetRef {
	dataUrl?: string;
	name?: string;
}

export interface SlideData {
	id?: string;
	type?: string;
	imageAsset?: ImageAssetRef | null;
	hideImages?: boolean;
	imageRatio?: string;
	imageMode?: string;
	backgroundMode?: string;
	textMode?: string;
	sourceField?: string;
	slotPolicy?: unknown;
}

export interface DeckData {
	content?: { characterAssets?: unknown };
	project?: { characterAssets?: unknown };
	deckTheme?: {
		primaryColor?: string;
		accentColor?: string;
		secondaryColor?: string;
		backgroundColor?: string;
		textColor?: string;
		headingFont?: string;
		bodyFont?: string;
		brandName?: string;
	};
	theme?: {
		primaryColor?: string;
		accentColor?: string;
		secondaryColor?: string;
		backgroundColor?: string;
		textColor?: string;
		headingFont?: string;
		bodyFont?: string;
		brandName?: string;
	};
}

export function esc(str: unknown): string {
	const d = document.createElement("div");
	d.textContent = String(str ?? "");
	return d.innerHTML;
}

export function safeColor(value: unknown, fallback: string): string {
	const color = String(value || "").trim();
	return /^#?[0-9a-fA-F]{6}$/.test(color)
		? color.startsWith("#")
			? color
			: `#${color}`
		: fallback;
}

export function safeFont(value: unknown, fallback: string): string {
	const font = String(value || "").trim();
	return /^[a-zA-Z0-9\s\-,'"]{1,60}$/.test(font) ? font : fallback;
}

export function ensureItems<T>(items: T[] | null | undefined, fallback: T[]): T[] {
	if (Array.isArray(items) && items.length) return items;
	return fallback;
}

export function fitText(value: unknown, maxChars = 120): string {
	const text = String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
	if (!text) return "";
	if (text.length <= maxChars) return text;
	return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function fitList(items: unknown[] | null | undefined, maxItems = 4, maxChars = 86): string[] {
	return ensureItems(items, [])
		.slice(0, maxItems)
		.map((item) => fitText(item, maxChars))
		.filter(Boolean);
}

export function splitFeatureLines(value: unknown, max = 6): string[] {
	return String(value || "")
		.split(/[;,]\s*|\.\s+/)
		.map((item) => item.trim())
		.filter(Boolean)
		.slice(0, max);
}

interface RawAssetItem {
	id?: unknown;
	name?: unknown;
	dataUrl?: unknown;
	url?: unknown;
	placement?: unknown;
}

function parseAssetList(rawAssets: unknown): CharacterAsset[] {
	let list: unknown = rawAssets;

	if (typeof rawAssets === "string") {
		try {
			list = JSON.parse(rawAssets);
		} catch {
			list = [];
		}
	}

	if (!Array.isArray(list)) return [];

	return list
		.slice(0, 10)
		.map((item: RawAssetItem | null | undefined, index: number): CharacterAsset | null => {
			const id = String(item?.id || `asset-${index + 1}`).trim();
			const name = String(item?.name || `Character asset ${index + 1}`).trim();
			const dataUrl = String(item?.dataUrl || item?.url || "").trim();
			const placement = String(item?.placement || "all-mascot")
				.trim()
				.toLowerCase();

			if (!dataUrl) return null;
			if (
				!(
					dataUrl.startsWith("data:image/") ||
					dataUrl.startsWith("/generated/") ||
					/^https?:\/\//i.test(dataUrl)
				)
			) {
				return null;
			}

			return { id, name, dataUrl, placement };
		})
		.filter((item): item is CharacterAsset => item !== null);
}

const MASCOT_SLIDES = new Set([
	"cover",
	"meet-buddy",
	"example-interaction",
	"closing",
]);

export function findAssetForSlide(slide: SlideData | null | undefined, deckData: DeckData | null | undefined): ImageAssetRef | null {
	if (slide?.imageAsset?.dataUrl) return slide.imageAsset;

	const assets = parseAssetList(
		deckData?.content?.characterAssets ||
			deckData?.project?.characterAssets ||
			[],
	);
	if (!assets.length) return null;

	const slideId = String(slide?.id || "").toLowerCase();

	const exact = assets.find((asset) => asset.placement === slideId);
	if (exact) return exact;

	if (MASCOT_SLIDES.has(slideId)) {
		return (
			assets.find(
				(asset) =>
					asset.placement === "all-mascot" || asset.placement === "mascot",
			) || assets[0]
		);
	}

	return assets.find((asset) => asset.placement === "all") || null;
}
