import { showViewer, updateViewerData } from './js/viewer.js';
import { DEFAULT_THEME_COLORS, resolveThemePalette, normalizeHexColor } from './js/color-palette.js';

const AI_SETTINGS_KEY = 'proposalDeckAiSettingsV3';
const DRAFT_STORAGE_KEY = 'proposalDeckDraftV4';
const HISTORY_LIMIT = 80;

const form = document.getElementById('deck-form');
const templateSelect = document.getElementById('templateId');
const slideSelector = document.getElementById('slide-selector');
const includeAllSlidesButton = document.getElementById('include-all-slides');
const includeCoreSlidesButton = document.getElementById('include-core-slides');
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
const autoFillButton = document.getElementById('ai-autofill');
const generateButton = document.getElementById('generate-button');
const statusEl = document.getElementById('status');

const saveAiSettingsButton = document.getElementById('save-ai-settings');
const characterAssetsInput = document.getElementById('character-assets-input');
const characterAssetsPreview = document.getElementById('character-assets-preview');
const characterAssetsStatus = document.getElementById('character-assets-status');
const clearCharacterAssetsButton = document.getElementById('clear-character-assets');

const outputStatus = document.getElementById('output-status');
const openViewerLink = document.getElementById('open-viewer-link');
const downloadPptxLink = document.getElementById('download-pptx-link');
const downloadPdfLink = document.getElementById('download-pdf-link');
const openShareLink = document.getElementById('open-share-link');
const copyShareLinkButton = document.getElementById('copy-share-link');
const projectNameDisplay = document.getElementById('project-name-display');
const projectContextDisplay = document.getElementById('project-context-display');
const saveIndicator = document.getElementById('save-indicator');
const undoChangeButton = document.getElementById('undo-change');
const redoChangeButton = document.getElementById('redo-change');
const slideViewerEl = document.getElementById('slide-viewer');

const chatLauncher = document.getElementById('viewer-chat-launcher');
const chatPanel = document.getElementById('viewer-chat-panel');
const chatClose = document.getElementById('viewer-chat-close');
const chatTargetEl = document.getElementById('viewer-chat-target');
const chatMessagesEl = document.getElementById('viewer-chat-messages');
const chatSuggestionsEl = document.getElementById('viewer-chat-suggestions');
const chatInputEl = document.getElementById('viewer-chat-input');
const chatSendButton = document.getElementById('viewer-chat-send');

const templateMap = new Map();
let currentDeckResult = null;
let chatTarget = { field: 'global-concept', label: 'Global concept' };
let chatHistory = [];
let characterAssets = [];
let historyStack = [];
let historyIndex = -1;
let suspendHistory = false;
let autosaveTimer = null;
let historyInputTimer = null;
let lastSavedSignature = '';

const CHARACTER_PLACEMENTS = [
  { value: 'all-mascot', label: 'All mascot slides' },
  { value: 'cover', label: 'Cover' },
  { value: 'meet-buddy', label: 'Meet the buddy' },
  { value: 'example-interaction', label: 'Example interaction' },
  { value: 'closing', label: 'Closing' },
  { value: 'all', label: 'All slides' }
];

const brandColorControls = {
  primaryColor: primaryColorInput,
  accentColor: accentColorInput,
  secondaryColor: secondaryColorInput,
  backgroundColor: backgroundColorInput,
  textColor: textColorInput
};

function syncLayoutPresetLockUi() {
  if (!layoutPresetSelect || !layoutPresetLock) return;
  layoutPresetSelect.disabled = false;
  layoutPresetSelect.classList.toggle('is-locked', layoutPresetLock.checked);
}

function setPaletteStatus(message, tone = '') {
  if (!paletteStatusEl) return;
  paletteStatusEl.textContent = message;
  paletteStatusEl.classList.remove('warning', 'error');
  if (tone) paletteStatusEl.classList.add(tone);
}

function readManualPaletteColors() {
  return {
    primaryColor: normalizeHexColor(brandColorControls.primaryColor?.value, DEFAULT_THEME_COLORS.primaryColor),
    accentColor: normalizeHexColor(brandColorControls.accentColor?.value, DEFAULT_THEME_COLORS.accentColor),
    secondaryColor: normalizeHexColor(brandColorControls.secondaryColor?.value, DEFAULT_THEME_COLORS.secondaryColor),
    backgroundColor: normalizeHexColor(brandColorControls.backgroundColor?.value, DEFAULT_THEME_COLORS.backgroundColor),
    textColor: normalizeHexColor(brandColorControls.textColor?.value, DEFAULT_THEME_COLORS.textColor)
  };
}

