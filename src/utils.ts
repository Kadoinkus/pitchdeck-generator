export function sanitizeFilename(input: unknown): string {
	return (
		String(input || 'deck')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'deck'
	);
}

export function normalizeList(
	value: unknown,
	fallback: string[] = [],
): string[] {
	if (Array.isArray(value)) {
		return value.map((item: unknown) => String(item).trim()).filter(Boolean);
	}

	if (typeof value === 'string') {
		return value
			.split('\n')
			.map((item) => item.replace(/^[-•]\s*/, '').trim())
			.filter(Boolean);
	}

	return fallback;
}

export function safeText(value: unknown, fallback: string = ''): string {
	return String(value ?? fallback).trim();
}
