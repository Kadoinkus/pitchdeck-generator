import {
	buildDeckModel,
	getEditableFieldDefinitions,
} from "../../deck-model.js";
import { safeText } from "../../utils.js";

const ALL_FIELDS = getEditableFieldDefinitions().map((field) => field.name);
const ALLOWED_FIELDS = new Set(ALL_FIELDS);

const AUTOFILL_FIELDS = [
	"projectTitle",
	"coverOneLiner",
	"subtitle",
	"proposalDate",
	"mascotName",
	"problemPoints",
	"opportunityPoints",
	"solutionPillars",
	"whatNotsoIntro",
	"whatNotsoCards",
	"buddyDescription",
	"buddyPersonality",
	"toneSliders",
	"experienceConcept",
	"chatFlow",
	"interactionExample",
	"businessImpact",
	"analyticsDescription",
	"analyticsBullets",
	"deliverables",
	"pricing",
	"timeline",
	"closingText",
	"teamCards",
	"contactName",
	"contactEmail",
	"contactPhone",
];

const CHAT_FIELDS = [...AUTOFILL_FIELDS, "imagePrompts"];

const MULTILINE_FIELDS = new Set([
	"problemPoints",
	"opportunityPoints",
	"solutionPillars",
	"whatNotsoCards",
	"buddyPersonality",
	"toneSliders",
	"experienceConcept",
	"chatFlow",
	"interactionExample",
	"businessImpact",
	"analyticsBullets",
	"deliverables",
	"pricing",
	"timeline",
	"teamCards",
]);

function normalizeBaseUrl(baseUrl) {
	const value = safeText(baseUrl, "https://api.openai.com/v1");
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

function extractJsonObject(text) {
	const trimmed = String(text || "").trim();
	if (!trimmed) throw new Error("AI response was empty.");

	try {
		return JSON.parse(trimmed);
	} catch {
		const start = trimmed.indexOf("{");
		const end = trimmed.lastIndexOf("}");
		if (start < 0 || end <= start) {
			throw new Error("AI response did not contain JSON.");
		}

		return JSON.parse(trimmed.slice(start, end + 1));
	}
}

async function callOpenAIChat({
	apiKey,
	baseUrl,
	model,
	messages,
	temperature = 0.4,
}) {
	const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			temperature,
			messages,
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`OpenAI request failed (${response.status}): ${body.slice(0, 240)}`,
		);
	}

	const result = await response.json();
	const content = result?.choices?.[0]?.message?.content;
	if (!content) throw new Error("OpenAI returned no message content.");

	return content;
}

function sanitizeSuggestedChanges(changes) {
	if (!Array.isArray(changes)) return [];

	return changes
		.map((change) => ({
			field: safeText(change?.field),
			label: safeText(change?.label),
			value: safeText(change?.value),
		}))
		.filter(
			(change) =>
				change.field && ALLOWED_FIELDS.has(change.field) && change.value,
		);
}

function sanitizeDraft(draft) {
	const output = {};
	if (!draft || typeof draft !== "object") return output;

	AUTOFILL_FIELDS.forEach((fieldName) => {
		if (!(fieldName in draft)) return;
		output[fieldName] = safeText(draft[fieldName]);
	});

	return output;
}

