import { getEditableFieldDefinitions } from "../deck-model.js";
import { safeText } from "../utils.js";
import {
	localChatAssist,
	localGenerateAutofill,
} from "./providers/local-provider.js";
import {
	openAIAutofill,
	openAIChatAssist,
} from "./providers/openai-provider.js";

const EDITABLE_FIELDS = new Set(
	getEditableFieldDefinitions().map((field) => field.name),
);

function sanitizeChanges(changes) {
	if (!Array.isArray(changes)) return [];

	return changes
		.map((change) => ({
			field: safeText(change?.field),
			label: safeText(change?.label),
			value: safeText(change?.value),
		}))
		.filter(
			(change) =>
				change.field && EDITABLE_FIELDS.has(change.field) && change.value,
		);
}

function resolveAiConfig(rawData = {}) {
	return {
		textProvider: safeText(rawData.aiTextProvider, "local").toLowerCase(),
		textModel: safeText(rawData.aiTextModel, "gpt-4.1-mini"),
		textApiKey: safeText(
			rawData.aiTextApiKey,
			process.env.OPENAI_API_KEY || "",
		),
		textBaseUrl: safeText(
			rawData.aiTextBaseUrl,
			process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
		),

		imageProvider: safeText(rawData.aiImageProvider, "local").toLowerCase(),
		imageModel: safeText(rawData.aiImageModel, "gpt-4.1-mini"),
		imageApiKey: safeText(
			rawData.aiImageApiKey,
			process.env.OPENAI_API_KEY || "",
		),
		imageBaseUrl: safeText(
			rawData.aiImageBaseUrl,
			process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
		),
	};
}

export function getAiProviderDefinitions() {
	return {
		textProviders: [
			{ id: "local", label: "Local draft engine (no key)" },
			{ id: "openai", label: "OpenAI compatible endpoint" },
		],
		imageProviders: [
			{ id: "local", label: "Local prompt engine (no key)" },
			{ id: "openai", label: "OpenAI compatible endpoint" },
		],
	};
}

export async function generateAutofill(rawData = {}) {
	const config = resolveAiConfig(rawData);
	let output = null;

	if (config.textProvider === "openai" && config.textApiKey) {
		try {
			output = await openAIAutofill(rawData, {
				apiKey: config.textApiKey,
				model: config.textModel,
				baseUrl: config.textBaseUrl,
			});
		} catch (error) {
			console.error(
				"OpenAI autofill failed, falling back to local engine:",
				error.message,
			);
		}
	}

	if (!output) {
		output = await localGenerateAutofill(rawData);
	}

	return {
		...output,
		draft: output.draft || {},
		imageDraft: output.imageDraft || { prompts: [], combinedPromptText: "" },
	};
}

export async function runChatAssistant(rawData = {}, chatRequest = {}) {
	const config = resolveAiConfig(rawData);
	let response = null;

	if (config.textProvider === "openai" && config.textApiKey) {
		try {
			response = await openAIChatAssist(rawData, chatRequest, {
				apiKey: config.textApiKey,
				model: config.textModel,
				baseUrl: config.textBaseUrl,
			});
		} catch (error) {
			console.error(
				"OpenAI chat assistant failed, falling back to local engine:",
				error.message,
			);
		}
	}

	if (!response) {
		response = await localChatAssist(rawData, chatRequest);
	}

	return {
		provider: response.provider || "local",
		reply: safeText(response.reply, "Suggestions are ready."),
		suggestedChanges: sanitizeChanges(response.suggestedChanges),
	};
}
