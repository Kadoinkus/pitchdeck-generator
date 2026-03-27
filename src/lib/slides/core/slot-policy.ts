export interface ImagePolicy {
	required: boolean;
	optional: boolean;
	defaultMode: string;
	allowedModes: string[];
}

export interface TextPolicy {
	mode: string;
}

export interface SlotPolicy {
	image: ImagePolicy;
	text: TextPolicy;
}

const DEFAULT_IMAGE_POLICY: ImagePolicy = {
	required: false,
	optional: true,
	defaultMode: 'cover',
	allowedModes: ['cover', 'contain'],
};

const DEFAULT_TEXT_POLICY: TextPolicy = {
	mode: 'fit',
};

/** Image optional, default contain, both modes allowed. */
const IMAGE_OPTIONAL_CONTAIN: ImagePolicy = {
	required: false,
	optional: true,
	defaultMode: 'contain',
	allowedModes: ['contain', 'cover'],
};

/** Image required, default cover, both modes allowed. */
const IMAGE_REQUIRED_COVER: ImagePolicy = {
	required: true,
	optional: false,
	defaultMode: 'cover',
	allowedModes: ['cover', 'contain'],
};

/** Image required, default contain, both modes allowed. */
const IMAGE_REQUIRED_CONTAIN: ImagePolicy = {
	required: true,
	optional: false,
	defaultMode: 'contain',
	allowedModes: ['contain', 'cover'],
};

const SLOT_POLICIES: Record<
	string,
	{ text?: Partial<TextPolicy>; image?: Partial<ImagePolicy> }
> = {
	cover: { image: IMAGE_REQUIRED_COVER },
	problem: { image: IMAGE_OPTIONAL_CONTAIN },
	opportunity: { image: IMAGE_OPTIONAL_CONTAIN },
	solution: { image: IMAGE_OPTIONAL_CONTAIN },
	'what-notso-does': { image: IMAGE_OPTIONAL_CONTAIN },
	'meet-buddy': { image: IMAGE_REQUIRED_CONTAIN },
	'experience-concept': { image: IMAGE_OPTIONAL_CONTAIN },
	'chat-flow': { image: IMAGE_OPTIONAL_CONTAIN },
	'example-interaction': { image: IMAGE_REQUIRED_COVER },
	'business-impact': { image: IMAGE_OPTIONAL_CONTAIN },
	'data-analytics': { image: IMAGE_OPTIONAL_CONTAIN },
	'what-you-get': { image: IMAGE_OPTIONAL_CONTAIN },
	pricing: { image: IMAGE_OPTIONAL_CONTAIN },
	timeline: { image: IMAGE_OPTIONAL_CONTAIN },
	closing: { image: IMAGE_REQUIRED_COVER },
};

function isSlotPolicyLike(value: unknown): value is Partial<SlotPolicy> {
	return typeof value === 'object' && value !== null;
}

function normalizeMode(
	value: unknown,
	fallback: string,
	allowedModes: string[],
): string {
	const candidate = String(value || '')
		.trim()
		.toLowerCase();
	if (allowedModes.includes(candidate)) return candidate;
	return fallback;
}

export function resolveSlotPolicy(
	slideType = '',
	override: unknown = null,
): SlotPolicy {
	const base = SLOT_POLICIES[String(slideType || '').trim()] || {};
	const input: Partial<SlotPolicy> = isSlotPolicyLike(override) ? override : {};
	const image: ImagePolicy = {
		...DEFAULT_IMAGE_POLICY,
		...(base.image || {}),
		...(input.image || {}),
	};
	const text: TextPolicy = {
		...DEFAULT_TEXT_POLICY,
		...(base.text || {}),
		...(input.text || {}),
	};
	image.allowedModes = Array.isArray(image.allowedModes) && image.allowedModes.length
		? image.allowedModes
			.map((mode) => String(mode || '').toLowerCase())
			.filter(Boolean)
		: DEFAULT_IMAGE_POLICY.allowedModes.slice();
	image.defaultMode = normalizeMode(
		image.defaultMode,
		DEFAULT_IMAGE_POLICY.defaultMode,
		image.allowedModes,
	);
	image.required = Boolean(image.required);
	image.optional = image.required ? false : Boolean(image.optional);
	text.mode = String(text.mode || 'fit').toLowerCase() === 'clamp' ? 'clamp' : 'fit';
	return { image, text };
}

interface SlideForImageMode {
	type?: string;
	slotPolicy?: unknown;
}

export function resolveImageMode(
	slide: SlideForImageMode | null | undefined = {},
	requested = '',
): string {
	const policy = resolveSlotPolicy(slide?.type, slide?.slotPolicy);
	return normalizeMode(
		requested,
		policy.image.defaultMode,
		policy.image.allowedModes,
	);
}
