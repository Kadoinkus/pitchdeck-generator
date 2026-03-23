// @ts-nocheck
export function esc(str) {
	const d = document.createElement("div");
	d.textContent = String(str ?? "");
	return d.innerHTML;
}

export function safeColor(value, fallback) {
	const color = String(value || "").trim();
	return /^#?[0-9a-fA-F]{6}$/.test(color)
		? color.startsWith("#")
			? color
			: `#${color}`
		: fallback;
}

export function safeFont(value, fallback) {
	const font = String(value || "").trim();
	return /^[a-zA-Z0-9\s\-,'"]{1,60}$/.test(font) ? font : fallback;
}

export function ensureItems(items, fallback) {
	if (Array.isArray(items) && items.length) return items;
	return fallback;
}

export function fitText(value, maxChars = 120) {
	const text = String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
	if (!text) return "";
	if (text.length <= maxChars) return text;
	return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function fitList(items, maxItems = 4, maxChars = 86) {
	return ensureItems(items, [])
		.slice(0, maxItems)
		.map((item) => fitText(item, maxChars))
		.filter(Boolean);
}

export function splitFeatureLines(value, max = 6) {
	return String(value || "")
		.split(/[;,]\s*|\.\s+/)
		.map((item) => item.trim())
		.filter(Boolean)
		.slice(0, max);
}

function parseAssetList(rawAssets) {
	let list = rawAssets;

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
		.map((item, index) => {
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
		.filter(Boolean);
}

const MASCOT_SLIDES = new Set([
	"cover",
	"meet-buddy",
	"example-interaction",
	"closing",
]);

export function findAssetForSlide(slide, deckData) {
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

