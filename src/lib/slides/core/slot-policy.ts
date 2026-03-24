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

const SLOT_POLICIES: Record<
	string,
	{ text?: Partial<TextPolicy>; image?: Partial<ImagePolicy> }
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
