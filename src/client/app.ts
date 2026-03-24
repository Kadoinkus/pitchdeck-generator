import './styles.css';
import { DEFAULT_THEME_COLORS, normalizeHexColor, resolveThemePalette, type ThemeColors } from './color-palette.ts';
import { showViewer, updateViewerData } from './viewer.ts';

interface SlideEntry {
	type: string;
	[key: string]: unknown;
}

interface DeckData {
	slides: SlideEntry[];
	theme: Record<string, unknown>;
	project?: { projectTitle?: string; clientName?: string };
	[key: string]: unknown;
}

interface DeckResult {
	slideData?: DeckData;
	downloadUrl?: string | null;
	pdfUrl?: string | null;
	shareUrl?: string | null;
}

interface TemplateSlide {
	id: string;
	label: string;
	required: boolean;
	defaultIncluded: boolean;
}

interface TemplateEntry {
	id: string;
	label: string;
	description: string;
	slides: TemplateSlide[];
}

interface HistoryEntry {
	payload: FormPayload;
	signature: string;
	at: number;
}

interface CharacterAsset {
	id: string;
	name: string;
	size: number;
	dataUrl: string;
	placement: string;
}

interface ChatTarget {
	field: string;
	label: string;
}

interface ChatMessage {
	role: string;
	content: string;
}

interface SuggestedChange {
	field: string;
	label?: string;
	value: string;
}

interface ImageDraft {
	combinedPromptText?: string;
	prompts?: Array<{ slideId?: string; prompt?: string }>;
}

interface FormPayload {
	[key: string]: unknown;
	excludedSlides?: string[];
}

interface ProviderOption {
	id: string;
	label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
	if (!isRecord(value)) return false;
	return Object.values(value).every((v) => typeof v === 'string');
}

function isDeckResult(value: unknown): value is DeckResult {
	return isRecord(value) && 'downloadUrl' in value && 'slideData' in value;
}

const AI_SETTINGS_KEY = 'proposalDeckAiSettingsV3';
const DRAFT_STORAGE_KEY = 'proposalDeckDraftV4';
const DECK_RESULT_STORAGE_KEY = 'proposalDeckLastResultV1';
const HISTORY_LIMIT = 80;

function requireEl(id: string): HTMLElement {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Missing required element: #${id}`);
	return el;
}

const form = requireEl('deck-form');
const templateSelect = requireEl('templateId');
const slideSelector = requireEl('slide-selector');
const includeAllSlidesButton = requireEl('include-all-slides');
const includeCoreSlidesButton = requireEl('include-core-slides');
const layoutPresetSelect = document.getElementById('layoutPreset');
const layoutPresetLock = document.getElementById('layoutPresetLock');
const primaryColorInput = document.getElementById('primaryColor');
const accentColorInput = document.getElementById('accentColor');
const secondaryColorInput = document.getElementById('secondaryColor');
const backgroundColorInput = document.getElementById('backgroundColor');
const textColorInput = document.getElementById('textColor');
const harmonyModeSelect = document.getElementById('harmonyMode');
const paletteShuffleSeedInput = document.getElementById('paletteShuffleSeed');
const shuffleHarmonyButton = document.getElementById('shuffle-harmony');
const lockAccentColorInput = document.getElementById('lock-accentColor');
const lockSecondaryColorInput = document.getElementById('lock-secondaryColor');
const paletteStatusEl = document.getElementById('palette-status');
const autoFillButton = requireEl('ai-autofill');
const generateButton = requireEl('generate-button');
const statusEl = requireEl('status');

const saveAiSettingsButton = requireEl('save-ai-settings');
const characterAssetsInput = document.getElementById('character-assets-input');
const characterAssetsPreview = document.getElementById(
	'character-assets-preview',
);
const characterAssetsStatus = document.getElementById(
	'character-assets-status',
);
const clearCharacterAssetsButton = document.getElementById(
	'clear-character-assets',
);

const outputStatus = requireEl('output-status');
const openViewerLink = requireEl('open-viewer-link');
const downloadPptxLink = document.getElementById('download-pptx-link');
const downloadPdfLink = document.getElementById('download-pdf-link');
const openShareLink = document.getElementById('open-share-link');
const copyShareLinkButton = requireEl('copy-share-link');
const projectNameDisplay = document.getElementById('project-name-display');
const projectContextDisplay = document.getElementById(
	'project-context-display',
);
const saveIndicator = document.getElementById('save-indicator');
const undoChangeButton = document.getElementById('undo-change');
const redoChangeButton = document.getElementById('redo-change');
const slideViewerEl = document.getElementById('slide-viewer');

const chatLauncher = requireEl('viewer-chat-launcher');
const chatPanel = requireEl('viewer-chat-panel');
const chatClose = requireEl('viewer-chat-close');
const chatTargetEl = requireEl('viewer-chat-target');
const chatMessagesEl = requireEl('viewer-chat-messages');
const chatSuggestionsEl = requireEl('viewer-chat-suggestions');
const chatInputEl = requireEl('viewer-chat-input');
const chatSendButton = requireEl('viewer-chat-send');

const templateMap = new Map<string, TemplateEntry>();
let currentDeckResult: DeckResult | null = null;
let chatTarget: ChatTarget = {
	field: 'global-concept',
	label: 'Global concept',
};
const chatHistory: ChatMessage[] = [];
let characterAssets: CharacterAsset[] = [];
let historyStack: HistoryEntry[] = [];
let historyIndex = -1;
let suspendHistory = false;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let historyInputTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedSignature = '';

const CHARACTER_PLACEMENTS: Array<{ value: string; label: string }> = [
	{ value: 'all-mascot', label: 'All mascot slides' },
	{ value: 'cover', label: 'Cover' },
	{ value: 'meet-buddy', label: 'Meet the buddy' },
	{ value: 'example-interaction', label: 'Example interaction' },
	{ value: 'closing', label: 'Closing' },
	{ value: 'all', label: 'All slides' },
];

