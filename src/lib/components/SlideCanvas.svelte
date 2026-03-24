<script lang="ts">
	import { swipeable } from '$lib/actions/swipeable.ts';
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import {
		goToSlide,
		nextSlide,
		prevSlide,
		setChatTarget,
		viewer,
	} from '$lib/stores/viewer.svelte.ts';

	let canvasEl: HTMLDivElement | undefined = $state();

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData);
	const current = $derived(viewer.currentSlide);

	function trackTransform(): string {
		if (!canvasEl) return 'translate3d(0, 0, 0)';
		const width = canvasEl.clientWidth || 1;
		return `translate3d(${-current * width}px, 0, 0)`;
	}

	/** Recompute track position on resize. */
	function handleResize(): void {
		// Trigger reactivity — the template re-reads trackTransform()
		goToSlide(current);
	}

	function handleCanvasClick(event: MouseEvent): void {
		if (!(event.target instanceof HTMLElement)) return;
		const target = event.target.closest('[data-ai-target]');
		if (!target) return;

		const aiTarget = target.getAttribute('data-ai-target');
		const aiLabel = target.getAttribute('data-ai-label') ?? aiTarget;
		if (aiTarget) {
			setChatTarget({ target: aiTarget, label: aiLabel ?? aiTarget });
		}
	}
</script>

<svelte:window onresize={handleResize} />

<div class="slide-stage">
	<div
		class="slide-canvas"
		bind:this={canvasEl}
		use:swipeable={{ onPrev: prevSlide, onNext: nextSlide }}
		onclick={handleCanvasClick}
	>
		<div
			class="slide-track"
			style:transform={trackTransform()}
		>
			{#each slides as slide, index (index)}
				<section
					class="slide-page"
					class:is-active={index === current}
					class:is-prev={index === current - 1}
					class:is-next={index === current + 1}
					data-slide-index={index}
				>
					<SlideRenderer {slide} {theme} {deckData} slideWidth={1020} />
				</section>
			{/each}
		</div>
	</div>
</div>

<style>
	.slide-stage {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		overflow: hidden;
	}

	.slide-canvas {
		width: min(94%, calc((100vh - 120px) * 16 / 9));
		aspect-ratio: 16 / 9;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 24px 54px rgba(15, 31, 56, 0.24);
		position: relative;
		border: 1px solid #d2dbe9;
		background: #fff;
		touch-action: pan-y;
		user-select: none;
		cursor: grab;
	}

	.slide-canvas:global(.is-dragging) {
		cursor: grabbing;
	}

	.slide-track {
		height: 100%;
		display: flex;
		width: 100%;
		transform: translate3d(0, 0, 0);
		transition: transform 420ms cubic-bezier(0.2, 0.75, 0.14, 1);
		will-change: transform;
	}

	.slide-canvas:global(.is-dragging) .slide-track {
		transition: none;
	}

	.slide-page {
		container-type: inline-size;
		flex: 0 0 100%;
		width: 100%;
		height: 100%;
		padding: 0;
		display: flex;
		align-items: stretch;
		justify-content: center;
		opacity: 0.92;
		transform: scale(0.985);
		transition: transform 320ms ease, opacity 320ms ease;
	}

	.slide-page.is-active {
		opacity: 1;
		transform: scale(1);
	}
</style>
