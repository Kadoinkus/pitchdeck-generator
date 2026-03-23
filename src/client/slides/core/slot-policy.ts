// @ts-nocheck
const DEFAULT_IMAGE_POLICY = {
	required: false,
	optional: true,
	defaultMode: "cover",
	allowedModes: ["cover", "contain"],
};

const DEFAULT_TEXT_POLICY = {
	mode: "fit",
};

const SLOT_POLICIES = {
	cover: {
		text: { mode: "fit" },
		image: {
			required: true,
			optional: false,
			defaultMode: "cover",
			allowedModes: ["cover", "contain"],
		},
	},
	problem: {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	opportunity: {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	solution: {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"what-notso-does": {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"meet-buddy": {
		text: { mode: "fit" },
		image: {
			required: true,
			optional: false,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"experience-concept": {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"chat-flow": {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"example-interaction": {
		text: { mode: "fit" },
		image: {
			required: true,
			optional: false,
			defaultMode: "cover",
			allowedModes: ["cover", "contain"],
		},
	},
	"business-impact": {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"data-analytics": {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	"what-you-get": {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	pricing: {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	timeline: {
		text: { mode: "fit" },
		image: {
			required: false,
			optional: true,
			defaultMode: "contain",
			allowedModes: ["contain", "cover"],
		},
	},
	closing: {
		text: { mode: "fit" },
		image: {
			required: true,
			optional: false,
			defaultMode: "cover",
			allowedModes: ["cover", "contain"],
		},
	},
};

function normalizeMode(value, fallback, allowedModes) {
	const candidate = String(value || "")
		.trim()
		.toLowerCase();
	if (allowedModes.includes(candidate)) return candidate;
	return fallback;
}

export function resolveSlotPolicy(slideType = "", override = null) {
	const base = SLOT_POLICIES[String(slideType || "").trim()] || {};
	const input = override || {};
	const image = {
		...DEFAULT_IMAGE_POLICY,
		...(base.image || {}),
		...(input.image || {}),
	};
	const text = {
		...DEFAULT_TEXT_POLICY,
		...(base.text || {}),
		...(input.text || {}),
	};
	image.allowedModes =
		Array.isArray(image.allowedModes) && image.allowedModes.length
			? image.allowedModes
					.map((mode) => String(mode || "").toLowerCase())
					.filter(Boolean)
			: DEFAULT_IMAGE_POLICY.allowedModes.slice();
	image.defaultMode = normalizeMode(
		image.defaultMode,
		DEFAULT_IMAGE_POLICY.defaultMode,
		image.allowedModes,
	);
	image.required = Boolean(image.required);
	image.optional = image.required ? false : Boolean(image.optional);
	text.mode =
		String(text.mode || "fit").toLowerCase() === "clamp" ? "clamp" : "fit";
	return { image, text };
}

export function resolveImageMode(slide = {}, requested = "") {
	const policy = resolveSlotPolicy(slide?.type, slide?.slotPolicy);
	return normalizeMode(
		requested,
		policy.image.defaultMode,
		policy.image.allowedModes,
	);
}