function getShuffleSeed() {
  return Math.max(0, Math.floor(Number.parseInt(paletteShuffleSeedInput?.value || '0', 10) || 0));
}

function syncBrandPaletteUi() {
  if (!primaryColorInput || !harmonyModeSelect || !paletteShuffleSeedInput) return;

  const manualColors = readManualPaletteColors();
  const palette = resolveThemePalette({
    primaryColor: manualColors.primaryColor,
    harmonyMode: harmonyModeSelect.value || 'complementary',
    shuffleSeed: getShuffleSeed(),
    locks: {
      accentColor: Boolean(lockAccentColorInput?.checked),
      secondaryColor: Boolean(lockSecondaryColorInput?.checked)
    },
    manualColors
  });

  primaryColorInput.value = palette.theme.primaryColor;
  accentColorInput.value = palette.theme.accentColor;
  secondaryColorInput.value = palette.theme.secondaryColor;
  backgroundColorInput.value = palette.theme.backgroundColor;
  textColorInput.value = palette.theme.textColor;
  harmonyModeSelect.value = palette.harmonyMode;
  paletteShuffleSeedInput.value = String(palette.shuffleSeed);
  if (accentColorInput) accentColorInput.disabled = !palette.locks.accentColor;
  if (secondaryColorInput) secondaryColorInput.disabled = !palette.locks.secondaryColor;

  const adjustedKeys = new Set(palette.adjustments.map((entry) => entry.key));

  Object.entries(brandColorControls).forEach(([key, input]) => {
    if (!input) return;
    input.classList.toggle('is-color-warning', adjustedKeys.has(key));
  });

  if (palette.adjustments.length) {
    setPaletteStatus(
      `${palette.harmonyMode} harmony · variant ${palette.variantIndex + 1}/${palette.variantCount}. Corrected ${palette.adjustments.length} color${palette.adjustments.length === 1 ? '' : 's'} for readability.`,
      'warning'
    );
    return;
  }

  setPaletteStatus(`${palette.harmonyMode} harmony · variant ${palette.variantIndex + 1}/${palette.variantCount}.`);
}

