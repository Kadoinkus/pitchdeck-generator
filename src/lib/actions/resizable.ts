export interface ResizableOptions {
	/** Minimum width in px (default: 100). */
	min?: number;
	/** Maximum width in px (default: 400). */
	max?: number;
	/** CSS custom property name to set (default: '--thumb-w'). */
	property?: string;
	/** Selector for the ancestor element that receives the property. */
	target?: string;
}

/**
 * Svelte action for a drag-to-resize handle.
 * Updates a CSS custom property directly on the DOM during drag,
 * bypassing Svelte reactivity for zero-overhead per-frame updates.
 */
export function resizable(
	node: HTMLElement,
	options?: ResizableOptions,
): { destroy: () => void; update: (opts?: ResizableOptions) => void } {
	let opts = options;
	let moveHandler: ((event: PointerEvent) => void) | null = null;
	let endHandler: (() => void) | null = null;
	let pointerId: number | null = null;
	let resizeTarget: HTMLElement | null = null;
	let resizeProperty = '--thumb-w';
	let rafId: number | null = null;
	let pendingWidth: number | null = null;
	let lastWrittenWidth: number | null = null;

	function resolveTarget(): HTMLElement | null {
		const sel = opts?.target;
		return sel ? node.closest<HTMLElement>(sel) : node.parentElement;
	}

	function flushPendingWidth(): void {
		rafId = null;
		const width = pendingWidth;
		pendingWidth = null;
		if (width === null) return;
		if (width === lastWrittenWidth) return;
		if (!resizeTarget) return;
		resizeTarget.style.setProperty(resizeProperty, `${width}px`);
		lastWrittenWidth = width;
	}

	function scheduleWidthWrite(width: number): void {
		pendingWidth = width;
		if (rafId !== null) return;
		rafId = requestAnimationFrame(flushPendingWidth);
	}

	function stopDrag(): void {
		node.classList.remove('is-dragging');
		resizeTarget?.classList.remove('is-resizing');

		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		pendingWidth = null;
		lastWrittenWidth = null;

		if (moveHandler) {
			node.removeEventListener('pointermove', moveHandler);
			moveHandler = null;
		}

		if (endHandler) {
			node.removeEventListener('pointerup', endHandler);
			node.removeEventListener('pointercancel', endHandler);
			endHandler = null;
		}

		if (pointerId !== null && node.hasPointerCapture(pointerId)) {
			try {
				node.releasePointerCapture(pointerId);
			} catch {
				// Ignore when pointer capture is unsupported/rejected.
			}
		}

		pointerId = null;
		resizeTarget = null;
	}

	function onPointerDown(event: PointerEvent): void {
		if (!event.isPrimary) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		stopDrag();
		event.preventDefault();
		pointerId = event.pointerId;
		try {
			node.setPointerCapture(event.pointerId);
		} catch {
			// Ignore when pointer capture is unsupported/rejected.
		}
		node.classList.add('is-dragging');

		const min = opts?.min ?? 100;
		const max = opts?.max ?? 400;
		resizeProperty = opts?.property ?? '--thumb-w';
		resizeTarget = resolveTarget();
		resizeTarget?.classList.add('is-resizing');

		moveHandler = (e: PointerEvent): void => {
			const w = Math.max(min, Math.min(e.clientX, max));
			scheduleWidthWrite(w);
		};

		endHandler = (): void => {
			stopDrag();
		};

		node.addEventListener('pointermove', moveHandler);
		node.addEventListener('pointerup', endHandler);
		node.addEventListener('pointercancel', endHandler);
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(newOpts) {
			opts = newOpts;
		},
		destroy() {
			stopDrag();
			node.removeEventListener('pointerdown', onPointerDown);
		},
	};
}
