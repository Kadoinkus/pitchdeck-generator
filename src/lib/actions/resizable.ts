export interface ResizableOptions {
	/** Minimum width in px (default: 100). */
	min?: number;
	/** Maximum width in px. Omit for no upper cap. */
	max?: number;
	/** CSS custom property name to set (default: '--thumb-w'). */
	property?: string;
	/** Selector for the ancestor element that receives the property. */
	target?: string;
}

/**
 * Svelte action for a drag-to-resize handle.
 * Uses a lightweight visual drag preview (handle transform) and commits
 * the final width once on pointer-up to avoid heavy per-frame re-layout.
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
	let previewWidth: number | null = null;
	let startWidth = 0;
	let startX = 0;

	function clampWidth(value: number, min: number, max?: number): number {
		if (typeof max === 'number') {
			return Math.max(min, Math.min(value, max));
		}
		return Math.max(min, value);
	}

	function resolveTarget(): HTMLElement | null {
		const sel = opts?.target;
		return sel ? node.closest<HTMLElement>(sel) : node.parentElement;
	}

	function flushPreview(): void {
		rafId = null;
		const width = previewWidth;
		if (width === null) return;
		const delta = width - startWidth;
		if (delta === 0) {
			node.style.removeProperty('transform');
			return;
		}
		node.style.transform = `translate3d(${delta}px, 0, 0)`;
	}

	function schedulePreview(width: number): void {
		previewWidth = width;
		if (rafId !== null) return;
		rafId = requestAnimationFrame(flushPreview);
	}

	function stopDrag(): void {
		node.classList.remove('is-dragging');
		node.style.removeProperty('transform');

		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		previewWidth = null;
		startWidth = 0;
		startX = 0;

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
		const max = opts?.max;
		resizeProperty = opts?.property ?? '--thumb-w';
		resizeTarget = resolveTarget();

		const fallbackWidth = clampWidth(resizeTarget?.offsetWidth ?? min, min, max);
		const currentWidth = resizeTarget
			? Number.parseFloat(getComputedStyle(resizeTarget).getPropertyValue(resizeProperty))
			: Number.NaN;
		startWidth = Number.isFinite(currentWidth)
			? clampWidth(currentWidth, min, max)
			: fallbackWidth;
		startX = event.clientX;
		previewWidth = startWidth;

		moveHandler = (e: PointerEvent): void => {
			const delta = e.clientX - startX;
			const width = clampWidth(startWidth + delta, min, max);
			schedulePreview(width);
		};

		endHandler = (): void => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			const finalWidth = previewWidth ?? startWidth;
			if (resizeTarget && Number.isFinite(finalWidth)) {
				resizeTarget.style.setProperty(resizeProperty, `${finalWidth}px`);
			}

			stopDrag();
		};

		node.addEventListener('pointermove', moveHandler);
		node.addEventListener('pointerup', endHandler);
		node.addEventListener('pointercancel', endHandler);
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(newOpts?: ResizableOptions) {
			opts = newOpts;
		},
		destroy() {
			stopDrag();
			node.removeEventListener('pointerdown', onPointerDown);
		},
	};
}
