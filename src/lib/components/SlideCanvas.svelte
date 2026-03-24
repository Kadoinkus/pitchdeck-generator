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

	let deckEl: HTMLDivElement | undefined = $state();
	let deckWidth = $state(0);
	let dragOffset = $state(0);

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData ?? undefined);
	const current = $derived(viewer.currentSlide);

	const SLIDE_GAP = 24;

	const trackTransform = $derived.by(() => {
		const width = deckWidth || 1;
		return `translate3d(${
			-current * (width + SLIDE_GAP) + dragOffset
		}px, 0, 0)`;
	});

	function handleResize(): void {
		if (deckEl) deckWidth = deckEl.clientWidth;
	}

	$effect(() => {
		if (deckEl) deckWidth = deckEl.clientWidth;
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

<svelte:window onresize={handleResize} />

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
		transform: translate3d(0, 0, 0);
		transition: transform 420ms cubic-bezier(0.2, 0.75, 0.14, 1);
		will-change: transform;
	}

	.slide-stage:global(.is-dragging) .slide-track {
		transition: none;
	}

	.slide-page {
		flex: 0 0 100%;
		min-height: 100%;
		padding: 18px 8px;
		display: grid;
		place-items: center;
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
