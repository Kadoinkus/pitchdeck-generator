import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

const VIEWER_STATE_KEY = 'proposalDeckViewerOpen';
const VIEWER_SLIDE_KEY = 'proposalDeckViewerSlide';

function readSessionValue(key: string): string | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeSessionValue(key: string, value: string | null): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		if (value === null) {
			sessionStorage.removeItem(key);
			return;
		}
		sessionStorage.setItem(key, value);
	} catch {
		// Ignore storage write failures (e.g. privacy mode)
	}
}

/** Deck data with the resolved slide array required by the viewer. */
export interface ViewerDeckData extends DeckData {
	slides: SlideData[];
	theme: ThemeData;
}

export interface ToolbarOptions {
	shareToken?: string | null;
}

export interface ChatTarget {
	target: string;
	label: string;
}

// Snapshot saved state before effects can clear it
const savedOpen = readSessionValue(VIEWER_STATE_KEY) === '1';
const savedSlide = parseInt(readSessionValue(VIEWER_SLIDE_KEY) ?? '0', 10) || 0;

class ViewerState {
	#currentSlide = $state(savedSlide);
	#isOpen = $state(false);
	#slideData = $state.raw<ViewerDeckData | null>(null);
	#toolbarOptions = $state.raw<ToolbarOptions>({});
	#chatTarget = $state.raw<ChatTarget | null>(null);

	get currentSlide() {
		return this.#currentSlide;
	}

	get isOpen() {
		return this.#isOpen;
	}

	get slideData() {
		return this.#slideData;
	}

	get toolbarOptions() {
		return this.#toolbarOptions;
	}

	get chatTarget() {
		return this.#chatTarget;
	}

	readonly slideCount = $derived(this.#slideData?.slides.length ?? 0);

	/* Navigation */

	goToSlide = (index: number): void => {
		const max = this.slideCount - 1;
		if (max < 0) return;
		this.#currentSlide = Math.max(0, Math.min(index, max));
	};

	nextSlide = (): void => {
		this.goToSlide(this.#currentSlide + 1);
	};

	prevSlide = (): void => {
		this.goToSlide(this.#currentSlide - 1);
	};

	/* Lifecycle */

	show = (data: ViewerDeckData, options: ToolbarOptions = {}, startSlide?: number): void => {
		if (!data.slides.length) return;
		this.#slideData = data;
		this.#toolbarOptions = options;
		const target = startSlide ?? this.#currentSlide;
		this.#currentSlide = Math.max(0, Math.min(target, data.slides.length - 1));
		this.#isOpen = true;
	};

	updateData = (data: ViewerDeckData): void => {
		if (!data.slides.length) return;
		this.#slideData = data;
		this.#currentSlide = Math.max(0, Math.min(this.#currentSlide, data.slides.length - 1));
	};

	updateProject = (patch: Partial<NonNullable<ViewerDeckData['project']>>): void => {
		if (!this.#slideData) return;

		let slides = this.#slideData.slides;
		if (patch.projectTitle && slides.length && slides[0]?.type === 'cover') {
			slides = slides.map((s, i) => (i === 0 ? { ...s, title: patch.projectTitle } : s));
		}

		this.#slideData = {
			...this.#slideData,
			slides,
			project: { ...this.#slideData.project, ...patch },
		};
	};

	updateTheme = (patch: Partial<ViewerDeckData['theme']>): void => {
		if (!this.#slideData) return;

		this.#slideData = {
			...this.#slideData,
			theme: { ...this.#slideData.theme, ...patch },
		};
	};

	hide = (): void => {
		this.#isOpen = false;
		this.#chatTarget = null;
	};

	setChatTarget = (target: ChatTarget | null): void => {
		this.#chatTarget = target;
	};
}

export const viewer = new ViewerState();

/* SessionStorage persistence */
$effect.root(() => {
	$effect(() => {
		if (viewer.isOpen) {
			writeSessionValue(VIEWER_STATE_KEY, '1');
		} else {
			writeSessionValue(VIEWER_STATE_KEY, null);
		}
	});
	$effect(() => {
		writeSessionValue(VIEWER_SLIDE_KEY, String(viewer.currentSlide));
	});
});

export function wasViewerOpen(): { open: boolean; slide: number } {
	return { open: savedOpen, slide: savedSlide };
}