function getInputValue(el: HTMLElement | null): string {
	if (el instanceof HTMLInputElement) return el.value;
	if (el instanceof HTMLSelectElement) return el.value;
	if (el instanceof HTMLTextAreaElement) return el.value;
	return '';
}

function setInputValue(el: HTMLElement | null, value: string): void {
	if (el instanceof HTMLInputElement) el.value = value;
	else if (el instanceof HTMLSelectElement) el.value = value;
	else if (el instanceof HTMLTextAreaElement) el.value = value;
}

function isChecked(el: HTMLElement | null): boolean {
	return el instanceof HTMLInputElement && el.checked;
}

function setDisabled(el: HTMLElement | null, disabled: boolean): void {
	if (el instanceof HTMLInputElement) el.disabled = disabled;
	else if (el instanceof HTMLSelectElement) el.disabled = disabled;
	else if (el instanceof HTMLButtonElement) el.disabled = disabled;
}

const brandColorControls: Record<keyof ThemeColors, HTMLElement | null> = {
	primaryColor: primaryColorInput,
	accentColor: accentColorInput,
	secondaryColor: secondaryColorInput,
	backgroundColor: backgroundColorInput,
	textColor: textColorInput,
};

function syncLayoutPresetLockUi(): void {
	if (!layoutPresetSelect || !layoutPresetLock) return;
	setDisabled(layoutPresetSelect, false);
	layoutPresetSelect.classList.toggle('is-locked', isChecked(layoutPresetLock));
}

function setPaletteStatus(message: string, tone = ''): void {
	if (!paletteStatusEl) return;
	paletteStatusEl.textContent = message;
	paletteStatusEl.classList.remove('warning', 'error');
	if (tone) paletteStatusEl.classList.add(tone);
}

function readManualPaletteColors(): ThemeColors {
	return {
		primaryColor: normalizeHexColor(
			getInputValue(brandColorControls.primaryColor),
			DEFAULT_THEME_COLORS.primaryColor,
		),
		accentColor: normalizeHexColor(
			getInputValue(brandColorControls.accentColor),
			DEFAULT_THEME_COLORS.accentColor,
		),
		secondaryColor: normalizeHexColor(
			getInputValue(brandColorControls.secondaryColor),
			DEFAULT_THEME_COLORS.secondaryColor,
		),
		backgroundColor: normalizeHexColor(
			getInputValue(brandColorControls.backgroundColor),
			DEFAULT_THEME_COLORS.backgroundColor,
		),
		textColor: normalizeHexColor(
			getInputValue(brandColorControls.textColor),
			DEFAULT_THEME_COLORS.textColor,
		),
	};
}

function getShuffleSeed(): number {
	return Math.max(
		0,
		Math.floor(
			Number.parseInt(getInputValue(paletteShuffleSeedInput) || '0', 10) || 0,
		),
	);
}

function syncBrandPaletteUi(): void {
	if (!primaryColorInput || !harmonyModeSelect || !paletteShuffleSeedInput) {
		return;
	}

	const manualColors = readManualPaletteColors();
	const palette = resolveThemePalette({
		primaryColor: manualColors.primaryColor,
		harmonyMode: getInputValue(harmonyModeSelect) || 'complementary',
		shuffleSeed: getShuffleSeed(),
		locks: {
			accentColor: Boolean(isChecked(lockAccentColorInput)),
			secondaryColor: Boolean(isChecked(lockSecondaryColorInput)),
		},
		manualColors,
	});

	setInputValue(primaryColorInput, palette.theme.primaryColor);
	setInputValue(accentColorInput, palette.theme.accentColor);
	setInputValue(secondaryColorInput, palette.theme.secondaryColor);
	setInputValue(backgroundColorInput, palette.theme.backgroundColor);
	setInputValue(textColorInput, palette.theme.textColor);
	setInputValue(harmonyModeSelect, palette.harmonyMode);
	setInputValue(paletteShuffleSeedInput, String(palette.shuffleSeed));
	if (accentColorInput) {
		setDisabled(accentColorInput, !palette.locks.accentColor);
	}
	if (secondaryColorInput) {
		setDisabled(secondaryColorInput, !palette.locks.secondaryColor);
	}

	const adjustedKeys: Set<string> = new Set(
		palette.adjustments.map((entry) => entry.key),
	);

	Object.entries(brandColorControls).forEach(([key, input]) => {
		if (!input) return;
		input.classList.toggle('is-color-warning', adjustedKeys.has(key));
	});

	if (palette.adjustments.length) {
		setPaletteStatus(
			`${palette.harmonyMode} harmony · variant ${
				palette.variantIndex + 1
			}/${palette.variantCount}. Corrected ${palette.adjustments.length} color${
				palette.adjustments.length === 1 ? '' : 's'
			} for readability.`,
			'warning',
		);
		return;
	}

	setPaletteStatus(
		`${palette.harmonyMode} harmony · variant ${palette.variantIndex + 1}/${palette.variantCount}.`,
	);
}

function bindBrandPaletteControls(): void {
	if (!primaryColorInput || !harmonyModeSelect || !paletteShuffleSeedInput) {
		return;
	}

	const controls = [
		primaryColorInput,
		accentColorInput,
		secondaryColorInput,
		backgroundColorInput,
		textColorInput,
		harmonyModeSelect,
		lockAccentColorInput,
		lockSecondaryColorInput,
	].filter((el): el is HTMLElement => el !== null);

	controls.forEach((control) => {
		control.addEventListener('change', () => {
			syncBrandPaletteUi();
		});
	});

	primaryColorInput.addEventListener('input', () => {
		syncBrandPaletteUi();
	});

	shuffleHarmonyButton?.addEventListener('click', () => {
		setInputValue(paletteShuffleSeedInput, String(getShuffleSeed() + 1));
		syncBrandPaletteUi();
		pushHistorySnapshot();
		markEditorDirty();
	});
}

