import {
	asBoolean,
	isRecord,
	parseCharacterAssets,
	parseDeliverables,
	parseExcludedSlides,
	parsePairs,
	parseTone,
	parseTriples,
} from '$lib/deck/parsers';
import { SLIDE_SPECS } from '$lib/deck/slide-registry';
import { normalizeList, safeText } from '$lib/utils';
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Reusable field schemas                                             */
/* ------------------------------------------------------------------ */

/** Coerce unknown → trimmed string, falling back to `fallback`. */
function textField(fallback: string) {
	return z.unknown().optional().transform((v) => safeText(v, fallback));
}

/** Coerce unknown → boolean, falling back to `fallback`. */
function boolField(fallback: boolean) {
	return z.unknown().optional().transform((v) => asBoolean(v, fallback));
}

/** Coerce unknown → string[], falling back to empty array. */
function listField() {
	return z.unknown().optional().transform((v) => normalizeList(v));
}

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

/**
 * Accepts raw form/API input (all fields optional, all values unknown)
 * and coerces every field into a typed value. Static defaults are applied
 * here; project-dependent defaults are applied later in buildDeckModel.
 *
 * Uses z.looseObject (Zod v4) to preserve dynamic `layout_${slideId}` keys.
 */
const RawDeckSchema = z.looseObject({
	/* Template & layout ------------------------------------------------ */
	templateId: textField('pitch-proposal'),
	excludedSlides: z.unknown().optional().transform((v) => parseExcludedSlides(v)),
	layoutPreset: textField('notso-premium-v1'),
	layoutPresetLock: boolField(true),

	/* Theme / palette -------------------------------------------------- */
	primaryColor: textField('#004B49'),
	harmonyMode: textField(''),
	paletteShuffleSeed: z.unknown().optional(),
	lockAccentColor: boolField(false),
	lockSecondaryColor: boolField(false),

	/* Color fields — dual-name, resolved at build time ----------------- */
	deckAccentColor: textField(''),
	accentColor: textField(''),
	deckSecondaryColor: textField(''),
	secondaryColor: textField(''),
	deckBackgroundColor: textField(''),
	backgroundColor: textField(''),
	deckTextColor: textField(''),
	textColor: textField(''),

	/* Font & brand ----------------------------------------------------- */
	brandName: textField('Notso AI'),
	deckHeadingFont: textField(''),
	headingFont: textField(''),
	deckBodyFont: textField(''),
	bodyFont: textField(''),

	/* Project ---------------------------------------------------------- */
	clientName: textField('Acme Client'),
	clientUrl: textField('https://www.acme-client.com'),
	projectTitle: textField('AI Mascot Proposal'),
	coverOneLiner: textField(
		'A playful, premium chatbot experience that converts and delights.',
	),
	subtitle: textField(
		'A reusable digital buddy concept tailored to your brand.',
	),
	proposalDate: textField('June 2026'),
	mascotName: textField('Sven'),
	deckVersion: textField('v1.0'),
	contactName: textField('Max Kowalski'),
	contactEmail: textField('max@notso.ai'),
	contactPhone: textField('+31 6 40450599'),
	characterAssets: z.unknown().optional().transform((v) => parseCharacterAssets(v)),

	/* Content — static defaults ---------------------------------------- */
	solutionPillars: z.unknown().optional().transform((v) =>
		parsePairs(
			v,
			[
				'Character :: A custom digital buddy with recognizable personality.',
				'AI :: Smart intent handling and dynamic guidance.',
				'Interaction :: Conversational UI for web, mobile, and campaign touchpoints.',
			],
			'::',
			3,
		)
	),
	whatNotsoIntro: textField(
		'At Notso AI, we design and deploy animated AI characters that turn support and sales conversations into premium experiences.',
	),
	whatNotsoCards: z.unknown().optional().transform((v) =>
		parsePairs(
			v,
			[
				'Strategy & Personality :: We define tone, role, and emotional behavior.',
				'Design & Animation :: High-quality mascot animation and motion direction.',
				'Smart Conversations :: Structured chat logic with conversion intent.',
				'Measurable Impact :: Analytics visibility for performance and optimization.',
			],
			'::',
			4,
		)
	),
	buddyPersonality: z.unknown().optional().transform((v) =>
		normalizeList(v, [
			'Friendly and professional tone',
			'Emotion-aware replies',
			'Brand-consistent language',
			'Conversion-focused prompts',
		]).slice(0, 5)
	),
	toneSliders: z.unknown().optional().transform((v) =>
		parseTone(v, [
			'Friendly :: 88',
			'Professional :: 74',
			'Playful :: 69',
			'Direct :: 82',
		])
	),
	experienceConcept: z.unknown().optional().transform((v) =>
		normalizeList(v, [
			'User starts on website, greeted by mascot assistant.',
			'Assistant routes intent to product, support, or booking path.',
			'Recommendations adapt to user behavior and preference.',
			'Outcome-driven CTA closes loop with conversion or handoff.',
		]).slice(0, 6)
	),
	chatFlow: z.unknown().optional().transform((v) =>
		normalizeList(v, [
			'Greeting',
			'Discovery',
			'Suggestions',
			'Personalization',
			'Conversion',
		]).slice(0, 6)
	),
	interactionExample: z.unknown().optional().transform((v) =>
		normalizeList(v, [
			'User: I need help picking the best chair.',
			'Buddy: Great, do you prefer ergonomic or lounge style?',
			'User: Ergonomic for long work sessions.',
			'Buddy: I recommend Comfort LX006, would you like a quick comparison?',
		]).slice(0, 8)
	),
	businessImpact: z.unknown().optional().transform((v) =>
		normalizeList(v, [
			'Increase conversion rate',
			'Reduce support load',
			'Improve engagement',
			'Strengthen branded recall',
		]).slice(0, 4)
	),
	analyticsDescription: textField(
		'Every interaction is tracked and analyzed to improve messaging, product guidance, and conversion outcomes.',
	),
	analyticsBullets: z.unknown().optional().transform((v) =>
		normalizeList(v, [
			'Live dashboard for conversation and conversion metrics',
			'Top questions and topic trends',
			'Interaction volume and dwell-time tracking',
			'Exportable monthly reports',
		]).slice(0, 7)
	),
	deliverables: z.unknown().optional().transform((v) =>
		parseDeliverables(v, [
			'Deployment-ready mascot :: Branded character; 40+ expressions; campaign-ready assets',
			'Multichannel access :: Website widget; mobile support; campaign microsites',
			'Performance insights :: Dashboard access; reporting cadence; optimization recommendations',
			'Brand activation media :: Social visuals; video loops; launch pack templates',
		])
	),
	pricing: z.unknown().optional().transform((v) =>
		parseTriples(v, [
			'Basic - Chat :: EUR 2.600,- :: 3D mascot based on template;Template rig;Emotion based',
			'Premium - Chat :: EUR 24.000,- :: Custom-designed mascot;Full rig 40+ animations;Advanced LLM integration',
			'Pro - Chat & Voice :: EUR 38.000,- :: Custom mascot;Voice support;Advanced analytics',
		])
	),
	timeline: z.unknown().optional().transform((v) =>
		parsePairs(
			v,
			[
				'Month 1 :: Discovery, concept alignment, and storyboard.',
				'Month 2 :: Design production, conversation flow build.',
				'Month 3 :: Integration, launch readiness, optimization kickoff.',
			],
			'::',
			3,
		)
	),
	teamCards: z.unknown().optional().transform((v) =>
		parsePairs(
			v,
			[
				'Strategy Lead :: Vision, scope, and decision alignment',
				'Conversation Designer :: Dialog logic and flow quality',
				'Motion Designer :: Character and animation polish',
				'Implementation Engineer :: Integration and launch delivery',
			],
			'::',
			4,
		)
	),

	/* Content — project-dependent defaults (applied in buildDeckModel) - */
	problemPoints: listField(),
	opportunityPoints: listField(),
	buddyDescription: textField(''),
	closingText: textField(''),
	imagePrompts: z.unknown().optional().transform((v): Partial<Record<string, string>> => {
		if (isRecord(v)) {
			const result: Record<string, string> = {};
			for (const [key, val] of Object.entries(v)) {
				const text = safeText(val);
				if (text) result[key] = text;
			}
			return result;
		}
		const list = normalizeList(v);
		if (!list.length) return {};
		const result: Record<string, string> = {};
		for (let i = 0; i < SLIDE_SPECS.length && i < list.length; i++) {
			const spec = SLIDE_SPECS[i];
			const text = list[i];
			if (spec && text) result[spec.id] = text;
		}
		return result;
	}),
});

export type ParsedDeckInput = z.output<typeof RawDeckSchema>;

/**
 * Parse raw form/API data into a fully typed structure.
 * Accepts any value — missing/undefined coerced to defaults.
 */
export function parseDeckInput(raw: unknown): ParsedDeckInput {
	const input = (typeof raw === 'object' && raw !== null) ? raw : {};
	return RawDeckSchema.parse(input);
}