export async function openAIAutofill(rawData = {}, config = {}) {
	const model = buildDeckModel(rawData);
	const { project, template, availableSlides } = model;
	const includedSlides = availableSlides
		.filter((slide) => slide.included)
		.map((slide) => slide.id);
	const fieldGuide = AUTOFILL_FIELDS.map((fieldName) => {
		const formatHint = MULTILINE_FIELDS.has(fieldName)
			? "multiline string"
			: "single line string";
		return `- ${fieldName}: ${formatHint}`;
	}).join("\n");

	const prompt = [
		"Return JSON only. No markdown.",
		"Create premium sales-deck copy for an animated AI chatbot proposal.",
		`Template: ${template.label}`,
		`Client: ${project.clientName}`,
		`Client URL: ${project.clientUrl}`,
		`Included slides: ${includedSlides.join(", ")}`,
		"",
		"Field requirements:",
		fieldGuide,
		"",
		"Multiline formatting rules:",
		"- Use one item per line for list-like fields.",
		'- For structured lists use "Title :: Description" per line.',
		"- Keep all lines concise, persuasive, and client-ready.",
		"",
		"Output JSON schema:",
		"{",
		'  "draft": { "...": "..." },',
		'  "imageDraft": {',
		'    "prompts": [',
		'      {"slideId":"cover","slideTitle":"Cover","prompt":"..."}',
		"    ]",
		"  }",
		"}",
		"",
		"Image prompt rules:",
		"- One prompt per included slide id.",
		"- No text overlays in image prompts.",
		"- Describe composition, mood, subject, and style clearly.",
	].join("\n");

	const content = await callOpenAIChat({
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		model: config.model,
		temperature: 0.45,
		messages: [
			{
				role: "system",
				content:
					"You are a proposal deck content generator. Always respond with strict JSON.",
			},
			{ role: "user", content: prompt },
		],
	});

	const parsed = extractJsonObject(content);
	const prompts = Array.isArray(parsed?.imageDraft?.prompts)
		? parsed.imageDraft.prompts
		: [];

	const sanitizedPrompts = prompts
		.map((item, index) => ({
			slideId: safeText(
				item?.slideId,
				includedSlides[index] || `slide-${index + 1}`,
			),
			slideNumber: index + 1,
			slideTitle: safeText(
				item?.slideTitle,
				item?.slideId || `Slide ${index + 1}`,
			),
			prompt: safeText(item?.prompt),
		}))
		.filter((item) => item.prompt);

	return {
		provider: "openai",
		draft: sanitizeDraft(parsed?.draft),
		imageDraft: {
			prompts: sanitizedPrompts,
			combinedPromptText: sanitizedPrompts
				.map(
					(item) =>
						`Slide ${item.slideNumber} (${item.slideId}) :: ${item.prompt}`,
				)
				.join("\n"),
		},
	};
}

export async function openAIChatAssist(
	rawData = {},
	chatRequest = {},
	config = {},
) {
	const targetField = safeText(chatRequest.targetField, "global-concept");
	const message = safeText(chatRequest.message, "Improve this section.");

	const model = buildDeckModel(rawData);
	const context = {
		targetField,
		message,
		clientName: model.project.clientName,
		clientUrl: model.project.clientUrl,
		template: model.template.label,
		currentValue: safeText(rawData[targetField], ""),
		allowedFields: CHAT_FIELDS,
	};

	const prompt = [
		"Return JSON only.",
		"You are editing one part of a premium proposal deck.",
		"JSON schema:",
		"{",
		'  "reply": "Short guidance reply",',
		'  "suggestedChanges": [',
		'    {"field":"coverOneLiner","label":"Cover one-liner","value":"..."}',
		"  ]",
		"}",
		"",
		`Context: ${JSON.stringify(context)}`,
		"",
		"Rules:",
		"- suggestedChanges.field must be from allowedFields.",
		'- If targetField is "global-concept", suggest up to 3 high-impact fields.',
		"- Keep wording concise, premium, and implementation-ready.",
	].join("\n");

	const content = await callOpenAIChat({
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		model: config.model,
		temperature: 0.55,
		messages: [
			{
				role: "system",
				content:
					"You are a deck editing copilot. Always return strict JSON only.",
			},
			{ role: "user", content: prompt },
		],
	});

	const parsed = extractJsonObject(content);

	return {
		provider: "openai",
		reply: safeText(parsed?.reply, "Draft suggestions prepared."),
		suggestedChanges: sanitizeSuggestedChanges(parsed?.suggestedChanges),
	};
}