function setStatus(message: string, isError = false): void {
	statusEl.textContent = message;
	statusEl.classList.toggle('error', isError);
}

function clonePayload(payload: FormPayload = {}): FormPayload {
	return JSON.parse(JSON.stringify(payload));
}

function payloadSignature(payload: FormPayload = {}): string {
	const normalized: Record<string, unknown> = {
		...payload,
		excludedSlides: Array.isArray(payload.excludedSlides)
			? [...payload.excludedSlides].sort()
			: [],
	};
	const ordered: Record<string, unknown> = {};
	Object.keys(normalized)
		.sort()
		.forEach((key) => {
			ordered[key] = normalized[key];
		});
	return JSON.stringify(ordered);
}

function setSaveIndicator(state = 'is-saved', text = ''): void {
	if (!saveIndicator) return;
	const labelByState: Record<string, string> = {
		'is-saved': 'All changes saved',
		'is-dirty': 'Unsaved changes',
		'is-saving': 'Saving...',
		'is-error': 'Save failed',
	};

	saveIndicator.classList.remove(
		'is-saved',
		'is-dirty',
		'is-saving',
		'is-error',
	);
	saveIndicator.classList.add(state);
	saveIndicator.textContent = text || labelByState[state] || labelByState['is-saved'] || 'All changes saved';
}

function updateProjectChrome(): void {
	const clientNameEl = form.querySelector('[name="clientName"]');
	const clientUrlEl = form.querySelector('[name="clientUrl"]');
	const projectTitleEl = form.querySelector('[name="projectTitle"]');
	const deckVersionEl = form.querySelector('[name="deckVersion"]');

	const clientName = clientNameEl instanceof HTMLInputElement ? clientNameEl.value.trim() : '';
	const clientUrl = clientUrlEl instanceof HTMLInputElement ? clientUrlEl.value.trim() : '';
	const projectTitle = projectTitleEl instanceof HTMLInputElement
		? projectTitleEl.value.trim()
		: '';
	const deckVersion = deckVersionEl instanceof HTMLInputElement ? deckVersionEl.value.trim() : '';
	const templateLabel = templateMap.get(getInputValue(templateSelect))?.label
		|| 'Pitch Deck Proposal';

	if (projectNameDisplay) {
		projectNameDisplay.textContent = projectTitle
			|| (clientName ? `${clientName} proposal` : 'Untitled design');
	}

	if (projectContextDisplay) {
		const context = [
			clientName || 'No client',
			templateLabel,
			deckVersion || 'v1.0',
		]
			.filter(Boolean)
			.join(' · ');
		projectContextDisplay.textContent = clientUrl
			? `${context} · ${clientUrl}`
			: context;
	}
}

function syncHistoryButtons(): void {
	if (undoChangeButton) setDisabled(undoChangeButton, historyIndex <= 0);
	if (redoChangeButton) {
		setDisabled(redoChangeButton, historyIndex >= historyStack.length - 1);
	}
}

function applyPayloadToForm(payload: FormPayload = {}): void {
	suspendHistory = true;

	const nextTemplateId = payload.templateId;
	if (
		typeof nextTemplateId === 'string'
		&& templateMap.has(nextTemplateId)
		&& getInputValue(templateSelect) !== nextTemplateId
	) {
		setInputValue(templateSelect, nextTemplateId);
		const entry = templateMap.get(nextTemplateId);
		if (entry) renderSlideSelector(entry, false);
	}

	const fields = form.querySelectorAll(
		'input[name], textarea[name], select[name]',
	);
	fields.forEach((field) => {
		if (
			!(
				field instanceof HTMLInputElement
				|| field instanceof HTMLTextAreaElement
				|| field instanceof HTMLSelectElement
			)
		) {
			return;
		}
		if (!(field.name in payload)) return;
		if (field.name === 'templateId') return;

		if (field instanceof HTMLInputElement && field.type === 'checkbox') {
			field.checked = Boolean(payload[field.name]);
			return;
		}

		field.value = String(payload[field.name] ?? '');
	});

	const excluded = new Set<string>(
		Array.isArray(payload.excludedSlides) ? payload.excludedSlides : [],
	);
	slideSelector
		.querySelectorAll('input[type="checkbox"][data-slide-id]')
		.forEach((checkbox) => {
			if (checkbox instanceof HTMLInputElement) {
				checkbox.checked = !excluded.has(checkbox.dataset.slideId || '');
			}
		});

	characterAssets = parseCharacterAssetsFromField();
	renderCharacterAssetsPreview();
	syncLayoutPresetLockUi();
	syncBrandPaletteUi();
	updateProjectChrome();
	suspendHistory = false;
}

function pushHistorySnapshot(): void {
	if (suspendHistory) return;

	const payload = clonePayload(readFormPayload());
	const signature = payloadSignature(payload);
	const current = historyStack[historyIndex];
	if (current?.signature === signature) {
		syncHistoryButtons();
		return;
	}

	if (historyIndex < historyStack.length - 1) {
		historyStack = historyStack.slice(0, historyIndex + 1);
	}

	historyStack.push({
		payload,
		signature,
		at: Date.now(),
	});

	if (historyStack.length > HISTORY_LIMIT) {
		const overflow = historyStack.length - HISTORY_LIMIT;
		historyStack.splice(0, overflow);
	}

	historyIndex = historyStack.length - 1;
	syncHistoryButtons();
}

