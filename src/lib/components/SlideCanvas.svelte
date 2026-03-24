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

	let trackStep = $state(1);
	let dragOffset = $state(0);

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData ?? undefined);
	const current = $derived(viewer.currentSlide);

	const trackTransform = $derived(
		`translate3d(${-current * trackStep + dragOffset}px, 0, 0)`,
	);

	function updateCanvasMetrics(node: HTMLDivElement): void {
		const styles = getComputedStyle(node);
		const peek = Number.parseFloat(styles.getPropertyValue('--slide-peek'))
			|| 0;
		const gap = Number.parseFloat(styles.getPropertyValue('--slide-gap')) || 0;
		const width = node.clientWidth || 1;

		trackStep = Math.max(1, width - (peek * 2) + gap);
	}

	function canvasMetrics(node: HTMLDivElement): { destroy: () => void } {
		updateCanvasMetrics(node);

		const ro = new ResizeObserver(() => {
			updateCanvasMetrics(node);
		});
		ro.observe(node);

		return {
			destroy() {
				ro.disconnect();
			},
		};
	}

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
	<div class="slide-stage">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="slide-canvas"
			use:canvasMetrics
			use:swipeable={{
				onPrev: prevSlide,
				onNext: nextSlide,
				onDrag(delta) {
					dragOffset = delta;
				},
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
						class:is-prev={index === current - 1}
						class:is-next={index === current + 1}
						data-slide-index={index}
					>
						<SlideRenderer {slide} {theme} {deckData} />
					</section>
				{/each}
			</div>
		</div>
	</div>
{/if}

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
		--slide-gap: 0px;
		--slide-peek: 0px;

		width: min(94%, calc((100vh - 120px) * 16 / 9));
		aspect-ratio: 16 / 9;
		overflow: hidden;
		position: relative;
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
		gap: var(--slide-gap);
		padding-inline: 0;
		box-sizing: border-box;
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
		border-radius: 0;
		overflow: hidden;
		box-shadow: 0 24px 54px rgba(15, 31, 56, 0.24);
		border: 1px solid #d2dbe9;
		background: #fff;
	}
</style>