function bindBrandPaletteControls() {
  if (!primaryColorInput || !harmonyModeSelect || !paletteShuffleSeedInput) return;

  const controls = [
    primaryColorInput,
    accentColorInput,
    secondaryColorInput,
    backgroundColorInput,
    textColorInput,
    harmonyModeSelect,
    lockAccentColorInput,
    lockSecondaryColorInput
  ].filter(Boolean);

  controls.forEach((control) => {
    control.addEventListener('change', () => {
      syncBrandPaletteUi();
    });
  });

  primaryColorInput.addEventListener('input', () => {
    syncBrandPaletteUi();
  });

  shuffleHarmonyButton?.addEventListener('click', () => {
    paletteShuffleSeedInput.value = String(getShuffleSeed() + 1);
    syncBrandPaletteUi();
    pushHistorySnapshot();
    markEditorDirty();
  });
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function clonePayload(payload = {}) {
  return JSON.parse(JSON.stringify(payload));
}

function payloadSignature(payload = {}) {
  const normalized = {
    ...payload,
    excludedSlides: Array.isArray(payload.excludedSlides) ? [...payload.excludedSlides].sort() : []
  };
  const ordered = {};
  Object.keys(normalized)
    .sort()
    .forEach((key) => {
      ordered[key] = normalized[key];
    });
  return JSON.stringify(ordered);
}

function setSaveIndicator(state = 'is-saved', text = '') {
  if (!saveIndicator) return;
  const labelByState = {
    'is-saved': 'All changes saved',
    'is-dirty': 'Unsaved changes',
    'is-saving': 'Saving...',
    'is-error': 'Save failed'
  };

  saveIndicator.classList.remove('is-saved', 'is-dirty', 'is-saving', 'is-error');
  saveIndicator.classList.add(state);
  saveIndicator.textContent = text || labelByState[state] || labelByState['is-saved'];
}

function updateProjectChrome() {
  const clientName = form.querySelector('[name="clientName"]')?.value.trim();
  const clientUrl = form.querySelector('[name="clientUrl"]')?.value.trim();
  const projectTitle = form.querySelector('[name="projectTitle"]')?.value.trim();
  const deckVersion = form.querySelector('[name="deckVersion"]')?.value.trim();
  const templateLabel = templateMap.get(templateSelect?.value)?.label || 'Pitch Deck Proposal';

  if (projectNameDisplay) {
    projectNameDisplay.textContent = projectTitle || (clientName ? `${clientName} proposal` : 'Untitled design');
  }

  if (projectContextDisplay) {
    const context = [clientName || 'No client', templateLabel, deckVersion || 'v1.0']
      .filter(Boolean)
      .join(' • ');
    projectContextDisplay.textContent = clientUrl ? `${context} • ${clientUrl}` : context;
  }
}

function syncHistoryButtons() {
  if (undoChangeButton) undoChangeButton.disabled = historyIndex <= 0;
  if (redoChangeButton) redoChangeButton.disabled = historyIndex >= historyStack.length - 1;
}

function applyPayloadToForm(payload = {}) {
  suspendHistory = true;

  const nextTemplateId = payload.templateId;
  if (nextTemplateId && templateMap.has(nextTemplateId) && templateSelect.value !== nextTemplateId) {
    templateSelect.value = nextTemplateId;
    renderSlideSelector(templateMap.get(nextTemplateId), false);
  }

  const fields = form.querySelectorAll('input[name], textarea[name], select[name]');
  fields.forEach((field) => {
    if (!(field.name in payload)) return;
    if (field.name === 'templateId') return;

    if (field.type === 'checkbox') {
      field.checked = Boolean(payload[field.name]);
      return;
    }

    field.value = String(payload[field.name] ?? '');
  });

  const excluded = new Set(Array.isArray(payload.excludedSlides) ? payload.excludedSlides : []);
  slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
    checkbox.checked = !excluded.has(checkbox.dataset.slideId);
  });

  characterAssets = parseCharacterAssetsFromField();
  renderCharacterAssetsPreview();
  syncLayoutPresetLockUi();
  syncBrandPaletteUi();
  updateProjectChrome();
  suspendHistory = false;
}

function pushHistorySnapshot() {
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
    at: Date.now()
  });

  if (historyStack.length > HISTORY_LIMIT) {
    const overflow = historyStack.length - HISTORY_LIMIT;
    historyStack.splice(0, overflow);
  }

  historyIndex = historyStack.length - 1;
  syncHistoryButtons();
}

function autosaveNow({ quiet = false } = {}) {
  clearTimeout(autosaveTimer);
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
        payload
      })
    );

    lastSavedSignature = signature;
    setSaveIndicator('is-saved');
  } catch (error) {
    console.error(error);
    setSaveIndicator('is-error');
  }
}

function scheduleAutosave() {
  if (suspendHistory) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveNow();
  }, 700);
}

function loadDraftFromLocalStorage() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    const payload = parsed?.payload && typeof parsed.payload === 'object' ? parsed.payload : parsed;
    if (!payload || typeof payload !== 'object') return false;

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

async function applyHistoryIndex(nextIndex) {
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

  if (currentDeckResult?.slideData && slideViewerEl && !slideViewerEl.classList.contains('hidden')) {
    try {
      await refreshViewerFromPayload();
    } catch (error) {
      console.error(error);
    }
  }
}

async function undoChange() {
  if (historyIndex <= 0) return;
  await applyHistoryIndex(historyIndex - 1);
}

async function redoChange() {
  if (historyIndex >= historyStack.length - 1) return;
  await applyHistoryIndex(historyIndex + 1);
}

function markEditorDirty() {
  const signature = payloadSignature(readFormPayload());
  if (signature === lastSavedSignature) {
    clearTimeout(autosaveTimer);
    setSaveIndicator('is-saved');
    return;
  }

  setSaveIndicator('is-dirty');
  scheduleAutosave();
}

function queueInputHistorySnapshot() {
  clearTimeout(historyInputTimer);
  historyInputTimer = setTimeout(() => {
    pushHistorySnapshot();
  }, 160);
}