function autosaveNow({ quiet = false }: { quiet?: boolean } = {}): void {
	if (autosaveTimer !== null) clearTimeout(autosaveTimer);
	const payload = clonePayload(readFormPayload());
	const signature = payloadSignature(payload);

	if (!quiet) {
		setSaveIndicator('is-saving');
	}

	try {
		localStorage.setItem(
			DRAFT_STORAGE_KEY,
			JSON.stringify({
				version: 4,
				savedAt: new Date().toISOString(),
				payload,
			}),
		);

		lastSavedSignature = signature;
		setSaveIndicator('is-saved');
	} catch (error) {
		console.error(error);
		setSaveIndicator('is-error');
	}
}

function scheduleAutosave(): void {
	if (suspendHistory) return;
	if (autosaveTimer !== null) clearTimeout(autosaveTimer);
	autosaveTimer = setTimeout(() => {
		autosaveNow();
	}, 700);
}

function loadDraftFromLocalStorage(): boolean {
	try {
		const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
		if (!raw) return false;

		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) return false;
		const source = isRecord(parsed.payload) ? parsed.payload : parsed;
		const payload: FormPayload = { ...source };
		if (!isRecord(payload)) return false;

		applyPayloadToForm(payload);
		lastSavedSignature = payloadSignature(readFormPayload());
		setSaveIndicator('is-saved');
		return true;
	} catch (error) {
		console.error(error);
		setSaveIndicator('is-error', 'Draft load failed');
		return false;
	}
}

async function applyHistoryIndex(nextIndex: number): Promise<void> {
	const entry = historyStack[nextIndex];
	if (!entry) return;

	historyIndex = nextIndex;
	applyPayloadToForm(entry.payload);
	syncHistoryButtons();

	if (entry.signature === lastSavedSignature) {
		setSaveIndicator('is-saved');
	} else {
		setSaveIndicator('is-dirty');
	}

	if (
		currentDeckResult?.slideData
		&& slideViewerEl
		&& !slideViewerEl.classList.contains('hidden')
	) {
		try {
			await refreshViewerFromPayload();
		} catch (error) {
			console.error(error);
		}
	}
}

async function undoChange(): Promise<void> {
	if (historyIndex <= 0) return;
	await applyHistoryIndex(historyIndex - 1);
}

async function redoChange(): Promise<void> {
	if (historyIndex >= historyStack.length - 1) return;
	await applyHistoryIndex(historyIndex + 1);
}

function markEditorDirty(): void {
	const signature = payloadSignature(readFormPayload());
	if (signature === lastSavedSignature) {
		if (autosaveTimer !== null) clearTimeout(autosaveTimer);
		setSaveIndicator('is-saved');
		return;
	}

	setSaveIndicator('is-dirty');
	scheduleAutosave();
}

function queueInputHistorySnapshot(): void {
	if (historyInputTimer !== null) clearTimeout(historyInputTimer);
	historyInputTimer = setTimeout(() => {
		pushHistorySnapshot();
	}, 160);
}

function handleFormMutation(event: Event): void {
	if (suspendHistory) return;
	const target = event.target;
	if (!target || !(target instanceof HTMLElement)) return;

	const hasFieldName = target instanceof HTMLInputElement
			|| target instanceof HTMLTextAreaElement
			|| target instanceof HTMLSelectElement
		? target.name.length > 0
		: false;
	const isSlideToggle = Boolean(
		target instanceof HTMLElement && target.dataset?.slideId,
	);
	if (!hasFieldName && !isSlideToggle) return;

	updateProjectChrome();

	if (event.type === 'input') {
		queueInputHistorySnapshot();
	} else {
		pushHistorySnapshot();
	}

	markEditorDirty();
}

function handleHistoryHotkeys(event: KeyboardEvent): void {
	if (!event.metaKey && !event.ctrlKey) return;
	if (slideViewerEl && !slideViewerEl.classList.contains('hidden')) return;

	const target = event.target;
	if (target instanceof HTMLInputElement) return;
	if (target instanceof HTMLTextAreaElement) return;
	if (target instanceof HTMLSelectElement) return;
	if (target instanceof HTMLElement && target.isContentEditable) return;

	const key = event.key.toLowerCase();
	const wantsUndo = key === 'z' && !event.shiftKey;
	const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
	if (!wantsUndo && !wantsRedo) return;

	event.preventDefault();
	if (wantsUndo) {
		undoChange();
		return;
	}
	redoChange();
}

function setLinkState(
	el: HTMLElement | null,
	url: string | null | undefined,
): void {
	if (!el) return;

	if (url) {
		el.classList.remove('disabled');
		el.setAttribute('href', url);
	} else {
		el.classList.add('disabled');
		el.setAttribute('href', '#');
	}
}

function setOutputState(state: DeckResult | null = null): void {
	currentDeckResult = state;

	try {
		if (state?.downloadUrl && state?.slideData) {
			localStorage.setItem(DECK_RESULT_STORAGE_KEY, JSON.stringify(state));
		} else {
			localStorage.removeItem(DECK_RESULT_STORAGE_KEY);
		}
	} catch (error) {
		console.error(error);
	}

	if (!state?.downloadUrl) {
		outputStatus.textContent = 'Generate a deck to unlock links and exports.';
		setLinkState(openViewerLink, null);
		setLinkState(downloadPptxLink, null);
		setLinkState(downloadPdfLink, null);
		setLinkState(openShareLink, null);
		setDisabled(copyShareLinkButton, true);
		return;
	}

	outputStatus.textContent = 'Deck ready. Open viewer, export files, or share web link.';
	setLinkState(openViewerLink, '#viewer');
	setLinkState(downloadPptxLink, state.downloadUrl);
	setLinkState(downloadPdfLink, state.pdfUrl ?? null);
	setLinkState(openShareLink, state.shareUrl ?? null);
	setDisabled(copyShareLinkButton, !state.shareUrl);
}

