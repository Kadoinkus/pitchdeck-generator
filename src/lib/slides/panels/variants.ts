const VARIANT_CLASSES: Record<string, string> = {
	transparent: 'is-transparent',
	outlined: 'is-outlined',
	soft: 'is-soft',
	dark: 'is-dark',
};

export function panelVariantClass(variant?: string): string {
	const value = String(variant ?? 'solid')
		.trim()
		.toLowerCase();
	return VARIANT_CLASSES[value] ?? 'is-solid';
}

interface PanelClassNameOptions {
	variant?: string;
	className?: string;
}

export function panelClassName({
	variant = 'solid',
	className = '',
}: PanelClassNameOptions = {}): string {
	const variantClass = panelVariantClass(variant);
	return ['panel', variantClass, className].filter(Boolean).join(' ');
}
