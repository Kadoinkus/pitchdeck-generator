// @ts-nocheck
export function panelVariantClass(variant = "solid") {
	const value = String(variant || "solid")
		.trim()
		.toLowerCase();
	if (value === "transparent") return "is-transparent";
	if (value === "outlined") return "is-outlined";
	if (value === "soft") return "is-soft";
	if (value === "dark") return "is-dark";
	return "is-solid";
}

export function panelClassName({ variant = "solid", className = "" } = {}) {
	const variantClass = panelVariantClass(variant);
	return ["panel", variantClass, className].filter(Boolean).join(" ");
}