function restoreDeckResultFromLocalStorage(): boolean {
	try {
		const raw = localStorage.getItem(DECK_RESULT_STORAGE_KEY);
		if (!raw) return false;

		const parsed: unknown = JSON.parse(raw);
		if (!isDeckResult(parsed)) return false;
		if (!parsed.downloadUrl || !parsed.slideData) return false;

		setOutputState(parsed);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

function collectSlideExclusions(): string[] {
	const excluded: string[] = [];

	slideSelector
		.querySelectorAll('input[type="checkbox"][data-slide-id]')
		.forEach((checkbox) => {
			if (checkbox instanceof HTMLInputElement && !checkbox.checked) {
				excluded.push(checkbox.dataset.slideId || '');
			}
		});

	return excluded;
}

function readFormPayload(): FormPayload {
	const payload: FormPayload = {};
	const fields = form.querySelectorAll(
		'input[name], textarea[name], select[name]',
	);

	fields.forEach((field) => {
		if (
			!(
				field instanceof HTMLInputElement
				|| field instanceof HTMLTextAreaElement
				|| field instanceof HTMLSelectElement
			)
		) {
			return;
		}
		if (field.disabled) return;

		if (field instanceof HTMLInputElement && field.type === 'checkbox') {
			payload[field.name] = field.checked;
			return;
		}

		payload[field.name] = field.value.trim();
	});

	payload.excludedSlides = collectSlideExclusions();

	return payload;
}

function writeField(fieldName: string, value: unknown): boolean {
	const field = form.querySelector(`[name="${fieldName}"]`);
	if (!field) return false;
	if (
		field instanceof HTMLInputElement
		|| field instanceof HTMLTextAreaElement
		|| field instanceof HTMLSelectElement
	) {
		field.value = String(value ?? '');
	}
	return true;
}

function applyDraftToForm(draft: Record<string, unknown> = {}): void {
	Object.entries(draft).forEach(([fieldName, value]) => {
		writeField(fieldName, value);
	});
}

function applyImageDraft(imageDraft: ImageDraft = {}): void {
	const field = form.querySelector('[name="imagePrompts"]');
	if (
		!field
		|| !(field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement)
	) {
		return;
	}

	if (imageDraft.combinedPromptText) {
		field.value = imageDraft.combinedPromptText;
		return;
	}

	if (Array.isArray(imageDraft.prompts)) {
		field.value = imageDraft.prompts
			.map(
				(prompt, index) => `Slide ${index + 1} (${prompt.slideId || 'slide'}) :: ${prompt.prompt || ''}`,
			)
			.join('\n');
	}
}

function parseCharacterAssetsFromField(): CharacterAsset[] {
	const field = form.querySelector('[name="characterAssets"]');
	if (
		!field
		|| !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
	) {
		return [];
	}
	if (!field.value.trim()) return [];

	try {
		const parsed: unknown = JSON.parse(field.value);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(item: unknown): item is CharacterAsset =>
					isRecord(item)
					&& 'dataUrl' in item
					&& typeof item.dataUrl === 'string',
			)
			.slice(0, 10);
	} catch {
		return [];
	}
}

function syncCharacterAssetsField(): void {
	const field = form.querySelector('[name="characterAssets"]');
	if (
		!field
		|| !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
	) {
		return;
	}
	field.value = JSON.stringify(characterAssets);
}

function formatBytes(size: number): string {
	if (!Number.isFinite(size) || size <= 0) return '0 KB';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderCharacterAssetsPreview(): void {
	if (!characterAssetsPreview || !characterAssetsStatus) return;

	characterAssetsPreview.innerHTML = '';

	if (!characterAssets.length) {
		characterAssetsStatus.textContent = 'No character assets uploaded.';
		return;
	}

	characterAssetsStatus.textContent = `${characterAssets.length} character asset${
		characterAssets.length > 1 ? 's' : ''
	} ready.`;

	characterAssets.forEach((asset, index) => {
		const card = document.createElement('article');
		card.className = 'asset-card';

		const img = document.createElement('img');
		img.src = asset.dataUrl;
		img.alt = asset.name || `Character asset ${index + 1}`;

		const meta = document.createElement('div');
		meta.className = 'asset-meta';

		const name = document.createElement('p');
		name.className = 'asset-name';
		name.textContent = `${asset.name || `Asset ${index + 1}`} (${formatBytes(asset.size || 0)})`;

		const placement = document.createElement('select');
		CHARACTER_PLACEMENTS.forEach((optionData) => {
			const option = document.createElement('option');
			option.value = optionData.value;
			option.textContent = optionData.label;
			option.selected = (asset.placement || 'all-mascot') === optionData.value;
			placement.appendChild(option);
		});
		placement.addEventListener('change', () => {
			const current = characterAssets[index];
			if (!current) return;
			characterAssets[index] = {
				...current,
				placement: placement.value,
			};
			syncCharacterAssetsField();
			pushHistorySnapshot();
			markEditorDirty();
		});

		const remove = document.createElement('button');
		remove.type = 'button';
		remove.className = 'ghost small';
		remove.textContent = 'Remove';
		remove.addEventListener('click', async () => {
			characterAssets.splice(index, 1);
			syncCharacterAssetsField();
			renderCharacterAssetsPreview();
			pushHistorySnapshot();
			markEditorDirty();
			if (currentDeckResult?.slideData) {
				try {
					await refreshViewerFromPayload();
				} catch (error) {
					console.error(error);
				}
			}
		});

		meta.appendChild(name);
		meta.appendChild(placement);
		meta.appendChild(remove);

		card.appendChild(img);
		card.appendChild(meta);
		characterAssetsPreview.appendChild(card);
	});
}

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ''));
		reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
		reader.readAsDataURL(file);
	});
}

