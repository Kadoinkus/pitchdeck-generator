<script lang="ts">
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
	}

	let {
		projectName = 'Untitled Deck',
		projectContext = '',
		saveState = 'saved',
		onUndo,
		onRedo,
		canUndo = false,
		canRedo = false,
	}: Props = $props();

	const counter = $derived(
		viewer.slideCount > 0
			? `${viewer.currentSlide + 1} / ${viewer.slideCount}`
			: '0 / 0',
	);

	const opts = $derived(viewer.toolbarOptions);

	const hasDownload = $derived(Boolean(opts.downloadUrl));
	const hasPdf = $derived(Boolean(opts.pdfUrl));
	const hasShare = $derived(Boolean(opts.shareUrl));
	const hasAnyShareAction = $derived(hasDownload || hasPdf || hasShare);

	let shareOpen = $state(false);
	let copyLabel = $state('Copy share link');
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const atStart = $derived(viewer.currentSlide <= 0);
	const atEnd = $derived(viewer.currentSlide >= viewer.slideCount - 1);

	const saveLabel = $derived(
		saveState === 'saved'
			? 'Saved'
			: saveState === 'dirty'
			? 'Unsaved'
			: saveState === 'saving'
			? 'Saving\u2026'
			: 'Error',
	);

	function toggleShare(): void {
		if (!hasAnyShareAction) return;
		shareOpen = !shareOpen;
	}

	function closeShare(): void {
		shareOpen = false;
	}

	async function copyShareLink(): Promise<void> {
		if (!opts.shareUrl) return;
		try {
			await navigator.clipboard.writeText(opts.shareUrl);
			copyLabel = 'Link copied';
		} catch {
			copyLabel = 'Copy failed';
		}
		if (copyTimer !== undefined) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			copyLabel = 'Copy share link';
		}, 1400);
		closeShare();
	}

	function handleOutsideClick(event: MouseEvent): void {
		if (!shareOpen) return;
		const target = event.target;
		if (target instanceof Node) {
			const dropdown = document.querySelector('.viewer-share-dropdown');
			if (dropdown?.contains(target)) return;
		}
		closeShare();
	}
</script>

<svelte:document onclick={handleOutsideClick} />