function handleFormMutation(event) {
  if (suspendHistory) return;
  const target = event.target;
  if (!target) return;

  const hasFieldName = typeof target.name === 'string' && target.name.length > 0;
  const isSlideToggle = Boolean(target.dataset?.slideId);
  if (!hasFieldName && !isSlideToggle) return;

  updateProjectChrome();

  if (event.type === 'input') {
    queueInputHistorySnapshot();
  } else {
    pushHistorySnapshot();
  }

  markEditorDirty();
}

function handleHistoryHotkeys(event) {
  if (!event.metaKey && !event.ctrlKey) return;
  if (slideViewerEl && !slideViewerEl.classList.contains('hidden')) return;

  const target = event.target;
  const tag = target?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

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

function setLinkState(el, url) {
  if (!el) return;

  if (url) {
    el.classList.remove('disabled');
    el.setAttribute('href', url);
  } else {
    el.classList.add('disabled');
    el.setAttribute('href', '#');
  }
}

function setOutputState(state = {}) {
  currentDeckResult = state;

  if (!state?.downloadUrl) {
    outputStatus.textContent = 'Generate a deck to unlock links and exports.';
    setLinkState(openViewerLink, null);
    setLinkState(downloadPptxLink, null);
    setLinkState(downloadPdfLink, null);
    setLinkState(openShareLink, null);
    copyShareLinkButton.disabled = true;
    return;
  }

  outputStatus.textContent = 'Deck ready. Open viewer, export files, or share web link.';
  setLinkState(openViewerLink, '#viewer');
  setLinkState(downloadPptxLink, state.downloadUrl);
  setLinkState(downloadPdfLink, state.pdfUrl);
  setLinkState(openShareLink, state.shareUrl);
  copyShareLinkButton.disabled = !state.shareUrl;
}


function collectSlideExclusions() {
  const excluded = [];

  slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
    if (!checkbox.checked) excluded.push(checkbox.dataset.slideId);
  });

  return excluded;
}

function readFormPayload() {
  const payload = {};
  const fields = form.querySelectorAll('input[name], textarea[name], select[name]');

  fields.forEach((field) => {
    if (field.disabled) return;

    if (field.type === 'checkbox') {
      payload[field.name] = field.checked;
      return;
    }

    payload[field.name] = field.value.trim();
  });

  payload.excludedSlides = collectSlideExclusions();

  return payload;
}

function writeField(fieldName, value) {
  const field = form.querySelector(`[name="${fieldName}"]`);
  if (!field) return false;
  field.value = String(value ?? '');
  return true;
}

function applyDraftToForm(draft = {}) {
  Object.entries(draft).forEach(([fieldName, value]) => {
    writeField(fieldName, value);
  });
}

function applyImageDraft(imageDraft = {}) {
  const field = form.querySelector('[name="imagePrompts"]');
  if (!field) return;

  if (imageDraft.combinedPromptText) {
    field.value = imageDraft.combinedPromptText;
    return;
  }

  if (Array.isArray(imageDraft.prompts)) {
    field.value = imageDraft.prompts
      .map((prompt, index) => `Slide ${index + 1} (${prompt.slideId || 'slide'}) :: ${prompt.prompt || ''}`)
      .join('\n');
  }
}

function parseCharacterAssetsFromField() {
  const field = form.querySelector('[name="characterAssets"]');
  if (!field || !field.value.trim()) return [];

  try {
    const parsed = JSON.parse(field.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.dataUrl).slice(0, 10);
  } catch {
    return [];
  }
}

function syncCharacterAssetsField() {
  const field = form.querySelector('[name="characterAssets"]');
  if (!field) return;
  field.value = JSON.stringify(characterAssets);
}

function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderCharacterAssetsPreview() {
  if (!characterAssetsPreview || !characterAssetsStatus) return;

  characterAssetsPreview.innerHTML = '';

  if (!characterAssets.length) {
    characterAssetsStatus.textContent = 'No character assets uploaded.';
    return;
  }

  characterAssetsStatus.textContent = `${characterAssets.length} character asset${characterAssets.length > 1 ? 's' : ''} ready.`;

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
      characterAssets[index] = { ...characterAssets[index], placement: placement.value };
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function handleCharacterAssetsUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const maxPerFileBytes = 1.5 * 1024 * 1024;
  const maxAssets = 8;
  const room = Math.max(0, maxAssets - characterAssets.length);

  if (!room) {
    setStatus('Character asset limit reached (8). Remove one to add another.', true);
    event.target.value = '';
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
        placement: 'all-mascot'
      });
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Could not upload one of the images.', true);
    }
  }

  syncCharacterAssetsField();
  renderCharacterAssetsPreview();
  event.target.value = '';
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

