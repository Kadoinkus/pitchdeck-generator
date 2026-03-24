import { describe, expect, it } from 'vitest';
import { haikus, randomHaiku } from './haiku';

describe('haiku collection', () => {
	it('has at least 10 Dutch haiku', () => {
		const nl = haikus.filter((h) => h.lang === 'nl');
		expect(nl.length).toBeGreaterThanOrEqual(10);
	});

	it('has at least 10 English haiku', () => {
		const en = haikus.filter((h) => h.lang === 'en');
		expect(en.length).toBeGreaterThanOrEqual(10);
	});

	it('every haiku has exactly 3 non-empty lines', () => {
		for (const h of haikus) {
			expect(h.lines).toHaveLength(3);
			for (const line of h.lines) {
				expect(line.trim().length).toBeGreaterThan(0);
			}
		}
	});

	it('every haiku has a valid lang', () => {
		for (const h of haikus) {
			expect(['nl', 'en']).toContain(h.lang);
		}
	});
});

describe('randomHaiku', () => {
	it('returns a haiku from the collection', () => {
		const h = randomHaiku();
		expect(h).toBeDefined();
		expect(haikus).toContain(h);
	});

	it('filters by language', () => {
		const h = randomHaiku('nl');
		expect(h).toBeDefined();
		expect(h?.lang).toBe('nl');
	});

	it('returns a valid haiku for each language', () => {
		const h = randomHaiku('en');
		expect(h).toBeDefined();
		expect(h?.lines).toHaveLength(3);
	});
});
