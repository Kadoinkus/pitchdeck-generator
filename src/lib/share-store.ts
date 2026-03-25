import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface SharePayload {
	[key: string]: unknown;
}

export interface ShareRecord extends SharePayload {
	token: string;
	createdAt: string;
}

function shareDir(outputDir: string): string {
	return path.join(outputDir, 'shares');
}

function sharePath(outputDir: string, token: string): string {
	return path.join(shareDir(outputDir), `${token}.json`);
}

function createToken(): string {
	return crypto.randomBytes(9).toString('base64url');
}

export async function saveShare(
	outputDir: string,
	payload: SharePayload,
): Promise<string> {
	const dir = shareDir(outputDir);
	await fs.mkdir(dir, { recursive: true });

	const token = createToken();
	const filePath = sharePath(outputDir, token);
	const record: ShareRecord = {
		token,
		createdAt: new Date().toISOString(),
		...payload,
	};

	await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
	return token;
}

export async function readShare(
	outputDir: string,
	token: string,
): Promise<ShareRecord | null> {
	try {
		const filePath = sharePath(outputDir, token);
		const content = await fs.readFile(filePath, 'utf8');
		const parsed: ShareRecord = JSON.parse(content);
		return parsed;
	} catch {
		return null;
	}
}

export async function updateShare(
	outputDir: string,
	token: string,
	patch: SharePayload,
): Promise<boolean> {
	const current = await readShare(outputDir, token);
	if (!current) return false;

	const filePath = sharePath(outputDir, token);
	const updated: ShareRecord = {
		...current,
		...patch,
		token: current.token,
		createdAt: current.createdAt,
	};

	await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
	return true;
}

export async function findShareByHash(
	outputDir: string,
	payloadHash: string,
): Promise<string | null> {
	const dir = shareDir(outputDir);
	let entries: string[];
	try {
		entries = await fs.readdir(dir);
	} catch {
		return null;
	}

	for (const entry of entries) {
		if (!entry.endsWith('.json')) continue;
		try {
			const filePath = path.join(dir, entry);
			const content = await fs.readFile(filePath, 'utf8');
			const record: ShareRecord = JSON.parse(content);
			if (record.payloadHash === payloadHash) {
				return record.token;
			}
		} catch {
			continue;
		}
	}
	return null;
}
