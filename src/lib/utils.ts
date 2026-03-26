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
