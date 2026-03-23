export function panelVariantClass(variant: string = 'solid'): string {
	const value = String(variant || 'solid')
		.trim()
		.toLowerCase();
	if (value === 'transparent') return 'is-transparent';
	if (value === 'outlined') return 'is-outlined';
	if (value === 'soft') return 'is-soft';
	if (value === 'dark') return 'is-dark';
	return 'is-solid';
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