<div class="viewer-toolbar">
	<div class="viewer-toolbar-left">
		<button
			class="toolbar-btn viewer-home-btn"
			type="button"
			onclick={hideViewer}
		>
			&#8592; Editor
		</button>

		<div class="viewer-project">
			<div class="viewer-project-row">
				<strong>{projectName}</strong>
			</div>
			{#if projectContext}
				<p class="viewer-project-context">{projectContext}</p>
			{/if}
		</div>

		<span class="save-indicator is-{saveState}">{saveLabel}</span>

		{#if onUndo || onRedo}
			<div class="viewer-menu-pills">
				<button
					class="history-btn"
					type="button"
					disabled={!canUndo}
					onclick={onUndo}
					aria-label="Undo"
				>
					&#8617;
				</button>
				<button
					class="history-btn"
					type="button"
					disabled={!canRedo}
					onclick={onRedo}
					aria-label="Redo"
				>
					&#8618;
				</button>
			</div>
		{/if}
	</div>

	<div class="viewer-toolbar-middle">
		<span class="slide-counter">{counter}</span>
		<div class="toolbar-nav">
			<button
				class="toolbar-btn"
				type="button"
				disabled={atStart}
				onclick={prevSlide}
				aria-label="Previous slide"
			>
				&#10094;
			</button>
			<button
				class="toolbar-btn"
				type="button"
				disabled={atEnd}
				onclick={nextSlide}
				aria-label="Next slide"
			>
				&#10095;
			</button>
		</div>
	</div>

	<div class="viewer-toolbar-right">
		<div class="viewer-share-dropdown" class:open={shareOpen}>
			<button
				class="toolbar-btn viewer-share-toggle"
				type="button"
				disabled={!hasAnyShareAction}
				aria-expanded={shareOpen}
				onclick={toggleShare}
			>
				Share <span class="share-caret">&#9660;</span>
			</button>
			<div class="viewer-share-menu">
				<a
					class="viewer-share-item"
					class:disabled={!hasDownload}
					href={opts.downloadUrl ?? undefined}
					download
					onclick={closeShare}
				>Download PPTX</a>
				<a
					class="viewer-share-item"
					class:disabled={!hasPdf}
					href={opts.pdfUrl ?? undefined}
					onclick={closeShare}
				>Download PDF</a>

				<a
					class="viewer-share-item"
					class:disabled={!hasShare}
					href={opts.shareUrl ?? undefined}
					target="_blank"
					rel="noopener noreferrer"
					onclick={closeShare}
				>Open share link</a>
				<button
					class="viewer-share-item"
					type="button"
					disabled={!hasShare}
					onclick={copyShareLink}
				>
					{copyLabel}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.viewer-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 8px 12px;
		background: linear-gradient(
			96deg,
			#0fa7c9 0%,
			#2d7fd3 48%,
			#515fda 75%,
			#6d3dd9 100%
		);
		border-bottom: 0;
		box-shadow: 0 8px 20px rgba(22, 28, 81, 0.26);
	}

	.viewer-toolbar-left,
	.viewer-toolbar-middle,
	.viewer-toolbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.viewer-toolbar-left {
		flex: 1 1 auto;
	}

	.viewer-toolbar-middle {
		flex: 0 1 auto;
		justify-content: center;
	}

	.viewer-toolbar-right {
		margin-left: auto;
	}

	.viewer-menu-pills {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-right: 6px;
	}

	.viewer-project {
		min-width: 0;
		display: grid;
		gap: 1px;
	}

	.viewer-project-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.viewer-project-row strong {
		font-family: "Sora", "DM Sans", sans-serif;
		font-size: 0.88rem;
		line-height: 1.2;
		color: #ffffff;
	}

	.viewer-project-context {
		margin: 0;
		color: rgba(227, 244, 255, 0.93);
		font-size: 0.7rem;
		line-height: 1.3;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		max-width: min(52vw, 640px);
	}

	.toolbar-btn {
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.14);
		color: #f2fbff;
		box-shadow: none;
		padding: 7px 11px;
		font-size: 12px;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(6px);
		font-weight: 700;
	}

	.toolbar-btn:hover {
		background: rgba(255, 255, 255, 0.24);
		transform: none;
	}

	.viewer-home-btn {
		min-width: 72px;
		height: 32px;
		border-radius: 999px;
		padding: 0 12px;
		font-size: 12px;
		line-height: 1;
	}

	.history-btn {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.36);
		background: rgba(255, 255, 255, 0.14);
		color: #f2fbff;
		font-size: 1.02rem;
		font-weight: 700;
		padding: 0;
		line-height: 1;
	}

	.history-btn:hover {
		background: rgba(255, 255, 255, 0.24);
		border-color: rgba(255, 255, 255, 0.58);
		transform: none;
	}

	.save-indicator {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 3px 8px;
		font-size: 0.66rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.save-indicator.is-saved {
		color: #edfefb;
		background: rgba(25, 173, 129, 0.22);
		border-color: rgba(198, 255, 235, 0.6);
	}

	.save-indicator.is-dirty {
		color: #fff8dd;
		background: rgba(236, 172, 49, 0.2);
		border-color: rgba(255, 241, 194, 0.62);
	}

	.save-indicator.is-saving {
		color: #e8f2ff;
		background: rgba(77, 151, 255, 0.22);
		border-color: rgba(194, 222, 255, 0.62);
	}

	.save-indicator.is-error {
		color: #ffe9f3;
		background: rgba(196, 58, 113, 0.24);
		border-color: rgba(255, 207, 226, 0.62);
	}

	.slide-counter {
		color: #f5faff;
		font-size: 12px;
		font-weight: 700;
		min-width: 62px;
		text-align: center;
		letter-spacing: 0.02em;
	}

	.toolbar-nav {
		display: flex;
		gap: 6px;
	}

	.viewer-share-dropdown {
		position: relative;
	}

	.viewer-share-toggle {
		min-width: 100px;
		gap: 7px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.18);
	}

	.share-caret {
		font-size: 10px;
		transition: transform 0.18s ease;
	}

	.viewer-share-dropdown.open .share-caret {
		transform: rotate(180deg);
	}

	.viewer-share-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 196px;
		padding: 8px;
		border-radius: 12px;
		border: 1px solid #cddcf5;
		background: #f9fbff;
		box-shadow: 0 18px 30px rgba(20, 35, 78, 0.22);
		display: none;
		z-index: 8;
	}

	.viewer-share-dropdown.open .viewer-share-menu {
		display: grid;
		gap: 4px;
	}

	.viewer-share-item {
		display: block;
		width: 100%;
		text-align: left;
		border: 1px solid transparent;
		border-radius: 8px;
		padding: 7px 9px;
		font-size: 0.8rem;
		font-weight: 700;
		text-decoration: none;
		color: #1c3f73;
		background: transparent;
		cursor: pointer;
	}

	.viewer-share-item:hover {
		background: #e9f2ff;
		border-color: #c8daf7;
	}

	.viewer-share-item.disabled,
	.viewer-share-item:disabled {
		opacity: 0.48;
		pointer-events: none;
	}

	@media (max-width: 980px) {
		.viewer-toolbar {
			flex-wrap: wrap;
			align-items: center;
			gap: 8px;
			padding: 8px;
		}

		.viewer-toolbar-left,
		.viewer-toolbar-middle,
		.viewer-toolbar-right {
			width: 100%;
		}

		.viewer-toolbar-left {
			gap: 8px;
		}

		.viewer-toolbar-middle,
		.viewer-toolbar-right {
			justify-content: flex-start;
		}

		.viewer-toolbar-right {
			margin-left: 0;
		}

		.viewer-menu-pills {
			display: none;
		}

		.viewer-project {
			max-width: calc(100vw - 120px);
		}

		.viewer-project-context {
			max-width: 100%;
		}

		.viewer-share-menu {
			right: 0;
			left: auto;
		}
	}

	@media (max-width: 680px) {
		.viewer-project-context,
		.save-indicator,
		.viewer-project {
			display: none;
		}

		.viewer-toolbar {
			padding: 6px 8px;
			gap: 6px;
			flex-wrap: nowrap;
		}

		.viewer-toolbar-left,
		.viewer-toolbar-middle,
		.viewer-toolbar-right {
			width: auto;
		}

		.viewer-toolbar-middle {
			flex: 1;
			justify-content: center;
			gap: 6px;
		}

		.toolbar-nav {
			margin-left: auto;
		}
	}
</style>
