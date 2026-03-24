<script lang="ts">
	import { getShareLinks, toAbsoluteUrl } from '$lib/routing/share-links';
	import {
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

	const shareToken = $derived(viewer.toolbarOptions.shareToken ?? null);
	const shareLinks = $derived(shareToken ? getShareLinks(shareToken) : null);
	const hasAnyShareAction = $derived(Boolean(shareLinks));

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
		if (!shareLinks) return;
		try {
			const absoluteShareUrl = toAbsoluteUrl(
				shareLinks.sharePath,
				window.location.origin,
			);
			await navigator.clipboard.writeText(absoluteShareUrl);
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
			<svg
				class="home-icon"
				aria-hidden="true"
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
			>
				<path
					d="M2.5 7L8 2.5L13.5 7"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M4 8.5V13H6.5V10H9.5V13H12V8.5"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="home-label">Editor</span>
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
		<div class="slide-nav-pill">
			<button
				class="nav-pill-btn"
				type="button"
				disabled={atStart}
				onclick={prevSlide}
				aria-label="Previous slide"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M10 3L5.5 8L10 13"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			<span class="slide-counter">{counter}</span>
			<button
				class="nav-pill-btn"
				type="button"
				disabled={atEnd}
				onclick={nextSlide}
				aria-label="Next slide"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M6 3L10.5 8L6 13"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	</div>

	<div class="viewer-toolbar-right">
		{#if shareOpen}
			<button
				type="button"
				class="share-backdrop"
				onclick={closeShare}
				aria-label="Close share menu"
				tabindex="-1"
			>
			</button>
		{/if}
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
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<div class="viewer-share-menu">
				{#if shareLinks}
					<a
						class="viewer-share-item"
						href={shareLinks.downloadPath}
						download
						onclick={closeShare}
					>Download PPTX</a>
				{:else}
					<button class="viewer-share-item" type="button" disabled>
						Download PPTX
					</button>
				{/if}

				{#if shareLinks}
					<a
						class="viewer-share-item"
						href={shareLinks.pdfPath}
						onclick={closeShare}
					>Download PDF</a>
				{:else}
					<button class="viewer-share-item" type="button" disabled>
						Download PDF
					</button>
				{/if}

				{#if shareLinks}
					<a
						class="viewer-share-item"
						href={shareLinks.sharePath}
						target="_blank"
						rel="noopener noreferrer"
						onclick={closeShare}
					>Open share link</a>
				{:else}
					<button class="viewer-share-item" type="button" disabled>
						Open share link
					</button>
				{/if}
				<button
					class="viewer-share-item"
					type="button"
					disabled={!shareLinks}
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
		gap: 4px;
	}

	.home-icon {
		flex-shrink: 0;
	}

	.home-label {
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

	.slide-nav-pill {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(6px);
		overflow: hidden;
	}

	.nav-pill-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border: none;
		border-radius: 0;
		background: transparent;
		color: #f2fbff;
		cursor: pointer;
		transition: background 0.12s ease;
	}

	.nav-pill-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.18);
	}

	.nav-pill-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.slide-counter {
		color: #f5faff;
		font-size: 12px;
		font-weight: 700;
		min-width: 48px;
		text-align: center;
		letter-spacing: 0.02em;
		padding: 0 2px;
		user-select: none;
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

	.share-backdrop {
		display: none;
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

	/* ── Tablet (≤980px) ─────────────────────────────── */
	@media (max-width: 980px) {
		.viewer-toolbar {
			gap: 6px;
			padding: 6px 8px;
		}

		.viewer-menu-pills {
			display: none;
		}

		.viewer-project-context {
			display: none;
		}

		.viewer-project-row strong {
			max-width: 18vw;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			display: block;
		}

		.viewer-share-menu {
			right: 0;
			left: auto;
		}
	}

	/* ── Small screens, any orientation (≤680px) ───── */
	@media (max-width: 680px) {
		.viewer-toolbar {
			padding: 4px 6px;
			gap: 4px;
		}

		.viewer-project,
		.save-indicator {
			display: none;
		}

		.toolbar-btn,
		.history-btn {
			min-height: 44px;
			min-width: 44px;
			padding: 6px 10px;
			font-size: 14px;
		}

		.viewer-home-btn {
			min-width: 44px;
			height: 44px;
			padding: 0 10px;
		}

		.viewer-toolbar-middle {
			flex: 1;
			justify-content: center;
		}

		.slide-counter {
			font-size: 13px;
			min-width: 52px;
		}

		.viewer-share-toggle {
			min-width: 44px;
			padding: 6px 10px;
		}

		.share-caret {
			display: none;
		}

		/* bottom-sheet backdrop */
		.share-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.35);
			z-index: 7;
		}

		.viewer-share-menu {
			position: fixed;
			left: 8px;
			right: 8px;
			top: auto;
			bottom: 8px;
			width: auto;
			min-width: unset;
			padding: 10px;
			border-radius: 16px;
			box-shadow: 0 -8px 32px rgba(20, 35, 78, 0.28);
			z-index: 9;
		}

		.viewer-share-item {
			padding: 12px;
			font-size: 0.9rem;
			min-height: 44px;
			display: flex;
			align-items: center;
		}
	}

	/* ── Portrait phone (narrow + tall, ≤480px wide) ─ */
	@media (max-width: 480px) and (orientation: portrait) {
		.home-label {
			display: none;
		}

		.viewer-home-btn {
			padding: 0;
			min-width: 44px;
			justify-content: center;
		}

		.home-icon {
			width: 20px;
			height: 20px;
		}

		.viewer-toolbar-middle {
			gap: 2px;
		}

		.slide-counter {
			font-size: 12px;
			min-width: 44px;
		}

		.toolbar-nav {
			gap: 2px;
		}
	}

	/* ── Landscape phone (wide + short, ≤500px tall) ─ */
	@media (max-height: 500px) and (orientation: landscape) {
		.viewer-toolbar {
			padding: 2px 8px;
			gap: 6px;
		}

		.toolbar-btn,
		.history-btn {
			min-height: 36px;
			min-width: 36px;
			padding: 4px 8px;
		}

		.viewer-home-btn {
			height: 36px;
			min-width: auto;
			padding: 0 10px;
			font-size: 12px;
		}

		/* landscape has width — show project name truncated */
		.viewer-project {
			display: grid;
		}

		.viewer-project-row strong {
			max-width: 20vw;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			display: block;
			font-size: 0.78rem;
		}

		.save-indicator {
			display: inline-flex;
			font-size: 0.6rem;
			padding: 2px 6px;
		}

		.slide-counter {
			font-size: 12px;
			min-width: 50px;
		}

		.viewer-share-toggle {
			min-width: auto;
			padding: 4px 10px;
		}

		.viewer-share-item {
			padding: 8px;
			min-height: 36px;
		}
	}

	/* ── Tiny screens (≤360px, e.g. SE/mini) ──────── */
	@media (max-width: 360px) {
		.viewer-toolbar {
			padding: 3px 4px;
			gap: 2px;
		}

		.home-label {
			display: none;
		}

		.viewer-home-btn {
			min-width: 40px;
			height: 40px;
			padding: 0;
			justify-content: center;
		}

		.home-icon {
			width: 18px;
			height: 18px;
		}

		.toolbar-btn {
			min-height: 40px;
			min-width: 40px;
			padding: 4px 6px;
			font-size: 13px;
		}

		.slide-counter {
			font-size: 11px;
			min-width: 40px;
		}

		.viewer-share-toggle {
			min-width: 40px;
			padding: 4px 8px;
			font-size: 11px;
		}
	}
</style>