async function handleCharacterAssetsUpload(event: Event): Promise<void> {
	const target = event.target;
	if (!(target instanceof HTMLInputElement)) return;
	const files = Array.from(target.files || []);
	if (!files.length) return;

	const maxPerFileBytes = 1.5 * 1024 * 1024;
	const maxAssets = 8;
	const room = Math.max(0, maxAssets - characterAssets.length);

	if (!room) {
		setStatus(
			'Character asset limit reached (8). Remove one to add another.',
			true,
		);
		target.value = '';
		return;
	}

	const accepted = files
		.filter((file) => file.type.startsWith('image/'))
		.slice(0, room);

	for (const file of accepted) {
		if (file.size > maxPerFileBytes) {
			setStatus(`${file.name} is too large (max 1.5MB).`, true);
			continue;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			characterAssets.push({
				id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				name: file.name,
				size: file.size,
				dataUrl: String(dataUrl),
				placement: 'all-mascot',
			});
		} catch (error) {
			console.error(error);
			setStatus(
				error instanceof Error
					? error.message
					: 'Could not upload one of the images.',
				true,
			);
		}
	}

	syncCharacterAssetsField();
	renderCharacterAssetsPreview();
	target.value = '';
	pushHistorySnapshot();
	markEditorDirty();
	setStatus('Character assets updated.');

	if (currentDeckResult?.slideData) {
		try {
			await refreshViewerFromPayload();
		} catch (error) {
			console.error(error);
		}
	}
}

async function clearCharacterAssets(): Promise<void> {
	characterAssets = [];
	syncCharacterAssetsField();
	renderCharacterAssetsPreview();
	pushHistorySnapshot();
	markEditorDirty();
	setStatus('Character assets cleared.');

	if (currentDeckResult?.slideData) {
		try {
			await refreshViewerFromPayload();
		} catch (error) {
			console.error(error);
		}
	}
}

function renderSlideSelector(
	template: TemplateEntry | undefined,
	keepSelection = true,
): void {
	if (!template) return;

	const existing = new Map<string, boolean>();
	if (keepSelection) {
		slideSelector
			.querySelectorAll('input[type="checkbox"][data-slide-id]')
			.forEach((checkbox) => {
				if (checkbox instanceof HTMLInputElement) {
					existing.set(checkbox.dataset.slideId || '', checkbox.checked);
				}
			});
	}

	slideSelector.innerHTML = '';

	template.slides.forEach((slide) => {
		const chip = document.createElement('label');
		chip.className = 'slide-chip';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.dataset.slideId = slide.id;
		checkbox.checked = existing.has(slide.id)
			? (existing.get(slide.id) ?? false)
			: Boolean(slide.defaultIncluded);

		const name = document.createElement('span');
		name.textContent = slide.label;

		const meta = document.createElement('small');
		meta.textContent = slide.required ? 'Core' : 'Optional';

		chip.appendChild(checkbox);
		chip.appendChild(name);
		chip.appendChild(meta);
		slideSelector.appendChild(chip);
	});
}

interface TemplatesApiResponse {
	success: boolean;
	templates: TemplateEntry[];
}

interface ProvidersApiResponse {
	success: boolean;
	providers?: {
		textProviders?: ProviderOption[];
		imageProviders?: ProviderOption[];
	};
}

interface PreviewApiResponse {
	success: boolean;
	message?: string;
	slideData: DeckData;
}

interface AutofillApiResponse {
	success: boolean;
	message?: string;
	draft?: Record<string, unknown>;
	imageDraft?: ImageDraft;
	provider?: string;
}

interface GenerateApiResponse {
	success: boolean;
	message?: string;
	slideData: DeckData;
	downloadUrl?: string;
	pdfUrl?: string;
	shareUrl?: string;
}

interface ChatApiResponse {
	success: boolean;
	message?: string;
	reply?: string;
	suggestedChanges?: SuggestedChange[];
	provider?: string;
}

async function hydrateTemplates(): Promise<void> {
	const response = await fetch('/api/templates');
	const result: TemplatesApiResponse = await response.json();

	if (!response.ok || !result.success || !Array.isArray(result.templates)) {
		throw new Error('Could not load templates.');
	}

	if (templateSelect instanceof HTMLSelectElement) {
		templateSelect.innerHTML = '';

		result.templates.forEach((template) => {
			templateMap.set(template.id, template);

			const option = document.createElement('option');
			option.value = template.id;
			option.textContent = template.label;
			option.title = template.description;
			templateSelect.appendChild(option);
		});

		const firstTemplate = result.templates[0];
		if (!templateSelect.value && firstTemplate) {
			templateSelect.value = firstTemplate.id;
		}

		renderSlideSelector(templateMap.get(templateSelect.value), false);
	}
}

async function hydrateAiProviders(): Promise<void> {
	const response = await fetch('/api/ai/providers');
	const result: ProvidersApiResponse = await response.json();

	if (!response.ok || !result.success || !result.providers) return;

	const textProviderSelect = document.getElementById('aiTextProvider');
	const imageProviderSelect = document.getElementById('aiImageProvider');

	if (textProviderSelect instanceof HTMLSelectElement) {
		textProviderSelect.innerHTML = '';
		(result.providers.textProviders || []).forEach((provider) => {
			const option = document.createElement('option');
			option.value = provider.id;
			option.textContent = provider.label;
			textProviderSelect.appendChild(option);
		});
	}

	if (imageProviderSelect instanceof HTMLSelectElement) {
		imageProviderSelect.innerHTML = '';
		(result.providers.imageProviders || []).forEach((provider) => {
			const option = document.createElement('option');
			option.value = provider.id;
			option.textContent = provider.label;
			imageProviderSelect.appendChild(option);
		});
	}
}

