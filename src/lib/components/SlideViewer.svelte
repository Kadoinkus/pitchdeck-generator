<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { resizable } from '$lib/actions/resizable';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import SlideCanvas from '$lib/components/SlideCanvas.svelte';
	import ThumbnailStrip from '$lib/components/ThumbnailStrip.svelte';
	import ViewerToolbar from '$lib/components/ViewerToolbar.svelte';
	import { viewer } from '$lib/stores/viewer.svelte';

	interface Props {
		projectName?: string;
		projectContext?: string;
		saveState?: 'saved' | 'dirty' | 'saving' | 'error';
		onUndo?: () => void;
		onRedo?: () => void;
		onRename?: (name: string) => void;
		canUndo?: boolean;
		canRedo?: boolean;
		/** Current form payload for the chat panel. */
		chatPayload?: Record<string, unknown>;
		/** Called when the user applies a chat suggestion. */
		onApplySuggestion?: (field: string, value: string) => void;
	}

	let {
		projectName = 'Untitled Deck',
		projectContext = '',
		saveState = 'saved',
		onUndo,
		onRedo,
		onRename,
		canUndo = false,
		canRedo = false,
		chatPayload = {},
		onApplySuggestion,
	}: Props = $props();

	function isEditableTarget(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		return Boolean(
			target.closest(
				'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]',
			),
		);
	}

	function isActionTarget(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		return Boolean(target.closest('a,button,[role="button"],[role="link"]'));
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (!viewer.isOpen) return;
		if (event.defaultPrevented) return;
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		if (isEditableTarget(event.target)) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			closeViewer();
			return;
		}

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				event.preventDefault();
				viewer.prevSlide();
				return;
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
				event.preventDefault();
				viewer.nextSlide();
				return;
			case 'Home':
				event.preventDefault();
				viewer.goToSlide(0);
				return;
			case 'End':
				event.preventDefault();
				viewer.goToSlide(viewer.slideCount - 1);
				return;
			case ' ':
			case 'Spacebar':
				if (isActionTarget(event.target)) return;
				event.preventDefault();
				if (event.shiftKey) viewer.prevSlide();
				else viewer.nextSlide();
				return;
		}
	}

	function closeViewer(): void {
		viewer.hide();
		goto(resolve('/'));
	}

	/* C2: Focus trap — keep Tab cycling within the viewer overlay.
	 * F2+F4: Shared selector covers all interactive elements including
	 * contenteditable and <summary>. Excludes :disabled and tabindex="-1". */
	const FOCUSABLE_SELECTOR = [
		'button:not(:disabled)',
		'[href]:not([tabindex="-1"])',
		'input:not(:disabled)',
		'select:not(:disabled)',
		'textarea:not(:disabled)',
		'[contenteditable]:not([contenteditable="false"])',
		'summary',
		'[tabindex]:not([tabindex="-1"])',
	].join(',');

	/** F3: querySelectorAll returns elements inside inert subtrees — filter them. */
	function queryFocusable(root: HTMLElement): HTMLElement[] {
		return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
			(el) => !el.closest('[inert]'),
		);
	}

	let viewerEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		const el = viewerEl;
		if (!el) return;
		const first = queryFocusable(el)[0];
		first?.focus();
	});

	function trapFocus(event: KeyboardEvent): void {
		if (event.key !== 'Tab' || !viewerEl) return;

		const focusable = queryFocusable(viewerEl);
		if (focusable.length === 0) return;

		const firstEl = focusable[0];
		const lastEl = focusable[focusable.length - 1];
		if (!firstEl || !lastEl) return;

		if (event.shiftKey) {
			if (document.activeElement === firstEl) {
				event.preventDefault();
				lastEl.focus();
			}
		} else {
			if (document.activeElement === lastEl) {
				event.preventDefault();
				firstEl.focus();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if viewer.isOpen}
	<!-- C2: Dialog semantics + focus trap for the fullscreen viewer overlay -->
	<div
		class="slide-viewer"
		role="dialog"
		aria-modal="true"
		aria-label="Slide viewer"
		tabindex="-1"
		bind:this={viewerEl}
		onkeydown={trapFocus}
	>
		<ViewerToolbar
			{projectName}
			{projectContext}
			{saveState}
			{onUndo}
			{onRedo}
			{onRename}
			{canUndo}
			{canRedo}
		/>

		<main class="viewer-body">
			<ThumbnailStrip />

			<div
				class="thumb-resize"
				aria-hidden="true"
				use:resizable={{ min: 140, target: '.slide-viewer' }}
			>
			</div>

			<SlideCanvas />

			<ChatPanel
				payload={chatPayload}
				onApply={onApplySuggestion}
			/>
		</main>
	</div>
{/if}

<style>
	.slide-viewer {
		--slide-w: 1020px;
		--slide-h: calc(var(--slide-w) * 9 / 16);
		--thumb-w: 182px;
		--viewer-bg: #e9edf3;

		position: fixed;
		inset: 0;
		z-index: 1000;
		background: var(--viewer-bg);
		display: flex;
		flex-direction: column;
	}

	:global([data-theme="dark"]) .slide-viewer {
		--viewer-bg: #14192a;
	}

	.viewer-body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.thumb-resize {
		width: 6px;
		flex-shrink: 0;
		cursor: col-resize;
		background: transparent;
		border-left: 1px solid var(--line);
		transition: background 0.15s ease;
		/* M9: Subtle dot affordance hints at draggability */
		background-image: radial-gradient(
			circle,
			var(--muted) 1px,
			transparent 1px
		);
		background-size: 2px 8px;
		background-repeat: repeat-y;
		background-position: center;
		opacity: 0.4;
	}

	.thumb-resize:global(.is-dragging) {
		background: rgba(41, 196, 146, 0.25);
		opacity: 1;
	}

	@media (hover: hover) {
		.thumb-resize:hover {
			background: rgba(41, 196, 146, 0.25);
			opacity: 1;
		}
	}

	@media (max-width: 980px) {
		.slide-viewer {
			--thumb-w: 126px;
		}
	}

	@media (max-width: 680px) {
		.viewer-body {
			flex-direction: column;
		}

		.thumb-resize {
			display: none;
		}
	}
</style>
