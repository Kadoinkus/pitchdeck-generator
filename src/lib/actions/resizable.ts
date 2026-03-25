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

	function resolveTarget(): HTMLElement | null {
		const sel = opts?.target;
		return sel ? node.closest<HTMLElement>(sel) : node.parentElement;
	}

	function onPointerDown(event: PointerEvent): void {
		if (!event.isPrimary) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		event.preventDefault();
		try {
			node.setPointerCapture(event.pointerId);
		} catch {
			// Ignore when pointer capture is unsupported/rejected.
		}
		node.classList.add('is-dragging');

		const min = opts?.min ?? 100;
		const max = opts?.max ?? 400;
		const prop = opts?.property ?? '--thumb-w';
		const target = resolveTarget();

		function onPointerMove(e: PointerEvent): void {
			const w = Math.max(min, Math.min(e.clientX, max));
			target?.style.setProperty(prop, `${w}px`);
		}

		function onPointerUp(): void {
			node.classList.remove('is-dragging');
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
		}

		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerUp);
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(newOpts) {
			opts = newOpts;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
		},
	};
}
