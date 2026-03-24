<script lang="ts">
	import { page } from '$app/state';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import SlideCanvas from '$lib/components/SlideCanvas.svelte';
	import ThumbnailStrip from '$lib/components/ThumbnailStrip.svelte';
	import ViewerToolbar from '$lib/components/ViewerToolbar.svelte';
	import {
		goToSlide,
		hideViewer,
		nextSlide,
		prevSlide,
		viewer,
	} from '$lib/stores/viewer.svelte';

	interface Props {
		projectName?: string;
		projectContext?: string;
		saveState?: 'saved' | 'dirty' | 'saving' | 'error';
		onUndo?: () => void;
		onRedo?: () => void;
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
		canUndo = false,
		canRedo = false,
		chatPayload = {},
		onApplySuggestion,
	}: Props = $props();

	let thumbWidth = $state(182);
	let resizing = $state(false);

	function isEditableTarget(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		return Boolean(
			target.closest(
				'input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"]',
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

		if (event.key === 'Escape') {
			event.preventDefault();
			closeViewer();
			return;
		}

		if (isEditableTarget(event.target)) return;

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				event.preventDefault();
				prevSlide();
				return;
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
				event.preventDefault();
				nextSlide();
				return;
			case 'Home':
				event.preventDefault();
				goToSlide(0);
				return;
			case 'End':
				event.preventDefault();
				goToSlide(viewer.slideCount - 1);
				return;
			case ' ':
			case 'Spacebar':
				if (isActionTarget(event.target)) return;
				event.preventDefault();
				if (event.shiftKey) prevSlide();
				else nextSlide();
				return;
		}
	}

	function startResize(event: PointerEvent): void {
		event.preventDefault();
		resizing = true;
		const target = event.currentTarget;
		if (target instanceof HTMLElement) {
			target.setPointerCapture(event.pointerId);
		}
	}

	function moveResize(event: PointerEvent): void {
		if (!resizing) return;
		thumbWidth = Math.max(100, Math.min(event.clientX, 400));
	}

	function endResize(): void {
		resizing = false;
	}

	function closeViewer(): void {
		if (page.state.viewer?.open) {
			history.back();
			return;
		}

		hideViewer();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if viewer.isOpen}
	<div
		class="slide-viewer"
		style:--thumb-w="{thumbWidth}px"
	>
		<ViewerToolbar
			{projectName}
			{projectContext}
			{saveState}
			{onUndo}
			{onRedo}
			{canUndo}
			{canRedo}
		/>

		<div class="viewer-body">
			<ThumbnailStrip />

			<div
				class="thumb-resize"
				class:is-dragging={resizing}
				role="separator"
				aria-orientation="vertical"
				tabindex="-1"
				onpointerdown={startResize}
				onpointermove={moveResize}
				onpointerup={endResize}
				onpointercancel={endResize}
			>
			</div>

			<SlideCanvas />

			<ChatPanel
				payload={chatPayload}
				onApply={onApplySuggestion}
			/>
		</div>
	</div>
{/if}

<style>
	.slide-viewer {
		--slide-w: 1020px;
		--slide-h: calc(var(--slide-w) * 9 / 16);
		--thumb-w: 182px;

		position: fixed;
		inset: 0;
		z-index: 1000;
		background: #e9edf3;
		display: flex;
		flex-direction: column;
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
		border-left: 1px solid #d8e0ec;
		transition: background 0.15s ease;
	}

	.thumb-resize:hover,
	.thumb-resize.is-dragging {
		background: rgba(41, 196, 146, 0.25);
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
