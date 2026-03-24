<script lang="ts">
	import { swipeable } from '$lib/actions/swipeable';
	import Haiku from '$lib/components/Haiku.svelte';
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import {
		nextSlide,
		prevSlide,
		setChatTarget,
		viewer,
	} from '$lib/stores/viewer.svelte';
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
		deckWidth = deckEl.clientWidth;
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
		ro.observe(deckEl);
		return () => {
			ro.disconnect();
			clearTimeout(resizeTimer);
		};
	});

	function resolveAiTarget(origin: EventTarget | null): void {
		if (!(origin instanceof HTMLElement)) return;
		const target = origin.closest('[data-ai-target]');
		if (!target) return;

		const aiTarget = target.getAttribute('data-ai-target');
		const aiLabel = target.getAttribute('data-ai-label') ?? aiTarget;
		if (aiTarget) {
			setChatTarget({ target: aiTarget, label: aiLabel ?? aiTarget });
		}
	}

	function handleCanvasClick(event: MouseEvent): void {
		resolveAiTarget(event.target);
	}

	function handleCanvasKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		resolveAiTarget(event.target);
	}
</script>

{#if slides.length === 0}
	<div class="slide-stage empty">
		<Haiku variant="ghost" />
	</div>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="slide-stage"
		bind:this={deckEl}
		use:swipeable={{
			onPrev: prevSlide,
			onNext: nextSlide,
			onDrag: handleDrag,
		}}
		onclick={handleCanvasClick}
		onkeydown={handleCanvasKeydown}
	>
		<div
			class="slide-track"
			style:transform={trackTransform}
		>
			{#each slides as slide, index (index)}
				<section
					class="slide-page"
					class:is-active={index === current}
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
		cursor: grab;
	}

	.slide-stage.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.5;
	}

	.slide-stage:global(.is-dragging) {
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

	.slide-page.is-active {
		content-visibility: visible;
	}

	.slide-frame {
		container-type: inline-size;
		width: min(94%, calc((100% - 36px) * 1));
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #fff;
		border: 1px solid #d2dbe9;
		box-shadow: 0 24px 54px rgba(15, 31, 56, 0.24);
		user-select: none;
	}
</style>
