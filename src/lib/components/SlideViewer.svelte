<script lang="ts">
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import SlideCanvas from '$lib/components/SlideCanvas.svelte';
	import ThumbnailStrip from '$lib/components/ThumbnailStrip.svelte';
	import ViewerToolbar from '$lib/components/ViewerToolbar.svelte';
	import {
		hideViewer,
		nextSlide,
		prevSlide,
		viewer,
	} from '$lib/stores/viewer.svelte.ts';

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

	function handleKeydown(event: KeyboardEvent): void {
		if (!viewer.isOpen) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			prevSlide();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			nextSlide();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			hideViewer();
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
</style>
