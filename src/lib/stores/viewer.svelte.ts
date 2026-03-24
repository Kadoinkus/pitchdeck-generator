import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

/* ------------------------------------------------------------------ */
/*  Viewer state (module-level Svelte 5 runes)                         */
/* ------------------------------------------------------------------ */

const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';
const VIEWER_SLIDE_KEY = 'proposalDeckViewerSlide';

/** Deck data with the resolved slide array required by the viewer. */
export interface ViewerDeckData extends DeckData {
	slides: SlideData[];
	theme: ThemeData;
}

interface ToolbarOptions {
	shareToken?: string | null;
}

interface ChatTarget {
	target: string;
	label: string;
}

// Snapshot saved state before effects can clear it
const _savedOpen = typeof sessionStorage !== 'undefined'
	&& sessionStorage.getItem(VIEWER_STATE_KEY) === '1';
const _savedSlide = typeof sessionStorage !== 'undefined'
	? parseInt(sessionStorage.getItem(VIEWER_SLIDE_KEY) ?? '0', 10) || 0
	: 0;

let _currentSlide = $state(_savedSlide);
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

export function showViewer(data: ViewerDeckData, options: ToolbarOptions = {}, startSlide?: number): void {
	if (!data.slides.length) return;

	_slideData = data;
	_toolbarOptions = options;
	const target = startSlide ?? _currentSlide;
	_currentSlide = Math.max(0, Math.min(target, data.slides.length - 1));
	_isOpen = true;
}

export function updateViewerData(data: ViewerDeckData): void {
	if (!data.slides.length) return;

	_slideData = data;
	_currentSlide = Math.max(0, Math.min(_currentSlide, data.slides.length - 1));
}

export function updateViewerProject(patch: Partial<NonNullable<ViewerDeckData['project']>>): void {
	if (!_slideData) return;
	_slideData = {
		..._slideData,
		project: { ..._slideData.project, ...patch },
	};
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
	$effect(() => {
		sessionStorage.setItem(VIEWER_SLIDE_KEY, String(_currentSlide));
	});
});

export function wasViewerOpen(): { open: boolean; slide: number } {
	return { open: _savedOpen, slide: _savedSlide };
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
