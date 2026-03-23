export function sanitizeFilename(input) {
	return (
		String(input || "deck")
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 60) || "deck"
	);
}

export function normalizeList(value, fallback = []) {
	if (Array.isArray(value)) {
		return value.map((item) => String(item).trim()).filter(Boolean);
	}

	if (typeof value === "string") {
		return value
			.split("\n")
			.map((item) => item.replace(/^[-•]\s*/, "").trim())
			.filter(Boolean);
	}

	return fallback;
}

export function safeText(value, fallback = "") {
	return String(value ?? fallback).trim();
}
