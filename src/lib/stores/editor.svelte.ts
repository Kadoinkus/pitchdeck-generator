/**
 * Editor store — singleton reactive state for the deck editor.
 *
 * Uses Svelte 5 runes at module scope. Components import exported
 * getters/functions directly; no writable() stores.
 */

import { DEFAULT_THEME_COLORS, normalizeHexColor, resolveThemePalette } from '$lib/color-palette';
import { isRecord } from '$lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateSlide {
	id: string;
	label: string;
	required: boolean;
	defaultIncluded: boolean;
}

export interface TemplateEntry {
	id: string;
	label: string;
	description: string;
	slides: TemplateSlide[];
}

export interface ProviderOption {
	id: string;
	label: string;
}

export interface CharacterAsset {
	id: string;
	name: string;
	size: number;
	dataUrl: string;
	placement: string;
}

export interface DeckResult {
	slideData?: DeckResultSlideData;
	shareToken?: string | null;
	downloadUrl?: string | null;
	pdfUrl?: string | null;
	shareUrl?: string | null;
	/** Server-side SHA-256 hash — used for idempotent dedup, NOT for client comparison. */
	payloadHash?: string | null;
	publishedAt?: string | null;
	/** Client-side payloadSignature snapshot at publish time — used for stale detection. */
	publishedSignature?: string | null;
}

export interface DeckResultSlideData {
	slides: Array<{ type: string; [key: string]: unknown }>;
	theme: Record<string, unknown>;
	project?: { projectTitle?: string; clientName?: string };
	[key: string]: unknown;
}

export interface FormPayload {
	[key: string]: unknown;
	excludedSlides?: string[];
}

interface HistoryEntry {
	payload: FormPayload;
	signature: string;
	at: number;
}

export interface ImageDraft {
	combinedPromptText?: string;
	prompts?: Array<{ slideId?: string; prompt?: string }>;
}

export const CHARACTER_PLACEMENTS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: 'all-mascot', label: 'All mascot slides' },
	{ value: 'cover', label: 'Cover' },
	{ value: 'meet-buddy', label: 'Meet the buddy' },
	{ value: 'example-interaction', label: 'Example interaction' },
	{ value: 'closing', label: 'Closing' },
	{ value: 'all', label: 'All slides' },
];

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const AI_SETTINGS_KEY = 'proposalDeckAiSettingsV3';
const DRAFT_STORAGE_KEY = 'proposalDeckDraftV4';
const DECK_RESULT_STORAGE_KEY = 'proposalDeckLastResultV1';
const HISTORY_LIMIT = 80;

// ---------------------------------------------------------------------------
// Form payload — all form fields
// ---------------------------------------------------------------------------

const DEFAULT_PAYLOAD: FormPayload = {
	templateId: '',
	clientName: 'Acme Client',
	clientUrl: 'https://www.acme-client.com',
	brandName: 'Notso AI',
	deckVersion: 'v1.0',
	layoutPreset: 'notso-premium-v1',
	layoutPresetLock: true,
	primaryColor: DEFAULT_THEME_COLORS.primaryColor,
	accentColor: DEFAULT_THEME_COLORS.accentColor,
	secondaryColor: DEFAULT_THEME_COLORS.secondaryColor,
	backgroundColor: DEFAULT_THEME_COLORS.backgroundColor,
	textColor: DEFAULT_THEME_COLORS.textColor,
	harmonyMode: 'complementary',
	paletteShuffleSeed: '0',
	lockAccentColor: false,
	lockSecondaryColor: false,
	headingFont: 'Sora',
	bodyFont: 'Inter',
	projectTitle: 'AI Mascot Proposal',
	coverOneLiner: 'A playful, animated chatbot experience that feels premium and converts.',
	subtitle: 'A reusable digital buddy concept tailored to your brand.',
	proposalDate: 'June 2026',
	mascotName: 'Sven',
	problemPoints: '',
	opportunityPoints: '',
	solutionPillars: '',
	whatNotsoIntro: '',
	whatNotsoCards: '',
	buddyDescription: '',
	buddyPersonality: '',
	toneSliders: '',
	experienceConcept: '',
	chatFlow: '',
	interactionExample: '',
	businessImpact: '',
	analyticsDescription: '',
	analyticsBullets: '',
	deliverables: '',
	pricing: '',
	timeline: '',
	closingText: '',
	teamCards: '',
	characterAssets: '',
	imagePrompts: '',
	contactName: 'Max Kowalski',
	contactEmail: 'max@notso.ai',
	contactPhone: '+31 6 40450599',
	excludedSlides: [],
	// AI settings
	aiTextProvider: '',
	aiTextModel: 'gpt-4.1-mini',
	aiTextApiKey: '',
	aiTextBaseUrl: 'https://api.openai.com/v1',
	aiImageProvider: '',
	aiImageModel: 'gpt-4.1-mini',
	aiImageApiKey: '',
	aiImageBaseUrl: 'https://api.openai.com/v1',
};

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

