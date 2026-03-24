<script lang="ts">
	import { page } from '$app/state';
	import { swipeable } from '$lib/actions/swipeable.ts';
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let currentSlide = $state(0);
	let deckEl: HTMLDivElement | undefined = $state();
	let deckWidth = $state(0);
	let isPrintMode = $state(false);

	const slides = $derived(data.slideData.slides);
	const theme = $derived(data.slideData.theme);
	const total = $derived(slides.length);
	const title = $derived(data.slideData.project?.projectTitle ?? 'Pitch Deck');
	const subtitle = $derived(
		`Prepared for ${
			data.slideData.project?.clientName ?? 'Client'
		} \u00b7 ${total} slides`,
	);

	const atStart = $derived(currentSlide <= 0);
	const atEnd = $derived(currentSlide >= total - 1);

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

	function handleResize(): void {
		if (deckEl) deckWidth = deckEl.clientWidth;
	}

	const trackTransform = $derived.by(() => {
		const width = deckWidth || 1;
		return `translate3d(${-currentSlide * width}px, 0, 0)`;
	});

	onMount(() => {
		if (deckEl) deckWidth = deckEl.clientWidth;

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

<svelte:window onkeydown={handleKey} onresize={handleResize} />

<svelte:head>
	<title>{title} — Deck Share</title>
</svelte:head>

<header class="share-topbar">
	<div>
		<p class="share-kicker">Interactive Deck</p>
		<h1>{title}</h1>
		<p class="share-subtitle">{subtitle}</p>
	</div>
	<div class="share-actions">
		<span class="share-counter">{currentSlide + 1} / {total}</span>
		<a
			href={data.downloadUrl ?? undefined}
			download
			class:disabled={!data.downloadUrl}
			aria-disabled={!data.downloadUrl}
		>Download PPTX</a>
		<button type="button" onclick={() => window.print()}>Download PDF</button>
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
		use:swipeable={{ onPrev: prev, onNext: next }}
	>
		<div
			class="share-track"
			style:transform={trackTransform}
		>
			{#each slides as slide, index (index)}
				<section class="share-slide" class:is-active={index === currentSlide}>
					<div class="share-slide-frame" aria-label={`Slide ${index + 1}`}>
						<SlideRenderer
							{slide}
							{theme}
							deckData={data.slideData}
							slideWidth={1020}
						/>
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

<style>
	:global(:root) {
		--bg: #edf3ff;
		--card: #ffffff;
		--line: #cfddff;
		--text: #102347;
		--muted: #4f5f83;
		--accent: #00c4cc;
		--secondary: #7d2ae8;
		--topbar-h: 74px;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(html),
	:global(body) {
		height: 100%;
	}

	:global(body) {
		margin: 0;
		font-family: "Plus Jakarta Sans", "DM Sans", "Segoe UI", sans-serif;
		color: var(--text);
		background:
			radial-gradient(
				circle at 10% 8%,
				rgba(0, 196, 204, 0.14),
				transparent 32%
			),
			radial-gradient(
			circle at 92% 14%,
			rgba(125, 42, 232, 0.14),
			transparent 24%
		),
			var(--bg);
		overflow: hidden;
	}

	.share-topbar {
		height: var(--topbar-h);
		position: sticky;
		top: 0;
		z-index: 20;
		background: rgba(255, 255, 255, 0.92);
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
		color: #4562a6;
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
		background: #f4f8ff;
		border: 1px solid #d0def8;
		color: #2b4c78;
		font-size: 0.78rem;
		font-weight: 700;
	}

	.share-actions :global(a),
	.share-actions :global(button) {
		border: 1px solid #c8d9ff;
		border-radius: 999px;
		background: #fff;
		color: #184173;
		text-decoration: none;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		padding: 7px 12px;
		cursor: pointer;
	}

	.share-actions :global(a:hover),
	.share-actions :global(button:hover) {
		border-color: #9ab4eb;
		background: #f5f9ff;
	}

	.share-actions :global(.disabled) {
		opacity: 0.5;
		pointer-events: none;
	}

	.share-main {
		height: calc(100vh - var(--topbar-h));
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 0 10px;
	}

	.share-nav-btn {
		width: 42px;
		height: 42px;
		border-radius: 999px;
		border: 1px solid #c6d8ff;
		background: rgba(255, 255, 255, 0.92);
		color: #2c4f84;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 8px 18px rgba(11, 31, 77, 0.14);
	}

	.share-nav-btn:hover {
		background: #ffffff;
		border-color: #9ab8ef;
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
		transform: translate3d(0, 0, 0);
		transition: transform 420ms cubic-bezier(0.2, 0.75, 0.14, 1);
		will-change: transform;
	}

	.share-slide {
		flex: 0 0 100%;
		min-height: 100%;
		padding: 18px 8px;
		display: grid;
		place-items: center;
		opacity: 0.93;
		transform: scale(0.985);
		transition: transform 320ms ease, opacity 320ms ease;
	}

	.share-slide.is-active {
		opacity: 1;
		transform: scale(1);
	}

	.share-slide-frame {
		--slide-w: 1020px;

		container-type: inline-size;
		width: min(94vw, calc((100vh - var(--topbar-h) - 54px) * 1.78));
		aspect-ratio: 16 / 9;
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--line);
		background: var(--card);
		box-shadow: 0 22px 48px rgba(11, 31, 77, 0.2);
	}

	.share-slide-frame > :global(.slide-render) {
		width: var(--slide-w);
		height: calc(var(--slide-w) * 9 / 16);
		zoom: tan(atan2(100cqi, var(--slide-w)));
	}

	.share-slide :global(.ai-clickable) {
		cursor: default;
	}

	.share-slide :global(.ai-clickable:hover) {
		box-shadow: none;
	}

	:global(.print-mode) .share-nav-btn {
		display: none;
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
		min-height: auto;
		padding: 0 0 12px;
	}

	:global(.print-mode) .share-slide-frame {
		width: 100%;
		max-width: none;
	}

	@media (max-width: 980px) {
		:global(:root) {
			--topbar-h: 104px;
		}

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
			padding: 8px 0;
		}

		.share-slide-frame {
			width: 100%;
		}
	}

	@media print {
		:global(body) {
			background: #fff;
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
			min-height: auto;
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
