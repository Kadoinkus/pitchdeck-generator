import { renderIcon } from './icons.ts';

const ICON_PANEL_SECTIONS = new Set([
	'problem:points',
	'solution:pillars',
	'what-notso-does:cards',
	'business-impact:impacts',
	'timeline:phases',
]);

export interface PanelIconOptions {
	slideType?: string;
	sectionKey?: string;
	panelCount?: number;
	iconName?: string;
	label?: string;
}

export function shouldUsePanelIcons({
	slideType = '',
	sectionKey = '',
	panelCount = 0,
}: Pick<
	PanelIconOptions,
	'slideType' | 'sectionKey' | 'panelCount'
> = {}): boolean {
	if (panelCount < 3) return false;
	return ICON_PANEL_SECTIONS.has(`${String(slideType)}:${String(sectionKey)}`);
}

export function renderPanelIcon({
	slideType = '',
	sectionKey = '',
	panelCount = 0,
	iconName = 'sparkles',
	label = '',
}: PanelIconOptions = {}): string {
	if (!shouldUsePanelIcons({ slideType, sectionKey, panelCount })) return '';
	return `<div class="panel-hero-icon">${renderIcon(iconName, { size: 'xl', className: 'icon-panel', label })}</div>`;
}
