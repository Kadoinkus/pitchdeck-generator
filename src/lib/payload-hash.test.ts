import { describe, expect, it } from 'vitest';
import { hashPayload } from './payload-hash';

describe('hashPayload', () => {
	it('returns a 64-char hex string', () => {
		const hash = hashPayload({ clientName: 'Acme' });
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it('is deterministic for same input', () => {
		const a = hashPayload({ clientName: 'Acme', deckVersion: 'v1' });
		const b = hashPayload({ clientName: 'Acme', deckVersion: 'v1' });
		expect(a).toBe(b);
	});

	it('is stable regardless of key order', () => {
		const a = hashPayload({ b: '2', a: '1' });
		const b = hashPayload({ a: '1', b: '2' });
		expect(a).toBe(b);
	});

	it.each([
		'aiTextApiKey',
		'aiImageApiKey',
		'aiTextBaseUrl',
		'aiImageBaseUrl',
	])('strips volatile field %s before hashing', (key) => {
		const base = { clientName: 'Acme' };
		const withVolatile = { clientName: 'Acme', [key]: 'some-value' };
		expect(hashPayload(base)).toBe(hashPayload(withVolatile));
	});

	it('differs for different payloads', () => {
		const a = hashPayload({ clientName: 'Acme' });
		const b = hashPayload({ clientName: 'Beta' });
		expect(a).not.toBe(b);
	});
});
