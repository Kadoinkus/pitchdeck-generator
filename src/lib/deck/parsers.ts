import type { CharacterAsset, Deliverable, Pair, ToneSlider, Triple } from '$lib/deck/types';
import { z } from 'zod';

const RecordSchema = z.record(z.string(), z.unknown());

function text(value: unknown, fallback = ''): string {
	return String(value ?? fallback).trim();
}

function toList(value: unknown, fallback: string[] = []): string[] {
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
			.map((item: unknown) => text(item).toLowerCase())
			.filter(Boolean);
	}
	if (typeof value === 'string') {
		return value
			.split(/[,\n]/g)
			.map((item) => text(item).toLowerCase())
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
	return toList(value, fallback)
		.slice(0, limit)
		.map((line) => {
			const [left, ...rest] = String(line).split(separator);
			return {
				title: text(left, line),
				description: text(rest.join(separator), ''),
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
	return toList(value, fallback)
		.slice(0, limit)
		.map((line) => {
			const [a, b, ...rest] = String(line)
				.split(separator)
				.map((part) => text(part));
			return {
				name: a || 'Tier',
				price: b || 'On request',
				description: text(
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
			.map((line) => text(line))
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
		const itemResult = RecordSchema.safeParse(list[index]);
		if (!itemResult.success) continue;
		const item = itemResult.data;

		const id = text(item.id, `asset-${index + 1}`);
		const name = text(item.name, `Character asset ${index + 1}`);
		const dataUrl = text(item.dataUrl ?? item.url, '');
		const placement = text(item.placement, 'all-mascot').toLowerCase();

		if (!dataUrl) continue;
		const dataUrlLower = dataUrl.toLowerCase();
		if (dataUrlLower.startsWith('data:image/svg+xml')) continue;
		if (
			!(
				dataUrlLower.startsWith('data:image/')
				|| dataUrlLower.startsWith('/generated/')
				|| /^https?:\/\//i.test(dataUrl)
			)
		) {
			continue;
		}

		results.push({ id, name, dataUrl, placement });
	}

	return results;
}
