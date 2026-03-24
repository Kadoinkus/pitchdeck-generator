import type { DeckData, SlideData, ThemeData } from '$lib/slides/types.ts';

/* ------------------------------------------------------------------ */
/*  Viewer state (module-level Svelte 5 runes)                         */
/* ------------------------------------------------------------------ */

const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';

/** Deck data with the resolved slide array required by the viewer. */
export interface ViewerDeckData extends DeckData {
	slides: SlideData[];
	theme: ThemeData;
}

interface ToolbarOptions {
	downloadUrl?: string | null;
	pdfUrl?: string | null;
	shareUrl?: string | null;
}

interface ChatTarget {
	target: string;
	label: string;
}

let _currentSlide = $state(0);
let _isOpen = $state(false);
let _slideData = $state<ViewerDeckData | null>(null);
let _toolbarOptions = $state<ToolbarOptions>({});
let _chatTarget = $state<ChatTarget | null>(null);

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

function slideCount(): number {
	return _slideData?.slides.length ?? 0;
}

export function goToSlide(index: number): void {
	const max = slideCount() - 1;
	if (max < 0) return;
	_currentSlide = Math.max(0, Math.min(index, max));
}

export function nextSlide(): void {
	goToSlide(_currentSlide + 1);
}

export function prevSlide(): void {
	goToSlide(_currentSlide - 1);
}

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                          */
/* ------------------------------------------------------------------ */

export function showViewer(data: ViewerDeckData, options: ToolbarOptions = {}): void {
	if (!data.slides.length) return;

	_slideData = data;
	_toolbarOptions = options;
	_currentSlide = Math.max(0, Math.min(_currentSlide, data.slides.length - 1));
	_isOpen = true;
}

export function updateViewerData(data: ViewerDeckData): void {
	if (!data.slides.length) return;

	_slideData = data;
	_currentSlide = Math.max(0, Math.min(_currentSlide, data.slides.length - 1));
}

export function hideViewer(): void {
	_isOpen = false;
	_chatTarget = null;
}

export function setChatTarget(target: ChatTarget | null): void {
	_chatTarget = target;
}

/* ------------------------------------------------------------------ */
/*  SessionStorage persistence                                         */
/* ------------------------------------------------------------------ */

$effect.root(() => {
	$effect(() => {
		if (_isOpen) {
			sessionStorage.setItem(VIEWER_STATE_KEY, '1');
		} else {
			sessionStorage.removeItem(VIEWER_STATE_KEY);
		}
	});
});

export function wasViewerOpen(): boolean {
	if (typeof sessionStorage === 'undefined') return false;
	return sessionStorage.getItem(VIEWER_STATE_KEY) === '1';
}

/* ------------------------------------------------------------------ */
/*  Reactive getters                                                   */
/* ------------------------------------------------------------------ */

export const viewer = {
	get currentSlide() {
		return _currentSlide;
	},
	get isOpen() {
		return _isOpen;
	},
	get slideData() {
		return _slideData;
	},
	get toolbarOptions() {
		return _toolbarOptions;
	},
	get chatTarget() {
		return _chatTarget;
	},
	get slideCount() {
		return slideCount();
	},
};

export type { ChatTarget, ToolbarOptions };
