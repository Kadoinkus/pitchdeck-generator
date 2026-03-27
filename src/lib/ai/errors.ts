import { z } from 'zod';

export const AiErrorCodeSchema = z.enum([
	'NO_API_KEY',
	'INVALID_API_KEY',
	'RATE_LIMITED',
	'MODEL_NOT_FOUND',
	'PROVIDER_ERROR',
	'PARSE_ERROR',
	'NETWORK_ERROR',
]);

export type AiErrorCode = z.infer<typeof AiErrorCodeSchema>;

export class AiError extends Error {
	override readonly name = 'AiError';

	constructor(
		readonly code: AiErrorCode,
		message: string,
		override readonly cause?: unknown,
	) {
		super(message);
	}

	static fromResponse(status: number, body: string): AiError {
		if (status === 401) {
			return new AiError('INVALID_API_KEY', 'Invalid API key');
		}
		if (status === 429) {
			return new AiError('RATE_LIMITED', 'Rate limited, try again later');
		}
		if (status === 404) {
			return new AiError('MODEL_NOT_FOUND', 'Model not found');
		}
		return new AiError('PROVIDER_ERROR', `Provider error (${status}): ${body.slice(0, 100)}`);
	}
}

export interface AiErrorResponse {
	error: {
		code: AiErrorCode;
		message: string;
	};
}

export function isRecoverableError(code: AiErrorCode): boolean {
	return code === 'NO_API_KEY' || code === 'INVALID_API_KEY';
}
