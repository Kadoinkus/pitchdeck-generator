import { command } from '$app/server';
import {
	type AutofillResult,
	type ChatRequest,
	type ChatResult,
	generateAutofill,
	runChatAssistant,
} from '$lib/ai/orchestrator';

// --- Chat ---

interface ChatInput {
	targetField: unknown;
	message: unknown;
	payload: Record<string, unknown>;
}

export const chat = command('unchecked', async (input: ChatInput): Promise<ChatResult> => {
	const chatRequest: ChatRequest = {
		targetField: input.targetField,
		message: input.message,
	};
	return runChatAssistant(input.payload ?? {}, chatRequest);
});

// --- Autofill ---

export const autofill = command('unchecked', async (payload: Record<string, unknown>): Promise<AutofillResult> => {
	return generateAutofill(payload);
});
