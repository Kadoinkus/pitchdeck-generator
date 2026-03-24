import { renderSlide } from './slide-renderers.ts';

interface SlideEntry {
	type: string;
	[key: string]: unknown;
}

interface DeckData {
	slides: SlideEntry[];
	theme: Record<string, unknown>;
	[key: string]: unknown;
}

interface ToolbarOptions {
	downloadUrl?: string | null;
	pdfUrl?: string | null;
	shareUrl?: string | null;
}

interface DragState {
	active: boolean;
	startX: number;
	deltaX: number;
	width: number;
	moved: boolean;
}

const viewer = document.getElementById('slide-viewer');
const page = document.querySelector('.page');
const slideCanvas = document.getElementById('slide-canvas');
const slideTrack = document.getElementById('slide-track');
const thumbnailsEl = document.getElementById('thumbnails');
const thumbResize = document.getElementById('thumb-resize');
const slideCounter = document.getElementById('slide-counter');

const downloadPptxBtn = document.getElementById('viewer-download-pptx');
const downloadPdfBtn = document.getElementById('viewer-download-pdf');
const shareBtn = document.getElementById('viewer-share-link');
const copyShareBtn = document.getElementById('viewer-copy-share');
const shareDropdown = document.getElementById('viewer-share-dropdown');
const shareToggleBtn = document.getElementById('viewer-share-toggle');

let currentSlide = 0;
let slideData: DeckData | null = null;
let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
let swipeNavigated = false;

const drag: DragState = {
	active: false,
	startX: 0,
	deltaX: 0,
	width: 0,
	moved: false,
};

function isShareMenuOpen(): boolean {
	return Boolean(shareDropdown?.classList.contains('open'));
}

function closeShareMenu(): void {
	if (!shareDropdown || !shareToggleBtn) return;
	shareDropdown.classList.remove('open');
	shareToggleBtn.setAttribute('aria-expanded', 'false');
}

