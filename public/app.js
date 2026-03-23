import { showViewer, updateViewerData } from './js/viewer.js';

const AI_SETTINGS_KEY = 'proposalDeckAiSettingsV3';

const form = document.getElementById('deck-form');
const templateSelect = document.getElementById('templateId');
const slideSelector = document.getElementById('slide-selector');
const includeAllSlidesButton = document.getElementById('include-all-slides');
const includeCoreSlidesButton = document.getElementById('include-core-slides');
const layoutPresetSelect = document.getElementById('layoutPreset');
const layoutPresetLock = document.getElementById('layoutPresetLock');
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

const CHARACTER_PLACEMENTS = [
  { value: 'all-mascot', label: 'All mascot slides' },
  { value: 'cover', label: 'Cover' },
  { value: 'meet-buddy', label: 'Meet the buddy' },
  { value: 'example-interaction', label: 'Example interaction' },
  { value: 'closing', label: 'Closing' },
  { value: 'all', label: 'All slides' }
];

function syncLayoutPresetLockUi() {
  if (!layoutPresetSelect || !layoutPresetLock) return;
  layoutPresetSelect.disabled = false;
  layoutPresetSelect.classList.toggle('is-locked', layoutPresetLock.checked);
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
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
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'ghost small';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      characterAssets.splice(index, 1);
      syncCharacterAssetsField();
      renderCharacterAssetsPreview();
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

    setOutputState({
      slideData: result.slideData,
      downloadUrl: result.downloadUrl,
      pdfUrl: pdfUrlAbsolute,
      shareUrl: shareUrlAbsolute
    });

    showViewer(result.slideData, {
      downloadUrl: result.downloadUrl,
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
  setStatus(`Template selected: ${templateMap.get(templateSelect.value)?.label || templateSelect.value}`);
});

includeAllSlidesButton.addEventListener('click', () => {
  slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
    checkbox.checked = true;
  });
  setStatus('All slides included.');
});

includeCoreSlidesButton.addEventListener('click', () => {
  const template = templateMap.get(templateSelect.value);
  if (!template) return;

  const required = new Set(template.slides.filter((slide) => slide.required).map((slide) => slide.id));

  slideSelector.querySelectorAll('input[type="checkbox"][data-slide-id]').forEach((checkbox) => {
    checkbox.checked = required.has(checkbox.dataset.slideId);
  });

  setStatus('Core slides selected.');
});

layoutPresetLock?.addEventListener('change', () => {
  syncLayoutPresetLockUi();
});

autoFillButton.addEventListener('click', runAutofill);
form.addEventListener('submit', generateDeck);
saveAiSettingsButton.addEventListener('click', saveAiSettings);
characterAssetsInput?.addEventListener('change', handleCharacterAssetsUpload);
clearCharacterAssetsButton?.addEventListener('click', clearCharacterAssets);

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

  try {
    characterAssets = parseCharacterAssetsFromField();
    renderCharacterAssetsPreview();
    syncCharacterAssetsField();
    syncLayoutPresetLockUi();
    await hydrateTemplates();
    await hydrateAiProviders();
    applyAiSettings(readAiSettings());
    setChatTarget('global-concept', 'Global concept');
    await runAutofill();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Could not initialize editor.', true);
  }
})();