async function clearCharacterAssets() {
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

function renderSlideSelector(template, keepSelection = true) {
  if (!template) return;

  const existing = new Map();
  if (keepSelection) {
    slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
      existing.set(checkbox.dataset.slideId, checkbox.checked);
    });
  }

  slideSelector.innerHTML = '';

  template.slides.forEach((slide) => {
    const chip = document.createElement('label');
    chip.className = 'slide-chip';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.slideId = slide.id;
    checkbox.checked = existing.has(slide.id) ? existing.get(slide.id) : Boolean(slide.defaultIncluded);

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

async function hydrateTemplates() {
  const response = await fetch('/api/templates');
  const result = await response.json();

  if (!response.ok || !result.success || !Array.isArray(result.templates)) {
    throw new Error('Could not load templates.');
  }

  templateSelect.innerHTML = '';

  result.templates.forEach((template) => {
    templateMap.set(template.id, template);

    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.label;
    option.title = template.description;
    templateSelect.appendChild(option);
  });

  if (!templateSelect.value && result.templates.length) {
    templateSelect.value = result.templates[0].id;
  }

  renderSlideSelector(templateMap.get(templateSelect.value), false);
}

async function hydrateAiProviders() {
  const response = await fetch('/api/ai/providers');
  const result = await response.json();

  if (!response.ok || !result.success || !result.providers) return;

  const textProviderSelect = document.getElementById('aiTextProvider');
  const imageProviderSelect = document.getElementById('aiImageProvider');

  textProviderSelect.innerHTML = '';
  imageProviderSelect.innerHTML = '';

  (result.providers.textProviders || []).forEach((provider) => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.label;
    textProviderSelect.appendChild(option);
  });

  (result.providers.imageProviders || []).forEach((provider) => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.label;
    imageProviderSelect.appendChild(option);
  });
}