let _payload = $state<FormPayload>({ ...DEFAULT_PAYLOAD });
let _historyStack = $state<HistoryEntry[]>([]);
let _historyIndex = $state(-1);
let _suspendHistory = $state(false);
let _lastSavedSignature = $state('');
let _deckResult = $state<DeckResult | null>(null);
let _status = $state<{ text: string; isError: boolean }>({ text: 'Ready.', isError: false });
let _saveState = $state<'is-saved' | 'is-dirty' | 'is-saving' | 'is-error'>('is-saved');
let _templates = $state<TemplateEntry[]>([]);
let _textProviders = $state<ProviderOption[]>([]);
let _imageProviders = $state<ProviderOption[]>([]);
let _characterAssets = $state<CharacterAsset[]>([]);
let _paletteStatus = $state<{ text: string; tone: string }>({
	text: 'Choose a preset or harmony mode. Shuffle explores safe color variants.',
	tone: '',
});

let _autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let _historyInputTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const canUndo = $derived(_historyIndex > 0);
const canRedo = $derived(_historyIndex < _historyStack.length - 1);
const isDirty = $derived(payloadSignature(_payload) !== _lastSavedSignature);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isStringRecord(value: unknown): value is Record<string, string> {
	if (!isRecord(value)) return false;
	return Object.values(value).every((v) => typeof v === 'string');
}

function clonePayload(p: FormPayload = {}): FormPayload {
	return JSON.parse(JSON.stringify(p));
}

