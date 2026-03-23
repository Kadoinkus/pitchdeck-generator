import type { IncomingMessage, ServerResponse } from 'node:http';

export type JsonObject = Record<string, unknown>;

const MAX_BODY_BYTES = 10 * 1024 * 1024;

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function setCorsHeaders(res: ServerResponse): void {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleOptions(req: IncomingMessage, res: ServerResponse): boolean {
	if (req.method !== 'OPTIONS') {
		return false;
	}

	setCorsHeaders(res);
	res.statusCode = 204;
	res.end();
	return true;
}

export function sendJson(
	res: ServerResponse,
	statusCode: number,
	payload: JsonObject,
): void {
	setCorsHeaders(res);
	res.statusCode = statusCode;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.end(JSON.stringify(payload));
}

export function sendText(
	res: ServerResponse,
	statusCode: number,
	text: string,
	contentType: string,
): void {
	setCorsHeaders(res);
	res.statusCode = statusCode;
	res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
	res.end(text);
}

export function sendBinary(
	res: ServerResponse,
	statusCode: number,
	data: Uint8Array,
	contentType: string,
	filename: string,
): void {
	setCorsHeaders(res);
	res.statusCode = statusCode;
	res.setHeader('Content-Type', contentType);
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	res.end(data);
}

export async function readJsonBody(req: IncomingMessage): Promise<JsonObject> {
	const chunks: Uint8Array[] = [];
	let totalBytes = 0;

	for await (const chunk of req) {
		const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk);
		totalBytes += bytes.byteLength;
		if (totalBytes > MAX_BODY_BYTES) {
			throw new Error('Payload too large.');
		}
		chunks.push(bytes);
	}

	if (chunks.length === 0) {
		return {};
	}

	const raw = Buffer.concat(chunks).toString('utf8').trim();
	if (!raw) {
		return {};
	}

	const parsed: unknown = JSON.parse(raw);
	if (!isJsonObject(parsed)) {
		return {};
	}

	return parsed;
}

export function isMethod(req: IncomingMessage, method: 'GET' | 'POST'): boolean {
	return req.method === method;
}

export function extractLastPathSegment(url: string | undefined): string {
	if (!url) {
		return '';
	}

	const [pathname = ''] = url.split('?');
	const parts = pathname.split('/').filter((part) => part.length > 0);
	const segment = parts.length > 0 ? parts[parts.length - 1] : undefined;
	return typeof segment === 'string' ? decodeURIComponent(segment) : '';
}
