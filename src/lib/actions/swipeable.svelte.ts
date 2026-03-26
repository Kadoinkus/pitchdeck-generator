/**
 * Svelte 5 attachment for swipe/wheel slide navigation.
 * Returns an attachment and a reactive handle for isDragging state.
 */
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';

export interface SwipeableOptions {
	onPrev: () => void;
	onNext: () => void;
	onDrag?: (deltaX: number) => void;
	threshold?: number;
	wheelThreshold?: number;
	wheelCooldownMs?: number;
}

export interface SwipeableHandle {
	readonly isDragging: boolean;
}

export function createSwipeable(getOptions: () => SwipeableOptions): {
	attach: Attachment<HTMLElement>;
	handle: SwipeableHandle;
} {
	let dragActive = $state(false);

	// Imperative bookkeeping — not reactive
	let dragStartX = 0;
	let dragDeltaX = 0;
	let dragWidth = 1;
	let dragMoved = false;
	let suppressNextClick = false;

	let wheelAccumulated = 0;
	let wheelLastEventAt = 0;
	let wheelLastTriggerAt = 0;

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

	const attach: Attachment<HTMLElement> = (node) => {
		const handlePointerDown = (event: PointerEvent): void => {
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
				// ignore if capture is rejected
			}

			node.classList.add('is-dragging');
		};

		const handlePointerMove = (event: PointerEvent): void => {
			if (!dragActive) return;

			dragDeltaX = event.clientX - dragStartX;
			if (Math.abs(dragDeltaX) > 6) dragMoved = true;

			getOptions().onDrag?.(dragDeltaX);
		};

		const finishDrag = (): void => {
			if (!dragActive) return;
			dragActive = false;

			node.classList.remove('is-dragging');
			getOptions().onDrag?.(0);

			const opts = getOptions();
			const threshold = Math.max(
				20,
				Math.min(opts.threshold ?? 140, dragWidth * 0.16),
			);

			if (dragMoved && Math.abs(dragDeltaX) > threshold) {
				if (dragDeltaX < 0) opts.onNext();
				else opts.onPrev();

				suppressNextClick = true;
			}
		};

		const handleClick = (event: MouseEvent): void => {
			if (!suppressNextClick) return;

			suppressNextClick = false;
			event.preventDefault();
			event.stopPropagation();
		};

		const handleWheel = (event: WheelEvent): void => {
			if (dragActive) return;
			if (event.ctrlKey || event.metaKey || event.altKey) return;

			const delta = normalizeWheelDelta(event, node.clientHeight || 1);
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

			if (
				wheelAccumulated !== 0
				&& Math.sign(wheelAccumulated) !== Math.sign(delta)
			) {
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
		};

		const handleDragStart = (event: DragEvent): void => {
			if (dragActive) event.preventDefault();
		};

		const offPointerDown = on(node, 'pointerdown', handlePointerDown);
		const offPointerMove = on(node, 'pointermove', handlePointerMove);
		const offPointerUp = on(node, 'pointerup', finishDrag);
		const offPointerCancel = on(node, 'pointercancel', finishDrag);
		const offClick = on(node, 'click', handleClick);
		const offWheel = on(node, 'wheel', handleWheel, { passive: false });
		const offDragStart = on(node, 'dragstart', handleDragStart);

		return () => {
			finishDrag();
			node.classList.remove('is-dragging');

			offPointerDown();
			offPointerMove();
			offPointerUp();
			offPointerCancel();
			offClick();
			offWheel();
			offDragStart();
		};
	};

	const handle: SwipeableHandle = {
		get isDragging() {
			return dragActive;
		},
	};

	return { attach, handle };
}
