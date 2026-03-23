// @ts-nocheck
import { safeColor, safeFont } from "./utils.js";

export function themeVars(theme) {
	const primary = safeColor(theme?.primaryColor, "#004B49");
	const accent = safeColor(theme?.accentColor, "#30D89E");
	const secondary = safeColor(theme?.secondaryColor, "#0B6E6C");
	const bg = safeColor(theme?.backgroundColor, "#F2F4F6");
	const text = safeColor(theme?.textColor, "#0B1D2E");
	const heading = safeFont(theme?.headingFont, "Sora");
	const body = safeFont(theme?.bodyFont, "Inter");

	return [
		`--deck-primary:${primary}`,
		`--deck-accent:${accent}`,
		`--deck-secondary:${secondary}`,
		`--deck-bg:${bg}`,
		`--deck-text:${text}`,
		`--deck-heading:'${heading}',sans-serif`,
		`--deck-body:'${body}',sans-serif`,
	].join(";");
}

export function resolveTheme(theme, deckData) {
	return deckData?.deckTheme || theme || deckData?.theme || {};
}

