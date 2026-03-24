export interface SwipeableOptions {
	onPrev: () => void;
	onNext: () => void;
	threshold?: number;
}

interface DragState {
	active: boolean;
	startX: number;
	deltaX: number;
	width: number;
	moved: boolean;
}

/**
 * Svelte action for pointer-driven swipe/drag navigation.
 * Applies a drag offset to `node.style.transform` while dragging,
 * then calls `onPrev`/`onNext` if the gesture exceeds the threshold.
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

	let suppressNextClick = false;

	function onPointerDown(event: PointerEvent): void {
		if (event.button !== 0) return;
		if (
			event.target instanceof HTMLElement
			&& event.target.closest('a,button,input,textarea,select')
		) {
			return;
		}

		drag.active = true;
		drag.startX = event.clientX;
		drag.deltaX = 0;
		drag.width = node.clientWidth || 1;
		drag.moved = false;

		node.classList.add('is-dragging');
		node.style.transition = 'none';

		document.addEventListener('pointermove', onPointerMove);
		document.addEventListener('pointerup', onPointerUp);
		document.addEventListener('pointercancel', onPointerUp);
	}

	function onPointerMove(event: PointerEvent): void {
		if (!drag.active) return;
		drag.deltaX = event.clientX - drag.startX;
		if (Math.abs(drag.deltaX) > 6) drag.moved = true;

		node.style.transform = `translate3d(${drag.deltaX}px, 0, 0)`;
	}

	function onPointerUp(): void {
		if (!drag.active) return;
		drag.active = false;

		node.classList.remove('is-dragging');
		node.style.transition = '';
		node.style.transform = '';

		document.removeEventListener('pointermove', onPointerMove);
		document.removeEventListener('pointerup', onPointerUp);
		document.removeEventListener('pointercancel', onPointerUp);

		const threshold = Math.min(
			opts.threshold ?? 140,
			drag.width * 0.16,
		);

		if (drag.moved && Math.abs(drag.deltaX) > threshold) {
			if (drag.deltaX < 0) opts.onNext();
			else opts.onPrev();

			suppressNextClick = true;
			requestAnimationFrame(() => {
				suppressNextClick = false;
			});
		}
	}

	function onClickCapture(event: MouseEvent): void {
		if (suppressNextClick) {
			event.stopPropagation();
			event.preventDefault();
		}
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('click', onClickCapture, true);

	return {
		update(newOpts: SwipeableOptions) {
			opts = newOpts;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('click', onClickCapture, true);
			document.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerup', onPointerUp);
			document.removeEventListener('pointercancel', onPointerUp);
		},
	};
}
