/**
 * Svelte 5 runes-based swipe/wheel navigation state.
 * Returns event handlers to bind directly to elements.
 */

export interface SwipeableOptions {
	onPrev: () => void;
	onNext: () => void;
	onDrag?: (deltaX: number) => void;
	threshold?: number;
	wheelThreshold?: number;
	wheelCooldownMs?: number;
}

export function createSwipeable(getOptions: () => SwipeableOptions) {
	// Drag state
	let dragActive = $state(false);
	let dragStartX = $state(0);
	let dragDeltaX = $state(0);
	let dragWidth = $state(1);
	let dragMoved = $state(false);
	let suppressNextClick = $state(false);

	// Wheel state
	let wheelAccumulated = $state(0);
	let wheelLastEventAt = $state(0);
	let wheelLastTriggerAt = $state(0);

	function isInteractiveTarget(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		return Boolean(
			target.closest(
				'a,button,input,textarea,select,summary,[role="button"],[role="link"],[contenteditable]:not([contenteditable="false"]),[data-ai-target]',
			),
		);
	}

	function isPrimaryActivation(event: PointerEvent): boolean {
		if (!event.isPrimary) return false;
		if (event.pointerType === 'mouse') return event.button === 0;
		return true;
	}

	function normalizeWheelDelta(event: WheelEvent, height: number): number {
		const modeScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height || 1 : 1;
		const deltaX = event.deltaX * modeScale;
		const deltaY = event.deltaY * modeScale;
		return Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
	}

	function handlePointerDown(event: PointerEvent, node: HTMLElement): void {
		if (!isPrimaryActivation(event)) return;
		if (isInteractiveTarget(event.target)) return;

		dragActive = true;
		dragStartX = event.clientX;
		dragDeltaX = 0;
		dragWidth = node.clientWidth || 1;
		dragMoved = false;

		try {
			node.setPointerCapture(event.pointerId);
		} catch {
			// Ignore when browser rejects pointer capture
		}
		node.classList.add('is-dragging');
	}

	function handlePointerMove(event: PointerEvent): void {
		if (!dragActive) return;
		dragDeltaX = event.clientX - dragStartX;
		if (Math.abs(dragDeltaX) > 6) dragMoved = true;

		getOptions().onDrag?.(dragDeltaX);
	}

	function handlePointerUp(node: HTMLElement): void {
		if (!dragActive) return;
		dragActive = false;

		node.classList.remove('is-dragging');
		getOptions().onDrag?.(0);

		const opts = getOptions();
		const threshold = Math.max(20, Math.min(opts.threshold ?? 140, dragWidth * 0.16));

		if (dragMoved && Math.abs(dragDeltaX) > threshold) {
			if (dragDeltaX < 0) opts.onNext();
			else opts.onPrev();
			suppressNextClick = true;
		}
	}

	function handleClick(event: MouseEvent): void {
		if (suppressNextClick) {
			suppressNextClick = false;
			event.stopPropagation();
			event.preventDefault();
		}
	}

	function handleWheel(event: WheelEvent, height: number): void {
		if (dragActive) return;
		if (event.ctrlKey || event.metaKey || event.altKey) return;

		const delta = normalizeWheelDelta(event, height);
		if (Math.abs(delta) < 2) return;

		event.preventDefault();

		const opts = getOptions();
		const now = performance.now();
		const cooldownMs = opts.wheelCooldownMs ?? 380;

		if (now - wheelLastTriggerAt < cooldownMs) {
			wheelLastEventAt = now;
			return;
		}

		if (now - wheelLastEventAt > 260) {
			wheelAccumulated = 0;
		}

		if (Math.sign(wheelAccumulated) !== Math.sign(delta)) {
			wheelAccumulated = 0;
		}

		wheelLastEventAt = now;
		wheelAccumulated += delta;

		const threshold = opts.wheelThreshold ?? 115;
		if (Math.abs(wheelAccumulated) < threshold) return;

		if (wheelAccumulated > 0) opts.onNext();
		else opts.onPrev();

		wheelAccumulated = 0;
		wheelLastTriggerAt = now;
	}

	function handleDragStart(event: Event): void {
		if (dragActive) event.preventDefault();
	}

	return {
		get isDragging() {
			return dragActive;
		},
		handlers: {
			pointerdown: handlePointerDown,
			pointermove: handlePointerMove,
			pointerup: handlePointerUp,
			pointercancel: handlePointerUp,
			click: handleClick,
			wheel: handleWheel,
			dragstart: handleDragStart,
		},
	};
}
