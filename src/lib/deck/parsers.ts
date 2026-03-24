import { isRecord, normalizeList, safeText } from '../utils.ts';
import type { CharacterAsset, Deliverable, Pair, ToneSlider, Triple } from './types.ts';

export { isRecord };

export function asBoolean(value: unknown, fallback = true): boolean {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
		if (['false', '0', 'no', 'off'].includes(normalized)) return false;
	}
	return fallback;
}

export function parseExcludedSlides(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.map((item: unknown) => safeText(item).toLowerCase())
			.filter(Boolean);
	}
	if (typeof value === 'string') {
		return value
			.split(/[,\n]/g)
			.map((item) => safeText(item).toLowerCase())
			.filter(Boolean);
	}
	return [];
}

export function parsePairs(
	value: unknown,
	fallback: string[] = [],
	separator = '::',
	limit = 8,
): Pair[] {
	return normalizeList(value, fallback)
		.slice(0, limit)
		.map((line) => {
			const [left, ...rest] = String(line).split(separator);
			return {
				title: safeText(left, line),
				description: safeText(rest.join(separator), ''),
			};
		})
		.filter((item) => item.title);
}

export function parseTriples(
	value: unknown,
	fallback: string[] = [],
	separator = '::',
	limit = 6,
): Triple[] {
	return normalizeList(value, fallback)
		.slice(0, limit)
		.map((line) => {
			const [a, b, ...rest] = String(line)
				.split(separator)
				.map((part) => safeText(part));
			return {
				name: a || 'Tier',
				price: b || 'On request',
				description: safeText(
					rest.join(' '),
					'Scope details provided in proposal.',
				),
			};
		});
}

export function parseTone(value: unknown, fallback: string[] = []): ToneSlider[] {
	return parsePairs(value, fallback, '::', 4).map((item) => {
		const score = Number.parseInt(item.description, 10);
		return {
			label: item.title,
			value: Number.isFinite(score) ? Math.max(15, Math.min(score, 100)) : 70,
		};
	});
}

export function parseDeliverables(
	value: unknown,
	fallback: string[] = [],
): Deliverable[] {
	return parsePairs(value, fallback, '::', 4).map((item) => ({
		title: item.title,
		bullets: item.description
			.split(/[;,]\s*/)
			.map((line) => safeText(line))
			.filter(Boolean)
			.slice(0, 4),
	}));
}

export function parseCharacterAssets(value: unknown, limit = 10): CharacterAsset[] {
	let list: unknown = value;

	if (typeof value === 'string') {
		try {
			list = JSON.parse(value);
		} catch {
			list = [];
		}
	}

	if (!Array.isArray(list)) return [];

	const results: CharacterAsset[] = [];

	for (let index = 0; index < Math.min(list.length, limit); index++) {
		const item: unknown = list[index];
		if (!isRecord(item)) continue;

		const id = safeText(item.id, `asset-${index + 1}`);
		const name = safeText(item.name, `Character asset ${index + 1}`);
		const dataUrl = safeText(item.dataUrl || item.url, '');
		const placement = safeText(item.placement, 'all-mascot').toLowerCase();

		if (!dataUrl) continue;
		if (
			!(
				dataUrl.startsWith('data:image/')
				|| dataUrl.startsWith('/generated/')
				|| /^https?:\/\//i.test(dataUrl)
			)
		) {
			continue;
		}

		results.push({ id, name, dataUrl, placement });
	}

	return results;
}