function readAiSettings() {
  try {
    return JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function applyAiSettings(settings = {}) {
  [
    'aiTextProvider',
    'aiTextModel',
    'aiTextApiKey',
    'aiTextBaseUrl',
    'aiImageProvider',
    'aiImageModel',
    'aiImageApiKey',
    'aiImageBaseUrl'
  ].forEach((fieldName) => {
    const field = document.getElementById(fieldName);
    if (!field || !(fieldName in settings)) return;
    field.value = settings[fieldName];
  });
}

function saveAiSettings() {
  const settings = {};

  [
    'aiTextProvider',
    'aiTextModel',
    'aiTextApiKey',
    'aiTextBaseUrl',
    'aiImageProvider',
    'aiImageModel',
    'aiImageApiKey',
    'aiImageBaseUrl'
  ].forEach((fieldName) => {
    const field = document.getElementById(fieldName);
    if (!field) return;
    settings[fieldName] = field.value.trim();
  });

  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  setStatus('AI settings saved locally.');
}

function addChatMessage(role, text) {
  const item = document.createElement('div');
  item.className = `chat-message ${role}`;
  item.textContent = text;
  chatMessagesEl.appendChild(item);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function setChatTarget(field, label) {
  chatTarget = {
    field: field || 'global-concept',
    label: label || 'Global concept'
  };
  chatTargetEl.textContent = chatTarget.label;
}

function openChatPanel() {
  chatPanel.classList.remove('hidden');
  chatLauncher.classList.add('hidden');
}

function closeChatPanel() {
  chatPanel.classList.add('hidden');
  chatLauncher.classList.remove('hidden');
}

function renderChatSuggestions(suggestions = []) {
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

async function refreshViewerFromPayload() {
  const payload = readFormPayload();
  const response = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Could not refresh viewer.');
  }

  if (currentDeckResult) {
    currentDeckResult.slideData = result.slideData;
  }
  updateViewerData(result.slideData);
}

async function runAutofill() {
  autoFillButton.disabled = true;
  setStatus('AI is generating all slide text and image prompts...');

  try {
    const payload = readFormPayload();

    const response = await fetch('/api/ai/autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
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
    setStatus(error.message || 'Could not run AI autofill.', true);
  } finally {
    autoFillButton.disabled = false;
  }
}

async function generateDeck(event) {
  event.preventDefault();
  generateButton.disabled = true;
  setStatus('Generating pitch deck...');

  try {
    const payload = readFormPayload();
    const totalSlides = slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').length;
    if (payload.excludedSlides.length >= totalSlides) {
      throw new Error('Include at least one slide before generating.');
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Could not generate deck.');
    }

    const shareUrlAbsolute = result.shareUrl ? new URL(result.shareUrl, window.location.origin).toString() : null;
    const pdfUrlAbsolute = result.pdfUrl ? new URL(result.pdfUrl, window.location.origin).toString() : null;
    const downloadUrlAbsolute = result.downloadUrl ? new URL(result.downloadUrl, window.location.origin).toString() : null;

    setOutputState({
      slideData: result.slideData,
      downloadUrl: downloadUrlAbsolute,
      pdfUrl: pdfUrlAbsolute,
      shareUrl: shareUrlAbsolute
    });

    showViewer(result.slideData, {
      downloadUrl: downloadUrlAbsolute,
      pdfUrl: pdfUrlAbsolute,
      shareUrl: shareUrlAbsolute
    });

    setStatus('Deck generated successfully.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Could not generate deck.', true);
  } finally {
    generateButton.disabled = false;
  }
}

async function runViewerChat() {
  const message = chatInputEl.value.trim();
  if (!message) return;

  chatSendButton.disabled = true;
  addChatMessage('user', message);
  chatInputEl.value = '';

  try {
    const payload = readFormPayload();

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        targetField: chatTarget.field,
        message,
        history: chatHistory.slice(-10)
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'AI chat failed.');
    }

    addChatMessage('assistant', result.reply || 'Suggestions ready.');
    renderChatSuggestions(result.suggestedChanges || []);

    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: result.reply || 'Suggestions ready.' });

    setStatus(`Copilot suggestion ready (${result.provider || 'local'}).`);
  } catch (error) {
    console.error(error);
    addChatMessage('assistant', `Error: ${error.message || 'Could not process request.'}`);
    setStatus(error.message || 'Could not run viewer copilot.', true);
  } finally {
    chatSendButton.disabled = false;
  }
}

templateSelect.addEventListener('change', () => {
  renderSlideSelector(templateMap.get(templateSelect.value), false);
  updateProjectChrome();
  pushHistorySnapshot();
  markEditorDirty();
  setStatus(`Template selected: ${templateMap.get(templateSelect.value)?.label || templateSelect.value}`);
});

includeAllSlidesButton.addEventListener('click', () => {
  slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
    checkbox.checked = true;
  });
  pushHistorySnapshot();
  markEditorDirty();
  setStatus('All slides included.');
});

includeCoreSlidesButton.addEventListener('click', () => {
  const template = templateMap.get(templateSelect.value);
  if (!template) return;

  const required = new Set(template.slides.filter((slide) => slide.required).map((slide) => slide.id));

  slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
    checkbox.checked = required.has(checkbox.dataset.slideId);
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

openViewerLink.addEventListener('click', (event) => {
  if (!currentDeckResult?.slideData) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  showViewer(currentDeckResult.slideData, {
    downloadUrl: currentDeckResult.downloadUrl,
    pdfUrl: currentDeckResult.pdfUrl,
    shareUrl: currentDeckResult.shareUrl
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
chatInputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    runViewerChat();
  }
});

window.addEventListener('deck:select-target', (event) => {
  const field = event.detail?.target || 'global-concept';
  const label = event.detail?.label || field;
  setChatTarget(field, label);
  openChatPanel();

  if (!chatMessagesEl.childElementCount) {
    addChatMessage('assistant', `Selected "${label}". Ask me to rewrite it and apply changes.`);
  }
});

document.getElementById('back-to-editor').addEventListener('click', () => {
  closeChatPanel();
});

(async function bootstrap() {
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

    pushHistorySnapshot();
    autosaveNow({ quiet: true });
    syncHistoryButtons();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Could not initialize editor.', true);
    setSaveIndicator('is-error');
  }
})();