function payloadSignature(p: FormPayload = {}): string {
	const normalized: Record<string, unknown> = {
		...p,
		excludedSlides: Array.isArray(p.excludedSlides)
			? [...p.excludedSlides].sort()
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

// ---------------------------------------------------------------------------
// Exported read-only accessors
// ---------------------------------------------------------------------------

export function getPayload(): FormPayload {
	return _payload;
}

export function getCanUndo(): boolean {
	return canUndo;
}

export function getCanRedo(): boolean {
	return canRedo;
}

export function getIsDirty(): boolean {
	return isDirty;
}

export function getStatus(): { text: string; isError: boolean } {
	return _status;
}

export function getSaveState(): string {
	return _saveState;
}

export function getTemplates(): TemplateEntry[] {
	return _templates;
}

export function getTextProviders(): ProviderOption[] {
	return _textProviders;
}

export function getImageProviders(): ProviderOption[] {
	return _imageProviders;
}

export function getCharacterAssets(): CharacterAsset[] {
	return _characterAssets;
}

export function getDeckResult(): DeckResult | null {
	return _deckResult;
}

export function getPaletteStatus(): { text: string; tone: string } {
	return _paletteStatus;
}

// ---------------------------------------------------------------------------
// Payload mutation
// ---------------------------------------------------------------------------

export function setPayloadField(key: string, value: unknown): void {
	_payload = { ..._payload, [key]: value };
}

export function setPayloadFields(updates: Record<string, unknown>): void {
	_payload = { ..._payload, ...updates };
}

export function setExcludedSlides(excluded: string[]): void {
	_payload = { ..._payload, excludedSlides: excluded };
}

export function replacePayload(next: FormPayload): void {
	_payload = { ...next };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function setTemplates(entries: TemplateEntry[]): void {
	_templates = entries;
	if (entries.length > 0 && !_payload.templateId) {
		const first = entries[0];
		if (first) {
			_payload = { ..._payload, templateId: first.id };
		}
	}
}

export function getTemplateById(id: string): TemplateEntry | undefined {
	return _templates.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export function setProviders(text: ProviderOption[], image: ProviderOption[]): void {
	_textProviders = text;
	_imageProviders = image;
}

// ---------------------------------------------------------------------------
// Character assets
// ---------------------------------------------------------------------------

export function setCharacterAssets(assets: CharacterAsset[]): void {
	_characterAssets = assets;
	_payload = { ..._payload, characterAssets: JSON.stringify(assets) };
}

export function addCharacterAsset(asset: CharacterAsset): void {
	_characterAssets = [..._characterAssets, asset];
	_payload = { ..._payload, characterAssets: JSON.stringify(_characterAssets) };
}

export function removeCharacterAsset(index: number): void {
	_characterAssets = _characterAssets.filter((_, i) => i !== index);
	_payload = { ..._payload, characterAssets: JSON.stringify(_characterAssets) };
}

export function updateAssetPlacement(index: number, placement: string): void {
	const updated = _characterAssets.map((a, i) => i === index ? { ...a, placement } : a);
	_characterAssets = updated;
	_payload = { ..._payload, characterAssets: JSON.stringify(updated) };
}

export function clearAllAssets(): void {
	_characterAssets = [];
	_payload = { ..._payload, characterAssets: '' };
}

export function parseAssetsFromPayload(): void {
	const raw = _payload.characterAssets;
	if (typeof raw !== 'string' || !raw.trim()) {
		_characterAssets = [];
		return;
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			_characterAssets = [];
			return;
		}
		_characterAssets = parsed
			.filter(
				(item: unknown): item is CharacterAsset =>
					isRecord(item)
					&& 'dataUrl' in item
					&& typeof item.dataUrl === 'string',
			)
			.slice(0, 10);
	} catch {
		_characterAssets = [];
	}
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export function setStatus(text: string, isError = false): void {
	_status = { text, isError };
}

// ---------------------------------------------------------------------------
// Save indicator
// ---------------------------------------------------------------------------

export function setSaveState(state: typeof _saveState): void {
	_saveState = state;
}

// ---------------------------------------------------------------------------
// Palette status
// ---------------------------------------------------------------------------

export function setPaletteStatus(text: string, tone = ''): void {
	_paletteStatus = { text, tone };
}

// ---------------------------------------------------------------------------
// Palette sync
// ---------------------------------------------------------------------------

export function syncBrandPalette(): void {
	const p = _payload;
	const primaryColor = normalizeHexColor(p.primaryColor, DEFAULT_THEME_COLORS.primaryColor);
	const harmonyMode = typeof p.harmonyMode === 'string' ? p.harmonyMode : 'complementary';
	const shuffleSeed = Math.max(0, Math.floor(Number.parseInt(String(p.paletteShuffleSeed || '0'), 10) || 0));

	const palette = resolveThemePalette({
		primaryColor,
		harmonyMode,
		shuffleSeed,
		locks: {
			accentColor: Boolean(p.lockAccentColor),
			secondaryColor: Boolean(p.lockSecondaryColor),
		},
		manualColors: {
			primaryColor,
			accentColor: normalizeHexColor(p.accentColor, DEFAULT_THEME_COLORS.accentColor),
			secondaryColor: normalizeHexColor(p.secondaryColor, DEFAULT_THEME_COLORS.secondaryColor),
			backgroundColor: normalizeHexColor(p.backgroundColor, DEFAULT_THEME_COLORS.backgroundColor),
			textColor: normalizeHexColor(p.textColor, DEFAULT_THEME_COLORS.textColor),
		},
	});

	_payload = {
		..._payload,
		primaryColor: palette.theme.primaryColor,
		accentColor: palette.theme.accentColor,
		secondaryColor: palette.theme.secondaryColor,
		backgroundColor: palette.theme.backgroundColor,
		textColor: palette.theme.textColor,
		harmonyMode: palette.harmonyMode,
		paletteShuffleSeed: String(palette.shuffleSeed),
	};

	if (palette.adjustments.length) {
		setPaletteStatus(
			`${palette.harmonyMode} harmony \u00b7 variant ${
				palette.variantIndex + 1
			}/${palette.variantCount}. Corrected ${palette.adjustments.length} color${
				palette.adjustments.length === 1 ? '' : 's'
			} for readability.`,
			'warning',
		);
	} else {
		setPaletteStatus(
			`${palette.harmonyMode} harmony \u00b7 variant ${palette.variantIndex + 1}/${palette.variantCount}.`,
		);
	}
}

export function shufflePalette(): void {
	const current = Math.max(0, Math.floor(Number.parseInt(String(_payload.paletteShuffleSeed || '0'), 10) || 0));
	_payload = { ..._payload, paletteShuffleSeed: String(current + 1) };
	syncBrandPalette();
	pushHistory();
	markDirty();
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function pushHistory(): void {
	if (_suspendHistory) return;

	const payload = clonePayload(_payload);
	const signature = payloadSignature(payload);
	const current = _historyStack[_historyIndex];
	if (current?.signature === signature) return;

	let stack = _historyStack;
	if (_historyIndex < stack.length - 1) {
		stack = stack.slice(0, _historyIndex + 1);
	}

	stack = [...stack, { payload, signature, at: Date.now() }];

	if (stack.length > HISTORY_LIMIT) {
		const overflow = stack.length - HISTORY_LIMIT;
		stack = stack.slice(overflow);
	}

	_historyStack = stack;
	_historyIndex = stack.length - 1;
}

export function undo(): void {
	if (_historyIndex <= 0) return;
	applyHistoryIndex(_historyIndex - 1);
}

export function redo(): void {
	if (_historyIndex >= _historyStack.length - 1) return;
	applyHistoryIndex(_historyIndex + 1);
}

function applyHistoryIndex(nextIndex: number): void {
	const entry = _historyStack[nextIndex];
	if (!entry) return;

	_historyIndex = nextIndex;
	_suspendHistory = true;
	_payload = { ...entry.payload };
	parseAssetsFromPayload();
	syncBrandPalette();
	_suspendHistory = false;

	if (entry.signature === _lastSavedSignature) {
		_saveState = 'is-saved';
	} else {
		_saveState = 'is-dirty';
	}
}

export function queueHistorySnapshot(): void {
	if (_historyInputTimer !== null) clearTimeout(_historyInputTimer);
	_historyInputTimer = setTimeout(() => {
		pushHistory();
	}, 160);
}

// ---------------------------------------------------------------------------
// Autosave / localStorage persistence
// ---------------------------------------------------------------------------

export function saveDraft(quiet = false): void {
	if (_autosaveTimer !== null) clearTimeout(_autosaveTimer);
	const payload = clonePayload(_payload);
	const signature = payloadSignature(payload);

	if (!quiet) _saveState = 'is-saving';

	try {
		localStorage.setItem(
			DRAFT_STORAGE_KEY,
			JSON.stringify({ version: 4, savedAt: Date.now(), payload }),
		);
		_lastSavedSignature = signature;
		_saveState = 'is-saved';
	} catch (error) {
		console.error(error);
		_saveState = 'is-error';
	}
}

export function scheduleAutosave(): void {
	if (_suspendHistory) return;
	if (_autosaveTimer !== null) clearTimeout(_autosaveTimer);
	_autosaveTimer = setTimeout(() => saveDraft(), 700);
}

export function markDirty(): void {
	const signature = payloadSignature(_payload);
	if (signature === _lastSavedSignature) {
		if (_autosaveTimer !== null) clearTimeout(_autosaveTimer);
		_saveState = 'is-saved';
		return;
	}
	_saveState = 'is-dirty';
	scheduleAutosave();
}

export function loadDraft(): boolean {
	try {
		const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
		if (!raw) return false;

		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) return false;
		const source = isRecord(parsed.payload) ? parsed.payload : parsed;
		if (!isRecord(source)) return false;

		_suspendHistory = true;
		_payload = { ...DEFAULT_PAYLOAD, ...source };
		parseAssetsFromPayload();
		syncBrandPalette();
		_suspendHistory = false;

		_lastSavedSignature = payloadSignature(_payload);
		_saveState = 'is-saved';
		return true;
	} catch (error) {
		console.error(error);
		_saveState = 'is-error';
		return false;
	}
}

// ---------------------------------------------------------------------------
// Deck result
// ---------------------------------------------------------------------------

export function setDeckResult(result: DeckResult | null): void {
	_deckResult = result;
	try {
		if (result?.downloadUrl && result?.slideData) {
			localStorage.setItem(DECK_RESULT_STORAGE_KEY, JSON.stringify(result));
		} else {
			localStorage.removeItem(DECK_RESULT_STORAGE_KEY);
		}
	} catch (error) {
		console.error(error);
	}
}

export function restoreDeckResult(): boolean {
	try {
		const raw = localStorage.getItem(DECK_RESULT_STORAGE_KEY);
		if (!raw) return false;

		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) return false;

		const { downloadUrl, pdfUrl, shareUrl, shareToken, slideData } = parsed;
		if (!downloadUrl || typeof downloadUrl !== 'string') return false;
		if (!isRecord(slideData) || !Array.isArray(slideData.slides) || !isRecord(slideData.theme)) return false;

		const slides = slideData.slides.filter(
			(s: unknown): s is DeckResultSlideData['slides'][number] => isRecord(s) && typeof s.type === 'string',
		);
		if (slides.length === 0) return false;

		const project = isRecord(slideData.project) ? slideData.project : undefined;

		_deckResult = {
			shareToken: typeof shareToken === 'string' ? shareToken : null,
			downloadUrl,
			pdfUrl: typeof pdfUrl === 'string' ? pdfUrl : null,
			shareUrl: typeof shareUrl === 'string' ? shareUrl : null,
			payloadHash: typeof parsed.payloadHash === 'string' ? parsed.payloadHash : null,
			publishedAt: typeof parsed.publishedAt === 'string' ? parsed.publishedAt : null,
			publishedSignature: typeof parsed.publishedSignature === 'string' ? parsed.publishedSignature : null,
			slideData: {
				...slideData,
				slides,
				theme: slideData.theme,
				project: project
					? {
						projectTitle: typeof project.projectTitle === 'string' ? project.projectTitle : undefined,
						clientName: typeof project.clientName === 'string' ? project.clientName : undefined,
					}
					: undefined,
			},
		};
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

/**
 * Returns true when the current form payload has diverged from the
 * last-published snapshot, meaning the share links are stale.
 */
export function isPublishStale(): boolean {
	const result = _deckResult;
	if (!result?.publishedSignature) return false;
	return payloadSignature(_payload) !== result.publishedSignature;
}

/**
 * Clears publish-related fields from the deck result when user edits
 * make the published snapshot outdated. Keeps slideData for the viewer.
 */
export function markPublishStale(): void {
	if (!_deckResult) return;
	_deckResult = {
		..._deckResult,
		publishedSignature: null,
		publishedAt: null,
	};
}

/**
 * Captures the current payload signature for stale detection.
 * Call this immediately after a successful publish.
 */
export function snapshotPublishSignature(): string {
	return payloadSignature(_payload);
}

// ---------------------------------------------------------------------------
// AI settings
// ---------------------------------------------------------------------------

const AI_FIELDS = [
	'aiTextProvider',
	'aiTextModel',
	'aiTextApiKey',
	'aiTextBaseUrl',
	'aiImageProvider',
	'aiImageModel',
	'aiImageApiKey',
	'aiImageBaseUrl',
] as const;

export function saveAiSettings(): void {
	const settings: Record<string, string> = {};
	for (const field of AI_FIELDS) {
		const val = _payload[field];
		settings[field] = typeof val === 'string' ? val.trim() : '';
	}
	localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
	setStatus('AI settings saved locally.');
}

export function loadAiSettings(): void {
	try {
		const raw = localStorage.getItem(AI_SETTINGS_KEY);
		if (!raw) return;
		const parsed: unknown = JSON.parse(raw);
		if (!isStringRecord(parsed)) return;

		const updates: Record<string, unknown> = {};
		for (const field of AI_FIELDS) {
			if (field in parsed) {
				updates[field] = parsed[field];
			}
		}
		_payload = { ..._payload, ...updates };
	} catch {
		// ignore
	}
}

// ---------------------------------------------------------------------------
// Draft apply (autofill response)
// ---------------------------------------------------------------------------

export function applyDraft(draft: Record<string, unknown> = {}): void {
	const updates: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(draft)) {
		updates[key] = String(value ?? '');
	}
	_payload = { ..._payload, ...updates };
}

export function applyImageDraft(imageDraft: ImageDraft = {}): void {
	if (imageDraft.combinedPromptText) {
		_payload = { ..._payload, imagePrompts: imageDraft.combinedPromptText };
		return;
	}
	if (Array.isArray(imageDraft.prompts)) {
		const text = imageDraft.prompts
			.map((prompt, index) => `Slide ${index + 1} (${prompt.slideId || 'slide'}) :: ${prompt.prompt || ''}`)
			.join('\n');
		_payload = { ..._payload, imagePrompts: text };
	}
}

// ---------------------------------------------------------------------------
// Handle form mutation (debounced history + dirty tracking)
// ---------------------------------------------------------------------------

export function handleFieldChange(isInput: boolean): void {
	if (_suspendHistory) return;
	if (isInput) {
		queueHistorySnapshot();
	} else {
		pushHistory();
	}
	markDirty();
}
