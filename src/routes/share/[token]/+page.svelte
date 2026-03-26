<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { swipeable } from '$lib/actions/swipeable';
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let currentSlide = $state(0);
	let deckEl: HTMLDivElement | undefined = $state();
	let deckWidth = $state(0);
	let dragOffset = $state(0);
	let dragging = $state(false);
	let isResizing = $state(false);
	let isPrintMode = $state(false);
	let canNativeShare = $state(false);
	let shareButtonLabel = $state('Share');

	const slides = $derived(data.slideData.slides);
	const theme = $derived(data.slideData.theme);
	const total = $derived(slides.length);
	const clientName = $derived(data.slideData.project?.clientName ?? 'Client');
	const title = $derived(data.slideData.project?.projectTitle ?? 'Pitch Deck');
	const pageTitle = $derived(`${title} — Deck Share`);
	const previewDescription = $derived(
		`View ${clientName}'s shared pitch deck with ${total} slides in Notso AI Deck Studio.`,
	);
	const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
	const previewImageUrl = $derived(
		new URL(asset('/social/deck-share-card.png'), page.url).href,
	);
	const siteName = 'Notso AI Deck Studio';
	const subtitle = $derived(
		`Prepared for ${clientName} \u00b7 ${total} slides`,
	);

	const atStart = $derived(currentSlide <= 0);
	const atEnd = $derived(currentSlide >= total - 1);

	const SLIDE_GAP = 20;
	const trackSpring = new Spring(0, { stiffness: 0.14, damping: 0.72 });

	function slideBase(): number {
		return -currentSlide * ((deckWidth || 1) + SLIDE_GAP);
	}

	function clampSlide(index: number): number {
		return Math.max(0, Math.min(index, total - 1));
	}

	function goToSlide(index: number): void {
		currentSlide = clampSlide(index);
	}

	function prev(): void {
		goToSlide(currentSlide - 1);
	}

	function next(): void {
		goToSlide(currentSlide + 1);
	}

	/** Animate or jump to the correct slide offset. */
	$effect(() => {
		const target = slideBase();
		if (dragging) return;
		if (isResizing) {
			trackSpring.set(target, { instant: true });
		} else {
			trackSpring.target = target;
		}
	});

	const trackTransform = $derived.by(() => {
		if (dragging) {
			return `translate3d(${slideBase() + dragOffset}px, 0, 0)`;
		}
		return `translate3d(${trackSpring.current}px, 0, 0)`;
	});

	function handleDrag(delta: number): void {
		if (delta !== 0) {
			dragging = true;
			dragOffset = delta;
		} else if (dragging) {
			trackSpring.set(slideBase() + dragOffset, { instant: true });
			dragOffset = 0;
			dragging = false;
		}
	}

	$effect(() => {
		if (!deckEl) return;
		const element = deckEl;
		deckWidth = element.clientWidth;
		if (typeof ResizeObserver === 'undefined') return;
		let resizeTimer: ReturnType<typeof setTimeout>;
		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			deckWidth = entry.contentRect.width;
			isResizing = true;
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				isResizing = false;
			}, 150);
		});
		ro.observe(element);
		return () => {
			ro.disconnect();
			clearTimeout(resizeTimer);
		};
	});

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

	function handleKey(event: KeyboardEvent): void {
		if (isPrintMode) return;
		if (event.defaultPrevented) return;
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		if (isEditableTarget(event.target)) return;

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				event.preventDefault();
				prev();
				return;
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
				event.preventDefault();
				next();
				return;
			case 'Home':
				event.preventDefault();
				goToSlide(0);
				return;
			case 'End':
				event.preventDefault();
				goToSlide(total - 1);
				return;
			case ' ':
			case 'Spacebar':
				if (isActionTarget(event.target)) return;
				event.preventDefault();
				if (event.shiftKey) prev();
				else next();
				return;
		}
	}

	async function handleShare(): Promise<void> {
		const shareData: ShareData = {
			title: title,
			text: `Check out this pitch deck: ${title}`,
			url: window.location.href,
		};

		const canUseNativeShare = typeof navigator.share === 'function'
			&& (typeof navigator.canShare !== 'function'
				|| navigator.canShare(shareData));

		if (canUseNativeShare) {
			try {
				await navigator.share(shareData);
			} catch (err) {
				// User cancelled the share — not an error
				if (err instanceof Error && err.name !== 'AbortError') {
					console.error('Share failed:', err);
				}
			}
		} else {
			// Clipboard fallback for unsupported browsers
			try {
				await navigator.clipboard.writeText(window.location.href);
				shareButtonLabel = 'Link copied!';
				setTimeout(() => {
					shareButtonLabel = 'Share';
				}, 2000);
			} catch {
				// Last resort: prompt the user
				prompt('Copy this link to share:', window.location.href);
			}
		}
	}

	onMount(() => {
		canNativeShare = typeof navigator.share === 'function';
		isPrintMode = page.url.searchParams.get('print') === '1';
		if (isPrintMode) {
			document.body.classList.add('print-mode');
			setTimeout(() => window.print(), 350);
		}

		return () => {
			document.body.classList.remove('print-mode');
		};
	});
