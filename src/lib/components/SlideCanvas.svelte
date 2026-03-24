<script lang="ts">
	import Haiku from '$lib/components/Haiku.svelte';
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import {
		goToSlide,
		nextSlide,
		prevSlide,
		setChatTarget,
		viewer,
	} from '$lib/stores/viewer.svelte';

	let canvasEl: HTMLDivElement | undefined = $state();

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData ?? undefined);
	const current = $derived(viewer.currentSlide);

	/* ── Sync store → scroll position ─────────────────────────── */

	let programmaticScroll = false;

	$effect(() => {
		const el = canvasEl;
		if (!el) return;

		const target = current * el.clientWidth;
		if (Math.abs(el.scrollLeft - target) > 2) {
			programmaticScroll = true;
			el.scrollTo({ left: target, behavior: 'smooth' });
		}
	});

	/* ── Sync scroll position → store ─────────────────────────── */

	let scrollTimer: ReturnType<typeof setTimeout> | undefined;

	function handleScroll(): void {
		if (programmaticScroll) return;
		const el = canvasEl;
		if (!el || !el.clientWidth) return;

		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => {
			const idx = Math.round(el.scrollLeft / el.clientWidth);
			if (idx !== current && idx >= 0 && idx < slides.length) {
				goToSlide(idx);
			}
		}, 60);
	}

	function handleScrollEnd(): void {
		programmaticScroll = false;
	}

	/* ── Mouse-wheel → horizontal navigation ─────────────────── */

	let wheelAccum = 0;
	let wheelLastAt = 0;
	let wheelCooldownUntil = 0;

	function handleWheel(event: WheelEvent): void {
		if (event.ctrlKey || event.metaKey || event.altKey) return;

		const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
			? event.deltaX
			: event.deltaY;
		if (Math.abs(delta) < 2) return;

		event.preventDefault();

		const now = performance.now();
		if (now < wheelCooldownUntil) return;
		if (now - wheelLastAt > 260) wheelAccum = 0;
		if (Math.sign(wheelAccum) !== Math.sign(delta)) wheelAccum = 0;

		wheelLastAt = now;
		wheelAccum += delta;

		if (Math.abs(wheelAccum) >= 115) {
			if (wheelAccum > 0) nextSlide();
			else prevSlide();
			wheelAccum = 0;
			wheelCooldownUntil = now + 380;
		}
	}

	/* ── AI target click ─────────────────────────────────────── */

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
			bind:this={canvasEl}
			onscroll={handleScroll}
			onscrollend={handleScrollEnd}
			onwheel={handleWheel}
			onclick={handleCanvasClick}
			onkeydown={handleCanvasKeydown}
		>
			{#each slides as slide, index (index)}
				<section
					class="slide-portal"
					class:is-active={index === current}
					data-slide-index={index}
				>
					<SlideRenderer {slide} {theme} {deckData} />
				</section>
			{/each}
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

	.slide-stage.empty {
		opacity: 0.5;
	}

	.slide-canvas {
		width: min(94%, calc((100vh - 120px) * 16 / 9));
		aspect-ratio: 16 / 9;
		position: relative;

		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;

		/* hide scrollbar */
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.slide-canvas::-webkit-scrollbar {
		display: none;
	}

	.slide-portal {
		scroll-snap-align: start;
		flex-shrink: 0;
		width: 100%;
		height: 100%;

		container-type: inline-size;
		overflow: hidden;
		background: #fff;
		box-shadow: 0 24px 54px rgba(15, 31, 56, 0.24);
		border: 1px solid #d2dbe9;
	}
</style>
