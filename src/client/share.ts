import './styles/slides.css';
import './styles/share.css';
import { renderSlide } from './slide-renderers.ts';

interface SlideEntry {
	type: string;
	[key: string]: unknown;
}

interface DeckData {
	slides: SlideEntry[];
	theme: Record<string, unknown>;
	project?: {
		projectTitle?: string;
		clientName?: string;
	};
	[key: string]: unknown;
}

interface ShareApiResponse {
	success: boolean;
	message?: string;
	slideData?: DeckData;
	downloadUrl?: string;
}

interface DragState {
	active: boolean;
	startX: number;
	deltaX: number;
	width: number;
	moved: boolean;
}

const deckEl = document.getElementById('share-deck');
const trackEl = document.getElementById('share-track');
const template = document.getElementById('share-slide-template');
const titleEl = document.getElementById('share-title');
const subtitleEl = document.getElementById('share-subtitle');
const counterEl = document.getElementById('share-counter');
const pptxLink = document.getElementById('share-download-pptx');
const printButton = document.getElementById('share-print');
const prevButton = document.getElementById('share-prev');
const nextButton = document.getElementById('share-next');

let slideData: DeckData | null = null;
let currentSlide = 0;
let isPrintMode = false;

const drag: DragState = {
	active: false,
	startX: 0,
	deltaX: 0,
	width: 0,
	moved: false,
};

function getTokenFromPath(): string {
	const parts = window.location.pathname.split('/').filter(Boolean);
	return parts[1] || '';
}

function updateTrackPosition({
	animate = true,
	offsetPx = 0,
}: {
	animate?: boolean;
	offsetPx?: number;
} = {}): void {
	if (!trackEl || !deckEl) return;
	const width = deckEl.clientWidth || 1;
	const x = -currentSlide * width + offsetPx;
	if (!animate) {
		trackEl.style.transition = 'none';
	}
	trackEl.style.transform = `translate3d(${x}px, 0, 0)`;
	if (!animate) {
		requestAnimationFrame(() => {
			if (!drag.active && trackEl) trackEl.style.transition = '';
		});
	}
}

function updateUi(): void {
	if (!slideData) return;
	const total = slideData.slides.length;
	if (counterEl) counterEl.textContent = `${currentSlide + 1} / ${total}`;
	if (prevButton instanceof HTMLButtonElement) {
		prevButton.disabled = currentSlide <= 0;
	}
	if (nextButton instanceof HTMLButtonElement) {
		nextButton.disabled = currentSlide >= total - 1;
	}

	if (trackEl) {
		trackEl.querySelectorAll('.share-slide').forEach((node, index) => {
			node.classList.toggle('is-active', index === currentSlide);
		});
	}
}

function goToSlide(index: number, options: { animate?: boolean } = {}): void {
	if (!slideData?.slides?.length) return;
	const maxIndex = slideData.slides.length - 1;
	currentSlide = Math.max(0, Math.min(index, maxIndex));
	updateUi();
	updateTrackPosition({ animate: options.animate !== false });
}

const SLIDE_W = 1020;

function scaleShareSlides(): void {
	if (!trackEl) return;
	const frames = trackEl.querySelectorAll<HTMLElement>('.share-slide-frame');
	for (const frame of frames) {
		const render = frame.querySelector<HTMLElement>('.slide-render');
		if (!render) continue;
		const scale = frame.clientWidth / SLIDE_W;
		render.style.transform = `scale(${scale})`;
	}
}

function renderDeck(data: DeckData): void {
	if (!trackEl) return;
	trackEl.innerHTML = '';

	if (!(template instanceof HTMLTemplateElement)) return;

	data.slides.forEach((slide, index) => {
		const firstChild = template.content.firstElementChild;
		if (!firstChild) return;
		const node = firstChild.cloneNode(true);
		if (!(node instanceof HTMLElement)) return;
		const frame = node.querySelector('.share-slide-frame');
		if (!frame) return;
		frame.innerHTML = renderSlide(slide, data.theme, data);
		frame.setAttribute('aria-label', `Slide ${index + 1}`);
		trackEl.appendChild(node);
	});

	scaleShareSlides();
}

