import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findShareByHash, readShare, saveShare, updateShare } from './share-store';

describe('share-store', () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'share-test-'));
	});

	afterEach(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it('saveShare creates a readable record', async () => {
		const token = await saveShare(tmpDir, {
			slideData: { slides: [] },
			payloadHash: 'abc123',
		});
		const record = await readShare(tmpDir, token);
		expect(record).not.toBeNull();
		expect(record?.token).toBe(token);
		expect(record?.payloadHash).toBe('abc123');
	});

	it('updateShare merges patch preserving token+createdAt', async () => {
		const token = await saveShare(tmpDir, { slideData: null });
		const ok = await updateShare(tmpDir, token, { pptxBase64: 'AAAA' });
		expect(ok).toBe(true);
		const record = await readShare(tmpDir, token);
		expect(record?.pptxBase64).toBe('AAAA');
	});

	it('findShareByHash returns existing token for matching hash', async () => {
		const token = await saveShare(tmpDir, { payloadHash: 'deadbeef' });
		const found = await findShareByHash(tmpDir, 'deadbeef');
		expect(found).toBe(token);
	});

	it('findShareByHash returns null for unknown hash', async () => {
		const found = await findShareByHash(tmpDir, 'nonexistent');
		expect(found).toBeNull();
	});

	it('readShare returns null for missing token', async () => {
		const record = await readShare(tmpDir, 'no-such-token');
		expect(record).toBeNull();
	});
});