function toggleShareMenu(): void {
	if (!shareDropdown || !shareToggleBtn) return;
	if (shareToggleBtn instanceof HTMLButtonElement && shareToggleBtn.disabled) {
		return;
	}
	const willOpen = !isShareMenuOpen();
	shareDropdown.classList.toggle('open', willOpen);
	shareToggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

function resetCopyShareLabel(): void {
	if (!copyShareBtn) return;
	copyShareBtn.textContent = 'Copy share link';
}

function setToolbarLinks(options: ToolbarOptions = {}): void {
	const hasDownloadUrl = Boolean(options.downloadUrl);
	const hasPdfUrl = Boolean(options.pdfUrl);
	const hasShareUrl = Boolean(options.shareUrl);
	const hasAnyShareAction = hasDownloadUrl || hasPdfUrl || hasShareUrl;

	if (downloadPptxBtn instanceof HTMLAnchorElement) {
		downloadPptxBtn.href = options.downloadUrl || '#';
	}
	if (downloadPdfBtn instanceof HTMLAnchorElement) {
		downloadPdfBtn.href = options.pdfUrl || '#';
	}
	if (shareBtn instanceof HTMLAnchorElement) {
		shareBtn.href = options.shareUrl || '#';
	}

	downloadPptxBtn?.classList.toggle('disabled', !hasDownloadUrl);
	downloadPdfBtn?.classList.toggle('disabled', !hasPdfUrl);
	shareBtn?.classList.toggle('disabled', !hasShareUrl);

	if (shareToggleBtn) {
		if (shareToggleBtn instanceof HTMLButtonElement) {
			shareToggleBtn.disabled = !hasAnyShareAction;
		}
		shareToggleBtn.classList.toggle('disabled', !hasAnyShareAction);
		if (!hasAnyShareAction) {
			closeShareMenu();
		}
	}

	if (copyShareBtn) {
		if (copyShareBtn instanceof HTMLButtonElement) {
			copyShareBtn.disabled = !hasShareUrl;
		}
		copyShareBtn.classList.toggle('disabled', !hasShareUrl);
		resetCopyShareLabel();
	}
}

function updateTrackPosition({
	animate = true,
	offsetPx = 0,
}: {
	animate?: boolean;
	offsetPx?: number;
} = {}): void {
	if (!slideCanvas || !slideTrack) return;
	const width = slideCanvas.clientWidth || 1;
	const position = -currentSlide * width + offsetPx;
	if (!animate) {
		slideTrack.style.transition = 'none';
	}
	slideTrack.style.transform = `translate3d(${position}px, 0, 0)`;
	if (!animate) {
		requestAnimationFrame(() => {
			if (!drag.active && slideTrack) {
				slideTrack.style.transition = '';
			}
		});
	}
}

function updateSlidePageStates(): void {
	if (!slideTrack) return;
	slideTrack.querySelectorAll('.slide-page').forEach((node, index) => {
		node.classList.toggle('is-active', index === currentSlide);
		node.classList.toggle('is-prev', index === currentSlide - 1);
		node.classList.toggle('is-next', index === currentSlide + 1);
	});
}

const SLIDE_W = 1020;

function scaleAllSlides(): void {
	if (!slideCanvas || !slideTrack || !thumbnailsEl) return;
	const canvasZoom = slideCanvas.clientWidth / SLIDE_W;
	for (const render of slideTrack.querySelectorAll<HTMLElement>('.slide-render')) {
		render.style.zoom = `${canvasZoom}`;
	}
	for (const inner of thumbnailsEl.querySelectorAll<HTMLElement>('.thumb-inner')) {
		const render = inner.querySelector<HTMLElement>('.slide-render');
		if (!render) continue;
		render.style.zoom = `${inner.clientWidth / SLIDE_W}`;
	}
}

function renderSlides(): void {
	const data = slideData;
	if (!slideTrack || !data?.slides?.length) return;
	slideTrack.innerHTML = '';

	data.slides.forEach((slide, index) => {
		const pageNode = document.createElement('section');
		pageNode.className = 'slide-page';
		pageNode.dataset.slideIndex = String(index);
		pageNode.innerHTML = renderSlide(slide, data.theme, data);
		slideTrack.appendChild(pageNode);
	});
}

function renderThumbnails(): void {
	const data = slideData;
	if (!thumbnailsEl || !data) return;
	thumbnailsEl.innerHTML = '';

	data.slides.forEach((slide, index) => {
		const thumb = document.createElement('div');
		thumb.className = `thumb${index === currentSlide ? ' active' : ''}`;
		thumb.innerHTML = `<span class="thumb-number">${index + 1}</span><div class="thumb-inner">${
			renderSlide(slide, data.theme, data)
		}</div>`;
		thumb.addEventListener('click', () => goToSlide(index));
		thumbnailsEl.appendChild(thumb);
	});
}

const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';

export function showViewer(data: DeckData, options: ToolbarOptions = {}): void {
	if (!data?.slides?.length) return;

	slideData = data;
	currentSlide = Math.max(0, Math.min(currentSlide, data.slides.length - 1));

	setToolbarLinks(options);
	renderSlides();
	renderThumbnails();
	goToSlide(currentSlide, { animate: false });

	page?.classList.add('hidden');
	viewer?.classList.remove('hidden');
	sessionStorage.setItem(VIEWER_STATE_KEY, '1');
	requestAnimationFrame(scaleAllSlides);
}

export function updateViewerData(data: DeckData): void {
	if (!data?.slides?.length) return;

	slideData = data;
	currentSlide = Math.max(0, Math.min(currentSlide, data.slides.length - 1));
	renderSlides();
	renderThumbnails();
	goToSlide(currentSlide, { animate: false });
	scaleAllSlides();
}

export function hideViewer(): void {
	closeShareMenu();
	viewer?.classList.add('hidden');
	page?.classList.remove('hidden');
	sessionStorage.removeItem(VIEWER_STATE_KEY);
}

export function wasViewerOpen(): boolean {
	return sessionStorage.getItem(VIEWER_STATE_KEY) === '1';
}

function goToSlide(index: number, options: { animate?: boolean } = {}): void {
	if (!slideData || !slideData.slides?.length) return;

	const maxIndex = slideData.slides.length - 1;
	currentSlide = Math.max(0, Math.min(index, maxIndex));

	if (slideCounter) {
		slideCounter.textContent = `${currentSlide + 1} / ${slideData.slides.length}`;
	}
	updateSlidePageStates();
	updateTrackPosition({ animate: options.animate !== false });

	if (thumbnailsEl) {
		thumbnailsEl.querySelectorAll('.thumb').forEach((thumb, i) => {
			thumb.classList.toggle('active', i === currentSlide);
		});

		const activeThumb = thumbnailsEl.querySelector('.thumb.active');
		if (activeThumb) {
			activeThumb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}
}

function startSwipe(event: PointerEvent): void {
	if (!slideData?.slides?.length || slideData.slides.length < 2) return;
	if (event.button !== undefined && event.button !== 0) return;
	if (
		event.target instanceof HTMLElement
		&& event.target.closest('a,button,input,textarea,select')
	) {
		return;
	}

	drag.active = true;
	drag.startX = event.clientX;
	drag.deltaX = 0;
	drag.width = slideCanvas ? slideCanvas.clientWidth || 1 : 1;
	drag.moved = false;
	slideCanvas?.classList.add('is-dragging');
	document.addEventListener('pointermove', moveSwipe);
	document.addEventListener('pointerup', endSwipe);
	document.addEventListener('pointercancel', endSwipe);
}

function moveSwipe(event: PointerEvent): void {
	if (!drag.active) return;
	drag.deltaX = event.clientX - drag.startX;
	if (Math.abs(drag.deltaX) > 6) drag.moved = true;

	const maxIndex = (slideData?.slides?.length || 1) - 1;
	let offset = drag.deltaX;
	if (
		(currentSlide === 0 && drag.deltaX > 0)
		|| (currentSlide === maxIndex && drag.deltaX < 0)
	) {
		offset *= 0.35;
	}

	updateTrackPosition({ animate: false, offsetPx: offset });
}

function endSwipe(_event: PointerEvent): void {
	if (!drag.active) return;
	drag.active = false;
	slideCanvas?.classList.remove('is-dragging');
	document.removeEventListener('pointermove', moveSwipe);
	document.removeEventListener('pointerup', endSwipe);
	document.removeEventListener('pointercancel', endSwipe);

	const threshold = Math.min(140, (drag.width || 1) * 0.16);
	const delta = drag.deltaX;

	if (drag.moved && Math.abs(delta) > threshold) {
		swipeNavigated = true;
		if (delta < 0) goToSlide(currentSlide + 1);
		else goToSlide(currentSlide - 1);
		return;
	}

	goToSlide(currentSlide);
}

slideCanvas?.addEventListener('pointerdown', startSwipe);

slideCanvas?.addEventListener('click', (event: MouseEvent) => {
	if (swipeNavigated) {
		swipeNavigated = false;
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	if (!(event.target instanceof HTMLElement)) return;
	const target = event.target.closest('[data-ai-target]');
	if (!target) return;

	const detail = {
		target: target.getAttribute('data-ai-target'),
		label: target.getAttribute('data-ai-label')
			|| target.getAttribute('data-ai-target'),
	};

	window.dispatchEvent(new CustomEvent('deck:select-target', { detail }));
});

window.addEventListener('resize', () => {
	if (viewer?.classList.contains('hidden')) return;
	updateTrackPosition({ animate: false });
	scaleAllSlides();
});

document
	.getElementById('back-to-editor')
	?.addEventListener('click', hideViewer);

document.getElementById('prev-slide')?.addEventListener('click', () => {
	goToSlide(currentSlide - 1);
});

document.getElementById('next-slide')?.addEventListener('click', () => {
	goToSlide(currentSlide + 1);
});

shareToggleBtn?.addEventListener('click', (event: MouseEvent) => {
	event.preventDefault();
	toggleShareMenu();
});

copyShareBtn?.addEventListener('click', async () => {
	if (
		!(shareBtn instanceof HTMLAnchorElement)
		|| !shareBtn.href
		|| shareBtn.href.endsWith('#')
	) {
		return;
	}
	if (copyShareBtn instanceof HTMLButtonElement && copyShareBtn.disabled) {
		return;
	}

	try {
		await navigator.clipboard.writeText(shareBtn.href);
		copyShareBtn.textContent = 'Link copied';
		if (copyFeedbackTimer !== null) clearTimeout(copyFeedbackTimer);
		copyFeedbackTimer = setTimeout(() => {
			resetCopyShareLabel();
		}, 1400);
		closeShareMenu();
	} catch {
		copyShareBtn.textContent = 'Copy failed';
		if (copyFeedbackTimer !== null) clearTimeout(copyFeedbackTimer);
		copyFeedbackTimer = setTimeout(() => {
			resetCopyShareLabel();
		}, 1400);
	}
});

[downloadPptxBtn, downloadPdfBtn, shareBtn].forEach((item) => {
	item?.addEventListener('click', () => {
		closeShareMenu();
	});
});

document.addEventListener('click', (event: MouseEvent) => {
	if (!isShareMenuOpen()) return;
	if (event.target instanceof Node && shareDropdown?.contains(event.target)) {
		return;
	}
	closeShareMenu();
});

thumbResize?.addEventListener('pointerdown', (event: PointerEvent) => {
	event.preventDefault();
	thumbResize.classList.add('is-dragging');
	thumbResize.setPointerCapture(event.pointerId);

	const onMove = (e: PointerEvent) => {
		const x = Math.max(100, Math.min(e.clientX, 400));
		viewer?.style.setProperty('--thumb-w', `${x}px`);
		scaleAllSlides();
	};

	const onUp = () => {
		thumbResize.classList.remove('is-dragging');
		thumbResize.removeEventListener('pointermove', onMove);
		thumbResize.removeEventListener('pointerup', onUp);
	};

	thumbResize.addEventListener('pointermove', onMove);
	thumbResize.addEventListener('pointerup', onUp);
});

document.addEventListener('keydown', (event: KeyboardEvent) => {
	if (viewer?.classList.contains('hidden') || !slideData) return;
	if (event.key === 'ArrowLeft') goToSlide(currentSlide - 1);
	if (event.key === 'ArrowRight') goToSlide(currentSlide + 1);
	if (event.key === 'Escape') {
		if (isShareMenuOpen()) {
			closeShareMenu();
			return;
		}
		hideViewer();
	}
});
