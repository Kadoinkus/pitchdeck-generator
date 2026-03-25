import { createHash } from 'node:crypto';

/** Fields excluded from hash — volatile, not content-bearing. Top-level only (payload schema keeps these flat). */
const VOLATILE_KEYS = new Set([
	'aiTextApiKey',
	'aiImageApiKey',
	'aiTextBaseUrl',
	'aiImageBaseUrl',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortDeep(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortDeep);
	if (isPlainObject(value)) {
		return Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = sortDeep(value[key]);
				return acc;
			}, {});
	}
	return value;
}

export function hashPayload(payload: Record<string, unknown>): string {
	const stripped: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(payload)) {
		if (!VOLATILE_KEYS.has(key)) {
			stripped[key] = value;
		}
	}
	const normalized = JSON.stringify(sortDeep(stripped));
	return createHash('sha256').update(normalized).digest('hex');
}
