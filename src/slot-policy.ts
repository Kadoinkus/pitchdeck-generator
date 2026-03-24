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

const SLOT_POLICIES: Record<
	string,
	{ image?: Partial<ImagePolicy>; text?: Partial<TextPolicy> }
> = {
	cover: {
		text: { mode: 'fit' },
		image: {
			required: true,
			optional: false,
			defaultMode: 'cover',
			allowedModes: ['cover', 'contain'],
		},
	},
	problem: {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	opportunity: {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	solution: {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'what-notso-does': {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'meet-buddy': {
		text: { mode: 'fit' },
		image: {
			required: true,
			optional: false,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'experience-concept': {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'chat-flow': {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'example-interaction': {
		text: { mode: 'fit' },
		image: {
			required: true,
			optional: false,
			defaultMode: 'cover',
			allowedModes: ['cover', 'contain'],
		},
	},
	'business-impact': {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'data-analytics': {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	'what-you-get': {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	pricing: {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	timeline: {
		text: { mode: 'fit' },
		image: {
			required: false,
			optional: true,
			defaultMode: 'contain',
			allowedModes: ['contain', 'cover'],
		},
	},
	closing: {
		text: { mode: 'fit' },
		image: {
			required: true,
			optional: false,
			defaultMode: 'cover',
			allowedModes: ['cover', 'contain'],
		},
	},
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

	const allowedModes: ImageMode[] = Array.isArray(rawImage.allowedModes) && rawImage.allowedModes.length
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
