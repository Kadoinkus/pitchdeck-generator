<script lang="ts">
	import { createSwipeable } from '$lib/actions/swipeable.svelte';
	import Haiku from '$lib/components/Haiku.svelte';
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import {
		markDirty,
		pushHistory,
		setPayloadField,
	} from '$lib/stores/editor.svelte';
	import { viewer } from '$lib/stores/viewer.svelte';
	import { Spring } from 'svelte/motion';

	let deckEl: HTMLDivElement | undefined = $state();
	let deckWidth = $state(0);
	let dragOffset = $state(0);
	let dragging = $state(false);
	let isResizing = $state(false);

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData ?? undefined);
	const current = $derived(viewer.currentSlide);

	const SLIDE_GAP = 24;
	const trackSpring = new Spring(0, { stiffness: 0.14, damping: 0.72 });
	const DEFAULT_BRAND_NAME = 'Notso AI';

	const swipe = createSwipeable(() => ({
		onPrev: viewer.prevSlide,
		onNext: viewer.nextSlide,
		onDrag: handleDrag,
	}));

	function normalizeFooterBrand(value: string): string {
		const compact = value.replace(/\s+/g, ' ').trim();
		return compact || DEFAULT_BRAND_NAME;
	}

	function updateFooterBrand(nextBrand: string): void {
		const currentBrand = normalizeFooterBrand(
			String(viewer.slideData?.theme?.brandName || DEFAULT_BRAND_NAME),
		);
		if (nextBrand === currentBrand) return;

		viewer.updateTheme({ brandName: nextBrand });
		setPayloadField('brandName', nextBrand);
		pushHistory();
		markDirty();
	}

	function slideBase(): number {
		return -current * ((deckWidth || 1) + SLIDE_GAP);
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
			// Seed spring at the visual drag-end position so the
			// animation to the final slide is seamless (no jump).
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

	/** Event delegation for [data-ai-target] children and editable footer.
	 *  Attached imperatively — the container is non-interactive (carousel region). */
	$effect(() => {
		const el = deckEl;
		if (!el) return;

		function resolveAiTarget(origin: EventTarget | null): boolean {
			if (!(origin instanceof HTMLElement)) return false;
			const hit = origin.closest('[data-ai-target]');
			if (!hit) return false;
			const aiTarget = hit.getAttribute('data-ai-target');
			const aiLabel = hit.getAttribute('data-ai-label') ?? aiTarget;
			if (aiTarget) {
				viewer.setChatTarget({ target: aiTarget, label: aiLabel ?? aiTarget });
				return true;
			}
			return false;
		}

		function getFooter(origin: EventTarget | null): HTMLElement | null {
			if (!(origin instanceof HTMLElement)) return null;
			return origin.closest<HTMLElement>('[data-footer-brand="true"]');
		}

		function onClick(e: MouseEvent): void {
			resolveAiTarget(e.target);
		}

		function onKeydown(e: KeyboardEvent): void {
			const footer = getFooter(e.target);
			if (footer) {
				if (e.key === 'Enter') {
					e.preventDefault();
					footer.blur();
					return;
				}
				if (e.key === 'Escape') {
					e.preventDefault();
					footer.textContent = normalizeFooterBrand(
						String(viewer.slideData?.theme?.brandName || DEFAULT_BRAND_NAME),
					);
					footer.blur();
					return;
				}
			}
			if (e.key !== 'Enter' && e.key !== ' ') return;
			if (resolveAiTarget(e.target)) {
				e.preventDefault();
			}
		}

		function onFocusout(e: FocusEvent): void {
			const footer = getFooter(e.target);
			if (!footer) return;
			const nextBrand = normalizeFooterBrand(footer.textContent ?? '');
			footer.textContent = nextBrand;
			updateFooterBrand(nextBrand);
		}

		el.addEventListener('click', onClick);
		el.addEventListener('keydown', onKeydown);
		el.addEventListener('focusout', onFocusout);
		return () => {
			el.removeEventListener('click', onClick);
			el.removeEventListener('keydown', onKeydown);
			el.removeEventListener('focusout', onFocusout);
		};
	});
</script>

{#if slides.length === 0}
	<div class="slide-stage empty">
		<Haiku variant="ghost" />
	</div>
{:else}
	<div
		class="slide-stage"
		bind:this={deckEl}
		role="region"
		aria-roledescription="carousel"
		aria-label="Slide deck — {slides.length} slides"
		aria-keyshortcuts="ArrowLeft ArrowRight"
		{@attach swipe.attach}
	>
		<div
			class="slide-track"
			style:transform={trackTransform}
		>
			{#each slides as slide, index (index)}
				<section
					class="slide-page"
					class:is-active={index === current}
					class:is-adjacent={Math.abs(index - current) === 1}
					aria-roledescription="slide"
					aria-label="Slide {index + 1} of {slides.length}"
					aria-hidden={index !== current}
					inert={index !== current ? true : undefined}
				>
					<div class="slide-frame" data-slide-index={index}>
						<SlideRenderer {slide} {theme} {deckData} />
					</div>
				</section>
			{/each}
		</div>
	</div>
{/if}

<style>
	.slide-stage {
		flex: 1;
		overflow: hidden;
		touch-action: pan-y;
	}

	.slide-stage.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.5;
	}

	.slide-page.is-active .slide-frame {
		cursor: grab;
	}

	.slide-page.is-active .slide-frame :global(.ai-clickable),
	.slide-page.is-active .slide-frame :global([data-ai-target]) {
		cursor: crosshair;
	}

	.slide-page.is-active .slide-frame :global(a),
	.slide-page.is-active .slide-frame :global(button),
	.slide-page.is-active .slide-frame :global([role="button"]),
	.slide-page.is-active .slide-frame :global([role="link"]),
	.slide-page.is-active .slide-frame :global(input),
	.slide-page.is-active .slide-frame :global(textarea),
	.slide-page.is-active .slide-frame :global(select),
	.slide-page.is-active .slide-frame :global(summary) {
		cursor: pointer;
	}

	.slide-page.is-active
		.slide-frame
		:global([contenteditable]:not([contenteditable="false"])) {
		cursor: text;
	}

	.slide-stage:global(.is-dragging) .slide-page.is-active .slide-frame {
		cursor: grabbing;
	}

	.slide-track {
		height: 100%;
		display: flex;
		gap: 24px;
		will-change: transform;
	}

	.slide-page {
		flex: 0 0 100%;
		min-height: 100%;
		padding: 18px 8px;
		display: grid;
		place-items: center;
		content-visibility: auto;
		contain-intrinsic-size: auto 100% auto 100%;
	}

	.slide-page.is-active,
	.slide-page.is-adjacent {
		content-visibility: visible;
	}

	.slide-frame {
		container-type: inline-size;
		width: min(94%, calc((100% - 36px) * 1));
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #fff;
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		user-select: none;
	}

	/*
	 * Landscape mobile: viewport height is small, so the 16:9 slide
	 * computed from width alone overflows vertically. Constrain width
	 * to what fits the available height.
	 *
	 * Budget: toolbar ~48px + thumbnail strip 72px + slide-page
	 * padding 36px + safety 4px ≈ 160px overhead. When thumbnails
	 * are hidden (≤400px height) the overhead drops to ~88px.
	 */
	@media (max-width: 680px) and (max-height: 500px) {
		.slide-frame {
			width: min(94%, calc((100dvh - 160px) * 16 / 9));
		}
	}

	@media (max-width: 680px) and (max-height: 400px) {
		.slide-frame {
			width: min(94%, calc((100dvh - 88px) * 16 / 9));
		}
	}

	/* dvh fallback for browsers without dynamic viewport units */
	@supports not (height: 1dvh) {
		@media (max-width: 680px) and (max-height: 500px) {
			.slide-frame {
				width: min(94%, calc((100vh - 160px) * 16 / 9));
			}
		}

		@media (max-width: 680px) and (max-height: 400px) {
			.slide-frame {
				width: min(94%, calc((100vh - 88px) * 16 / 9));
			}
		}
	}
</style>
