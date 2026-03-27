export type ImageMode = 'cover' | 'contain';
export type TextMode = 'fit' | 'clamp';

export interface ImagePolicy {
	required: boolean;
	optional: boolean;
	defaultMode: ImageMode;
	allowedModes: ImageMode[];
}

export interface TextPolicy {
	mode: TextMode;
}

export interface SlotPolicy {
	image: ImagePolicy;
	text: TextPolicy;
}

const VALID_IMAGE_MODES: readonly ImageMode[] = ['cover', 'contain'];

function isImageMode(value: string): value is ImageMode {
	return (VALID_IMAGE_MODES as readonly string[]).includes(value);
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
	{ image?: Partial<ImagePolicy>; text?: Partial<TextPolicy> }
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

function normalizeImageMode(
	value: string,
	fallback: ImageMode,
	allowedModes: ImageMode[],
): ImageMode {
	const candidate = String(value || '')
		.trim()
		.toLowerCase();
	if (isImageMode(candidate) && allowedModes.includes(candidate)) {
		return candidate;
	}
	return fallback;
}

export function resolveSlotPolicy(slideType: string = ''): SlotPolicy {
	const policy = SLOT_POLICIES[String(slideType || '').trim()];
	const rawImage = { ...DEFAULT_IMAGE_POLICY, ...(policy?.image ?? {}) };
	const text: TextPolicy = { ...DEFAULT_TEXT_POLICY, ...(policy?.text ?? {}) };

	const allowedModes: ImageMode[] =
		Array.isArray(rawImage.allowedModes) && rawImage.allowedModes.length
			? rawImage.allowedModes
				.map((mode) => String(mode || '').toLowerCase())
				.filter(isImageMode)
			: DEFAULT_IMAGE_POLICY.allowedModes.slice();

	const defaultMode = normalizeImageMode(
		rawImage.defaultMode,
		DEFAULT_IMAGE_POLICY.defaultMode,
		allowedModes,
	);

	const required = Boolean(rawImage.required);
	const optional = required ? false : Boolean(rawImage.optional);

	text.mode = String(text.mode || 'fit').toLowerCase() === 'clamp' ? 'clamp' : 'fit';

	const image: ImagePolicy = {
		required,
		optional,
		defaultMode,
		allowedModes,
	};

	return { image, text };
}

export function resolveImageModeForSlide(
	slideType: string = '',
	requestedMode: string = '',
): ImageMode {
	const policy = resolveSlotPolicy(slideType);
	return normalizeImageMode(
		requestedMode,
		policy.image.defaultMode,
		policy.image.allowedModes,
	);
}