</script>

<svelte:window onkeydown={handleKey} />

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={previewDescription}>
	<link rel="canonical" href={canonicalUrl}>

	<meta property="og:type" content="website">
	<meta property="og:site_name" content={siteName}>
	<meta property="og:title" content={pageTitle}>
	<meta property="og:description" content={previewDescription}>
	<meta property="og:url" content={canonicalUrl}>
	<meta property="og:image" content={previewImageUrl}>
	<meta property="og:image:alt" content={`Preview card for ${pageTitle}`}>

	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:title" content={pageTitle}>
	<meta name="twitter:description" content={previewDescription}>
	<meta name="twitter:image" content={previewImageUrl}>
	<meta name="twitter:image:alt" content={`Preview card for ${pageTitle}`}>
</svelte:head>

<div class="share-layout">
	<header class="share-topbar">
		<div>
			<p class="share-kicker">Interactive Deck</p>
			<h1>{title}</h1>
			<p class="share-subtitle">{subtitle}</p>
		</div>
		<div class="share-actions">
			<span class="share-counter" aria-live="polite" aria-atomic="true">{
					currentSlide + 1
				} / {total}</span>
			<button
				type="button"
				class="share-cta"
				onclick={handleShare}
				aria-label={shareButtonLabel === 'Share' ? 'Share this deck' : shareButtonLabel}
			>
				<svg
					aria-hidden="true"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					{#if canNativeShare}
						<!-- Share/export icon -->
						<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
						<polyline points="16 6 12 2 8 6" />
						<line x1="12" y1="2" x2="12" y2="15" />
					{:else}
						<!-- Link/copy icon -->
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					{/if}
				</svg>
				{shareButtonLabel}
			</button>
			{#if data.downloadUrl}
				<a
					href={resolve('/api/download/[token]', { token: data.token })}
					download
				>Download PPTX</a>
			{:else}
				<span class="disabled" aria-disabled="true">Download PPTX</span>
			{/if}
			<a href={resolve('/api/pdf/[token]', { token: data.token })}
			>Download PDF</a>
		</div>
	</header>

	<main class="share-main">
		<button
			class="share-nav-btn"
			type="button"
			aria-label="Previous slide"
			disabled={atStart}
			onclick={prev}
		>
			&#10094;
		</button>

		<div
			class="share-deck"
			bind:this={deckEl}
			role="region"
			aria-roledescription="carousel"
			aria-label="{title} — {total} slides"
			aria-keyshortcuts="ArrowLeft ArrowRight"
			style:--slide-gap={`${SLIDE_GAP}px`}
			use:swipeable={{
				onPrev: prev,
				onNext: next,
				onDrag: handleDrag,
			}}
		>
			<div
				class="share-track"
				style:transform={trackTransform}
			>
				{#each slides as slide, index (index)}
					<section
						class="share-slide"
						class:is-active={index === currentSlide}
						aria-roledescription="slide"
						aria-label={`Slide ${index + 1} of ${total}`}
						aria-hidden={index !== currentSlide}
						inert={index !== currentSlide ? true : undefined}
					>
						<div class="share-slide-frame">
							<SlideRenderer {slide} {theme} deckData={data.slideData} />
						</div>
					</section>
				{/each}
			</div>
		</div>

		<button
			class="share-nav-btn"
			type="button"
			aria-label="Next slide"
			disabled={atEnd}
			onclick={next}
		>
			&#10095;
		</button>
	</main>
</div>

<style>
	:global(html),
	:global(body) {
		height: 100%;
	}

	:global(body) {
		margin: 0;
		font-family: "Plus Jakarta Sans", "DM Sans", "Segoe UI", sans-serif;
		color: var(--text);
	}

	.share-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
	}

	.share-topbar {
		flex-shrink: 0;
		z-index: 20;
		background: var(--overlay-bg);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--line);
		padding: 10px 16px;
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: center;
	}

	.share-kicker {
		margin: 0;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.11em;
		color: var(--muted);
		font-weight: 800;
	}

	.share-topbar h1 {
		margin: 2px 0 0;
		font-size: 1.08rem;
		font-family: "Sora", "Plus Jakarta Sans", "Segoe UI", sans-serif;
	}

	.share-subtitle {
		margin: 2px 0 0;
		font-size: 0.8rem;
		color: var(--muted);
	}

	.share-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
	}

	.share-counter {
		display: inline-flex;
		align-items: center;
		height: 32px;
		padding: 0 11px;
		border-radius: 999px;
		background: var(--card-bg-subtle);
		border: 1px solid var(--line);
		color: var(--label-color);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.share-cta {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: linear-gradient(135deg, var(--accent), #00a8b0);
		color: #fff;
		text-decoration: none;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		padding: 7px 14px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 196, 204, 0.3);
		transition: box-shadow 180ms ease, transform 180ms ease;
	}

	@media (hover: hover) {
		.share-cta:hover {
			box-shadow: 0 4px 14px rgba(0, 196, 204, 0.45);
			transform: translateY(-1px);
		}
	}

	.share-cta:active {
		transform: translateY(0);
		box-shadow: 0 1px 4px rgba(0, 196, 204, 0.3);
	}

	.share-cta svg {
		flex-shrink: 0;
	}

	.share-actions :global(a),
	.share-actions :global(button:not(.share-cta)) {
		border: 1px solid var(--ghost-border);
		border-radius: 999px;
		background: var(--ghost-bg);
		color: var(--ghost-color);
		text-decoration: none;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		padding: 7px 12px;
		cursor: pointer;
	}

	@media (hover: hover) {
		.share-actions :global(a:hover),
		.share-actions :global(button:not(.share-cta):hover) {
			border-color: var(--input-focus-border);
			background: var(--card-bg-subtle);
		}
	}

	.share-actions :global(.disabled) {
		opacity: 0.5;
		pointer-events: none;
	}

	.share-main {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
	}

	.share-main > * {
		grid-row: 1;
		grid-column: 1;
	}

	.share-nav-btn {
		z-index: 2;
		align-self: center;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--overlay-bg);
		color: var(--label-color);
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--shadow);
	}

	.share-nav-btn:first-child {
		justify-self: start;
		margin-left: 16px;
	}

	.share-nav-btn:last-child {
		justify-self: end;
		margin-right: 16px;
	}

	@media (hover: hover) {
		.share-nav-btn:hover {
			background: var(--card);
			border-color: var(--input-focus-border);
		}
	}

	.share-nav-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.share-deck {
		height: 100%;
		overflow: hidden;
		touch-action: pan-y;
		cursor: grab;
	}

	.share-deck:global(.is-dragging) {
		cursor: grabbing;
	}

	.share-track {
		height: 100%;
		display: flex;
		gap: var(--slide-gap);
		will-change: transform;
	}

	.share-slide {
		flex: 0 0 100%;
		height: 100%;
		padding: 18px 8px;
		display: grid;
		place-items: center;
		/*
		 * Must be `size` (not `inline-size`) because the child
		 * .share-slide-frame uses both cqi and cqb units to fit
		 * the 16:9 slide within whatever dimensions are available.
		 */
		container-type: size;
		opacity: 0.93;
		transform: scale(0.985);
		transition: transform 320ms ease, opacity 320ms ease;
	}

	.share-slide.is-active {
		opacity: 1;
		transform: scale(1);
	}

	.share-slide-frame {
		container-type: inline-size;
		width: min(100cqi, calc(100cqb * 16 / 9));
		aspect-ratio: 16 / 9;
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--line);
		background: var(--card);
		box-shadow: var(--shadow);
		user-select: none;
	}

	.share-slide :global(.image-slot:not(:has(.has-image))) {
		visibility: hidden;
	}

	.share-slide :global(.ai-clickable) {
		cursor: default;
	}

	@media (hover: hover) {
		.share-slide :global(.ai-clickable:hover) {
			box-shadow: none;
		}
	}

	:global(.print-mode) .share-nav-btn {
		display: none;
	}

	:global(.print-mode) .share-layout {
		height: auto;
		overflow: visible;
	}

	:global(.print-mode) .share-main {
		display: block;
		padding: 0;
		height: auto;
	}

	:global(.print-mode) .share-deck {
		height: auto;
		overflow: visible;
	}

	:global(.print-mode) .share-track {
		display: block;
		transform: none;
	}

	:global(.print-mode) .share-slide {
		height: auto;
		container-type: normal;
		padding: 0 0 12px;
	}

	:global(.print-mode) .share-slide-frame {
		width: 100%;
		max-width: none;
	}

	@media (max-width: 980px) {
		.share-topbar {
			flex-wrap: wrap;
			align-items: flex-start;
			align-content: center;
		}

		.share-main {
			grid-template-columns: 1fr;
			gap: 8px;
			padding: 8px;
		}

		.share-nav-btn {
			display: none;
		}

		.share-slide {
			padding: 8px 4px;
		}
	}

	/* ── Small screens (≤680px) ───── */
	@media (max-width: 680px) {
		.share-topbar {
			padding: 8px 10px;
			gap: 4px;
		}

		.share-kicker {
			display: none;
		}

		.share-topbar h1 {
			font-size: 0.92rem;
			margin: 0;
		}

		.share-subtitle {
			display: none;
		}

		.share-actions {
			gap: 4px;
		}

		.share-actions :global(a),
		.share-actions :global(button:not(.share-cta)),
		.share-actions :global(.disabled) {
			font-size: 0.75rem;
			padding: 5px 10px;
			min-height: 44px;
			display: inline-flex;
			align-items: center;
		}

		.share-cta {
			font-size: 0.78rem;
			padding: 7px 12px;
			min-height: 44px;
		}

		.share-counter {
			display: none;
		}

		.share-main {
			padding: 4px;
		}

		.share-slide {
			padding: 6px 4px;
		}
	}

	/* ── Landscape: compact topbar to reclaim height ───── */
	@media (max-height: 500px) {
		.share-topbar {
			padding: 4px 10px;
			gap: 4px;
			flex-wrap: nowrap;
			align-items: center;
		}

		.share-kicker {
			display: none;
		}

		.share-topbar h1 {
			font-size: 0.82rem;
			margin: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.share-subtitle {
			display: none;
		}

		.share-actions {
			flex-wrap: nowrap;
			gap: 4px;
			flex-shrink: 0;
		}

		.share-actions :global(a),
		.share-actions :global(button:not(.share-cta)) {
			font-size: 0.72rem;
			padding: 4px 8px;
		}

		.share-cta {
			font-size: 0.72rem;
			padding: 4px 10px;
		}

		.share-slide {
			padding: 4px 4px;
		}
	}

	@media print {
		:global(body) {
			background: #fff;
			overflow: visible;
		}

		.share-layout {
			height: auto;
			overflow: visible;
		}

		.share-topbar {
			display: none;
		}

		.share-main {
			display: block;
			height: auto;
			padding: 0;
		}

		.share-deck {
			height: auto;
			overflow: visible;
		}

		.share-track {
			display: block;
			transform: none;
		}

		.share-slide {
			height: auto;
			container-type: normal;
			padding: 0;
			display: block;
			page-break-after: always;
		}

		.share-slide:last-child {
			page-break-after: auto;
		}

		.share-slide-frame {
			width: 100%;
			border-radius: 0;
			border: none;
			box-shadow: none;
		}
	}
</style>
