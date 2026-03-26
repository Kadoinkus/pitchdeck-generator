import { command } from '$app/server';
import {
	type AutofillResult,
	type ChatRequest,
	type ChatResult,
	generateAutofill,
	runChatAssistant,
} from '$lib/ai/orchestrator';
import { z } from 'zod';

// --- Schemas ---

const ChatInputSchema = z.object({
	targetField: z.string(),
	message: z.string(),
	payload: z.record(z.string(), z.unknown()),
});

const AutofillInputSchema = z.record(z.string(), z.unknown());

// --- Chat ---

export const chat = command(ChatInputSchema, async (input): Promise<ChatResult> => {
	const chatRequest: ChatRequest = {
		targetField: input.targetField,
		message: input.message,
	};
	return runChatAssistant(input.payload, chatRequest);
});

// --- Autofill ---

export const autofill = command(AutofillInputSchema, async (payload): Promise<AutofillResult> => {
	return generateAutofill(payload);
});