function readAiSettings(): Record<string, string> {
	try {
		const raw = localStorage.getItem(AI_SETTINGS_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		if (isStringRecord(parsed)) return parsed;
		return {};
	} catch {
		return {};
	}
}

function applyAiSettings(settings: Record<string, string> = {}): void {
	[
		'aiTextProvider',
		'aiTextModel',
		'aiTextApiKey',
		'aiTextBaseUrl',
		'aiImageProvider',
		'aiImageModel',
		'aiImageApiKey',
		'aiImageBaseUrl',
	].forEach((fieldName) => {
		const field = document.getElementById(fieldName);
		if (!field || !(fieldName in settings)) return;
		const value = settings[fieldName];
		if (value !== undefined) setInputValue(field, value);
	});
}

function saveAiSettings(): void {
	const settings: Record<string, string> = {};

	[
		'aiTextProvider',
		'aiTextModel',
		'aiTextApiKey',
		'aiTextBaseUrl',
		'aiImageProvider',
		'aiImageModel',
		'aiImageApiKey',
		'aiImageBaseUrl',
	].forEach((fieldName) => {
		const field = document.getElementById(fieldName);
		if (!field) return;
		settings[fieldName] = getInputValue(field).trim();
	});

	localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
	setStatus('AI settings saved locally.');
}

function addChatMessage(role: string, text: string): void {
	const item = document.createElement('div');
	item.className = `chat-message ${role}`;
	item.textContent = text;
	chatMessagesEl.appendChild(item);
	chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function setChatTarget(field: string, label: string): void {
	chatTarget = {
		field: field || 'global-concept',
		label: label || 'Global concept',
	};
	chatTargetEl.textContent = chatTarget.label;
}

function openChatPanel(): void {
	chatPanel.classList.remove('hidden');
	chatLauncher.classList.add('hidden');
}

function closeChatPanel(): void {
	chatPanel.classList.add('hidden');
	chatLauncher.classList.remove('hidden');
}

function renderChatSuggestions(suggestions: SuggestedChange[] = []): void {
	chatSuggestionsEl.innerHTML = '';

	if (!Array.isArray(suggestions) || !suggestions.length) return;

	suggestions.forEach((change) => {
		const card = document.createElement('div');
		card.className = 'suggestion-card';

		const title = document.createElement('strong');
		title.textContent = change.label || change.field;

		const preview = document.createElement('p');
		preview.textContent = change.value;

		const applyButton = document.createElement('button');
		applyButton.type = 'button';
		applyButton.className = 'ghost small';
		applyButton.textContent = `Apply to ${change.field}`;
		applyButton.addEventListener('click', async () => {
			writeField(change.field, change.value);
			updateProjectChrome();
			pushHistorySnapshot();
			markEditorDirty();
			setStatus(`Applied update to ${change.field}. Refreshing viewer...`);
			await refreshViewerFromPayload();
		});

		card.appendChild(title);
		card.appendChild(preview);
		card.appendChild(applyButton);
		chatSuggestionsEl.appendChild(card);
	});
}

async function refreshViewerFromPayload(): Promise<void> {
	const payload = readFormPayload();
	const response = await fetch('/api/preview', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	const result: PreviewApiResponse = await response.json();
	if (!response.ok || !result.success) {
		throw new Error(result.message || 'Could not refresh viewer.');
	}

	if (currentDeckResult) {
		currentDeckResult.slideData = result.slideData;
		setOutputState({ ...currentDeckResult, slideData: result.slideData });
	}
	updateViewerData(result.slideData);
}

async function runAutofill(): Promise<void> {
	setDisabled(autoFillButton, true);
	setStatus('AI is generating all slide text and image prompts...');

	try {
		const payload = readFormPayload();

		const response = await fetch('/api/ai/autofill', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const result: AutofillApiResponse = await response.json();
		if (!response.ok || !result.success) {
			throw new Error(result.message || 'AI autofill failed.');
		}

		applyDraftToForm(result.draft || {});
		applyImageDraft(result.imageDraft || {});
		updateProjectChrome();
		pushHistorySnapshot();
		markEditorDirty();
		setStatus(`Autofill complete (${result.provider || 'local'}).`);
	} catch (error) {
		console.error(error);
		setStatus(
			error instanceof Error ? error.message : 'Could not run AI autofill.',
			true,
		);
	} finally {
		setDisabled(autoFillButton, false);
	}
}

async function generateDeck(event: Event): Promise<void> {
	event.preventDefault();
	setDisabled(generateButton, true);
	setStatus('Generating pitch deck...');

	try {
		const payload = readFormPayload();
		const totalSlides = slideSelector.querySelectorAll(
			'input[type="checkbox"][data-slide-id]',
		).length;
		if (
			Array.isArray(payload.excludedSlides)
			&& payload.excludedSlides.length >= totalSlides
		) {
			throw new Error('Include at least one slide before generating.');
		}

		const response = await fetch('/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const result: GenerateApiResponse = await response.json();
		if (!response.ok || !result.success) {
			throw new Error(result.message || 'Could not generate deck.');
		}

		const shareUrlAbsolute = result.shareUrl
			? new URL(result.shareUrl, window.location.origin).toString()
			: null;
		const pdfUrlAbsolute = result.pdfUrl
			? new URL(result.pdfUrl, window.location.origin).toString()
			: null;
		const downloadUrlAbsolute = result.downloadUrl
			? new URL(result.downloadUrl, window.location.origin).toString()
			: null;

		setOutputState({
			slideData: result.slideData,
			downloadUrl: downloadUrlAbsolute,
			pdfUrl: pdfUrlAbsolute,
			shareUrl: shareUrlAbsolute,
		});

		showViewer(result.slideData, {
			downloadUrl: downloadUrlAbsolute,
			pdfUrl: pdfUrlAbsolute,
			shareUrl: shareUrlAbsolute,
		});

		setStatus('Deck generated successfully.');
	} catch (error) {
		console.error(error);
		setStatus(
			error instanceof Error ? error.message : 'Could not generate deck.',
			true,
		);
	} finally {
		setDisabled(generateButton, false);
	}
}

async function runViewerChat(): Promise<void> {
	const message = getInputValue(chatInputEl).trim();
	if (!message) return;

	setDisabled(chatSendButton, true);
	addChatMessage('user', message);
	setInputValue(chatInputEl, '');

	try {
		const payload = readFormPayload();

		const response = await fetch('/api/ai/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				payload,
				targetField: chatTarget.field,
				message,
				history: chatHistory.slice(-10),
			}),
		});

		const result: ChatApiResponse = await response.json();
		if (!response.ok || !result.success) {
			throw new Error(result.message || 'AI chat failed.');
		}

		addChatMessage('assistant', result.reply || 'Suggestions ready.');
		renderChatSuggestions(result.suggestedChanges || []);

		chatHistory.push({ role: 'user', content: message });
		chatHistory.push({
			role: 'assistant',
			content: result.reply || 'Suggestions ready.',
		});

		setStatus(`Copilot suggestion ready (${result.provider || 'local'}).`);
	} catch (error) {
		console.error(error);
		addChatMessage(
			'assistant',
			`Error: ${error instanceof Error ? error.message : 'Could not process request.'}`,
		);
		setStatus(
			error instanceof Error ? error.message : 'Could not run viewer copilot.',
			true,
		);
	} finally {
		setDisabled(chatSendButton, false);
	}
}

templateSelect.addEventListener('change', () => {
	renderSlideSelector(templateMap.get(getInputValue(templateSelect)), false);
	updateProjectChrome();
	pushHistorySnapshot();
	markEditorDirty();
	setStatus(
		`Template selected: ${templateMap.get(getInputValue(templateSelect))?.label || getInputValue(templateSelect)}`,
	);
});

includeAllSlidesButton.addEventListener('click', () => {
	slideSelector
		.querySelectorAll('input[type="checkbox"][data-slide-id]')
		.forEach((checkbox) => {
			if (checkbox instanceof HTMLInputElement) {
				checkbox.checked = true;
			}
		});
	pushHistorySnapshot();
	markEditorDirty();
	setStatus('All slides included.');
});

includeCoreSlidesButton.addEventListener('click', () => {
	const template = templateMap.get(getInputValue(templateSelect));
	if (!template) return;

	const required = new Set(
		template.slides.filter((slide) => slide.required).map((slide) => slide.id),
	);

	slideSelector
		.querySelectorAll('input[type="checkbox"][data-slide-id]')
		.forEach((checkbox) => {
			if (checkbox instanceof HTMLInputElement) {
				checkbox.checked = required.has(checkbox.dataset.slideId || '');
			}
		});

	pushHistorySnapshot();
	markEditorDirty();
	setStatus('Core slides selected.');
});

layoutPresetLock?.addEventListener('change', () => {
	syncLayoutPresetLockUi();
	pushHistorySnapshot();
	markEditorDirty();
});
bindBrandPaletteControls();

autoFillButton.addEventListener('click', runAutofill);
form.addEventListener('submit', generateDeck);
form.addEventListener('input', handleFormMutation);
form.addEventListener('change', handleFormMutation);
saveAiSettingsButton.addEventListener('click', saveAiSettings);
characterAssetsInput?.addEventListener('change', handleCharacterAssetsUpload);
clearCharacterAssetsButton?.addEventListener('click', clearCharacterAssets);
undoChangeButton?.addEventListener('click', () => {
	undoChange();
});
redoChangeButton?.addEventListener('click', () => {
	redoChange();
});
document.addEventListener('keydown', handleHistoryHotkeys);

openViewerLink.addEventListener('click', (event: MouseEvent) => {
	if (!currentDeckResult?.slideData) {
		event.preventDefault();
		return;
	}

	event.preventDefault();
	showViewer(currentDeckResult.slideData, {
		downloadUrl: currentDeckResult.downloadUrl,
		pdfUrl: currentDeckResult.pdfUrl,
		shareUrl: currentDeckResult.shareUrl,
	});
});

copyShareLinkButton.addEventListener('click', async () => {
	if (!currentDeckResult?.shareUrl) return;

	try {
		await navigator.clipboard.writeText(currentDeckResult.shareUrl);
		setStatus('Share link copied.');
	} catch {
		setStatus('Could not copy link. Copy manually from Open share page.', true);
	}
});

chatLauncher.addEventListener('click', openChatPanel);
chatClose.addEventListener('click', closeChatPanel);
chatSendButton.addEventListener('click', runViewerChat);
chatInputEl.addEventListener('keydown', (event: KeyboardEvent) => {
	if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
		event.preventDefault();
		runViewerChat();
	}
});

window.addEventListener('deck:select-target', (event: Event) => {
	if (!(event instanceof CustomEvent)) return;
	const detail: { target?: string; label?: string } | undefined = event.detail;
	const field = detail?.target || 'global-concept';
	const label = detail?.label || field;
	setChatTarget(field, label);
	openChatPanel();

	if (!chatMessagesEl.childElementCount) {
		addChatMessage(
			'assistant',
			`Selected "${label}". Ask me to rewrite it and apply changes.`,
		);
	}
});

(async function bootstrap(): Promise<void> {
	setOutputState(null);
	setSaveIndicator('is-saved');
	syncHistoryButtons();

	try {
		characterAssets = parseCharacterAssetsFromField();
		renderCharacterAssetsPreview();
		syncCharacterAssetsField();
		syncLayoutPresetLockUi();
		syncBrandPaletteUi();
		await hydrateTemplates();
		await hydrateAiProviders();
		applyAiSettings(readAiSettings());
		setChatTarget('global-concept', 'Global concept');
		updateProjectChrome();

		const restoredDraft = loadDraftFromLocalStorage();
		if (!restoredDraft) {
			await runAutofill();
			updateProjectChrome();
		}
		restoreDeckResultFromLocalStorage();

		pushHistorySnapshot();
		autosaveNow({ quiet: true });
		syncHistoryButtons();
	} catch (error) {
		console.error(error);
		setStatus(
			error instanceof Error ? error.message : 'Could not initialize editor.',
			true,
		);
		setSaveIndicator('is-error');
	}
})();
