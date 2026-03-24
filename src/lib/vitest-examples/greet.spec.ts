import { greet } from '$lib/vitest-examples/greet';
import { describe, expect, it } from 'vitest';

describe('greet', () => {
	it('returns a greeting', () => {
		expect(greet('Svelte')).toBe('Hello, Svelte!');
	});
});