function startSwipe(event: PointerEvent): void {
	if (!slideData?.slides?.length || slideData.slides.length < 2 || isPrintMode) {
		return;
	}
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
	drag.width = deckEl ? deckEl.clientWidth || 1 : 1;
	drag.moved = false;
	deckEl?.classList.add('is-dragging');
	document.addEventListener('pointermove', moveSwipe);
	document.addEventListener('pointerup', endSwipe);
	document.addEventListener('pointercancel', endSwipe);
}

function moveSwipe(event: PointerEvent): void {
	if (!drag.active || !slideData) return;
	drag.deltaX = event.clientX - drag.startX;
	if (Math.abs(drag.deltaX) > 6) drag.moved = true;

	const maxIndex = slideData.slides.length - 1;
	let offset = drag.deltaX;
	if (
		(currentSlide === 0 && offset > 0)
		|| (currentSlide === maxIndex && offset < 0)
	) {
		offset *= 0.35;
	}

	updateTrackPosition({ animate: false, offsetPx: offset });
}

function endSwipe(_event: PointerEvent): void {
	if (!drag.active) return;
	drag.active = false;
	deckEl?.classList.remove('is-dragging');
	document.removeEventListener('pointermove', moveSwipe);
	document.removeEventListener('pointerup', endSwipe);
	document.removeEventListener('pointercancel', endSwipe);

	const threshold = Math.min(140, (drag.width || 1) * 0.16);
	const delta = drag.deltaX;
	if (drag.moved && Math.abs(delta) > threshold) {
		if (delta < 0) goToSlide(currentSlide + 1);
		else goToSlide(currentSlide - 1);
		return;
	}

	goToSlide(currentSlide);
}

async function bootstrap(): Promise<void> {
	const token = getTokenFromPath();
	if (!token) {
		if (titleEl) titleEl.textContent = 'Invalid share link';
		return;
	}

	try {
		const response = await fetch(`/api/share/${token}`);
		const result: ShareApiResponse = await response.json();

		if (!response.ok || !result.success || !result.slideData) {
			throw new Error(result.message || 'Deck not found.');
		}

		slideData = result.slideData;
		if (titleEl) {
			titleEl.textContent = `${slideData.project?.projectTitle || 'Pitch Deck'}`;
		}
		if (subtitleEl) {
			subtitleEl.textContent = `Prepared for ${
				slideData.project?.clientName || 'Client'
			} · ${slideData.slides.length} slides`;
		}

		if (result.downloadUrl) {
			if (pptxLink instanceof HTMLAnchorElement) {
				pptxLink.href = result.downloadUrl;
				pptxLink.classList.remove('disabled');
			}
		} else {
			if (pptxLink instanceof HTMLAnchorElement) {
				pptxLink.href = '#';
				pptxLink.classList.add('disabled');
			}
		}

		renderDeck(slideData);
		goToSlide(0, { animate: false });

		const url = new URL(window.location.href);
		isPrintMode = url.searchParams.get('print') === '1';
		if (isPrintMode) {
			document.body.classList.add('print-mode');
			setTimeout(() => window.print(), 350);
		}
	} catch (error) {
		console.error(error);
		if (titleEl) titleEl.textContent = 'Could not load deck';
		if (subtitleEl) {
			subtitleEl.textContent = error instanceof Error
				? error.message
				: 'Try generating a new share link.';
		}
	}
}

prevButton?.addEventListener('click', () => {
	goToSlide(currentSlide - 1);
});

nextButton?.addEventListener('click', () => {
	goToSlide(currentSlide + 1);
});

printButton?.addEventListener('click', () => {
	window.print();
});

deckEl?.addEventListener('pointerdown', startSwipe);

window.addEventListener('resize', () => {
	if (!slideData) return;
	updateTrackPosition({ animate: false });
	scaleShareSlides();
});

document.addEventListener('keydown', (event: KeyboardEvent) => {
	if (!slideData || isPrintMode) return;
	if (event.key === 'ArrowLeft') goToSlide(currentSlide - 1);
	if (event.key === 'ArrowRight') goToSlide(currentSlide + 1);
});

bootstrap();
