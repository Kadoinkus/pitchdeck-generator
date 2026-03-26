export interface SwipeableOptions {
	onPrev: () => void;
	onNext: () => void;
	/** Called with the current horizontal drag offset (px) during a swipe. */
	onDrag?: (deltaX: number) => void;
	threshold?: number;
	wheelThreshold?: number;
	wheelCooldownMs?: number;
}

interface DragState {
	active: boolean;
	startX: number;
	deltaX: number;
	width: number;
	moved: boolean;
}

interface WheelState {
	accumulated: number;
	lastEventAt: number;
	lastTriggerAt: number;
}

/**
 * Svelte action for swipe/drag + wheel slide navigation.
 * Emits drag offsets via `onDrag` while dragging,
 * and calls `onPrev`/`onNext` when drag or wheel movement crosses threshold.
 */
export function swipeable(
	node: HTMLElement,
	options: SwipeableOptions,
): { destroy: () => void; update: (opts: SwipeableOptions) => void } {
	let opts = options;

	const drag: DragState = {
		active: false,
		startX: 0,
		deltaX: 0,
		width: 0,
		moved: false,
	};

	const wheel: WheelState = {
		accumulated: 0,
		lastEventAt: 0,
		lastTriggerAt: 0,
	};

	let suppressNextClick = false;

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

	function onPointerDown(event: PointerEvent): void {
		if (!isPrimaryActivation(event)) return;
		if (isInteractiveTarget(event.target)) return;

		drag.active = true;
		drag.startX = event.clientX;
		drag.deltaX = 0;
		drag.width = node.clientWidth || 1;
		drag.moved = false;

		try {
			node.setPointerCapture(event.pointerId);
		} catch {
			// Ignore when the browser rejects pointer capture.
		}
		node.classList.add('is-dragging');

		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerUp);
	}

	function normalizeWheelDelta(event: WheelEvent): number {
		const modeScale = event.deltaMode === 1
			? 16
			: event.deltaMode === 2
			? node.clientHeight || 1
			: 1;
		const deltaX = event.deltaX * modeScale;
		const deltaY = event.deltaY * modeScale;
		return Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
	}

	function onWheel(event: WheelEvent): void {
		if (drag.active) return;
		if (event.ctrlKey || event.metaKey || event.altKey) return;

		const delta = normalizeWheelDelta(event);
		if (Math.abs(delta) < 2) return;

		event.preventDefault();

		const now = performance.now();
		const cooldownMs = opts.wheelCooldownMs ?? 380;
		if (now - wheel.lastTriggerAt < cooldownMs) {
			wheel.lastEventAt = now;
			return;
		}

		if (now - wheel.lastEventAt > 260) {
			wheel.accumulated = 0;
		}

		if (Math.sign(wheel.accumulated) !== Math.sign(delta)) {
			wheel.accumulated = 0;
		}

		wheel.lastEventAt = now;
		wheel.accumulated += delta;

		const threshold = opts.wheelThreshold ?? 115;
		if (Math.abs(wheel.accumulated) < threshold) return;

		if (wheel.accumulated > 0) opts.onNext();
		else opts.onPrev();

		wheel.accumulated = 0;
		wheel.lastTriggerAt = now;
	}

	function onPointerMove(event: PointerEvent): void {
		if (!drag.active) return;
		drag.deltaX = event.clientX - drag.startX;
		if (Math.abs(drag.deltaX) > 6) drag.moved = true;

		opts.onDrag?.(drag.deltaX);
	}

	function onPointerUp(): void {
		if (!drag.active) return;
		drag.active = false;

		node.classList.remove('is-dragging');
		opts.onDrag?.(0);

		node.removeEventListener('pointermove', onPointerMove);
		node.removeEventListener('pointerup', onPointerUp);
		node.removeEventListener('pointercancel', onPointerUp);

		const threshold = Math.max(
			20,
			Math.min(
				opts.threshold ?? 140,
				drag.width * 0.16,
			),
		);

		if (drag.moved && Math.abs(drag.deltaX) > threshold) {
			if (drag.deltaX < 0) opts.onNext();
			else opts.onPrev();

			suppressNextClick = true;
		}
	}

	function onClickCapture(event: MouseEvent): void {
		if (suppressNextClick) {
			suppressNextClick = false;
			event.stopPropagation();
			event.preventDefault();
		}
	}

	function onDragStart(event: Event): void {
		if (drag.active) event.preventDefault();
	}

	const prevTouchAction = node.style.touchAction;
	node.style.touchAction = 'pan-y';

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('click', onClickCapture, true);
	node.addEventListener('wheel', onWheel, { passive: false });
	node.addEventListener('dragstart', onDragStart);

	return {
		update(newOpts: SwipeableOptions) {
			opts = newOpts;
		},
		destroy() {
			node.style.touchAction = prevTouchAction;
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('click', onClickCapture, true);
			node.removeEventListener('wheel', onWheel);
			node.removeEventListener('dragstart', onDragStart);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
		},
	};
}
