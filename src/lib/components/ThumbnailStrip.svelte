<script lang="ts">
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import { goToSlide, viewer } from '$lib/stores/viewer.svelte.ts';
	import { tick } from 'svelte';

	let thumbsEl: HTMLDivElement | undefined = $state();

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData);

	/** Auto-scroll active thumbnail into view on slide change. */
	$effect(() => {
		const _index = viewer.currentSlide;
		void _index;
		tick().then(() => {
			if (!thumbsEl) return;
			const active = thumbsEl.querySelector('.thumb.active');
			if (active) {
				active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		});
	});
</script>

<div class="thumbnails" bind:this={thumbsEl}>
	{#each slides as slide, index (index)}
		<button
			class="thumb"
			class:active={index === viewer.currentSlide}
			type="button"
			onclick={() => goToSlide(index)}
		>
			<span class="thumb-number">{index + 1}</span>
			<div class="thumb-inner">
				<SlideRenderer {slide} {theme} {deckData} />
			</div>
		</button>
	{/each}
</div>

<style>
	.thumbnails {
		width: var(--thumb-w);
		flex-shrink: 0;
		overflow-y: auto;
		scrollbar-width: none;
		padding: 14px 8px;
		display: flex;
		flex-direction: column;
		gap: 9px;
		background: rgba(247, 249, 252, 0.96);
	}

	.thumb {
		position: relative;
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		border: 2px solid transparent;
		transition: border-color 0.16s ease;
		flex-shrink: 0;
		box-shadow: 0 8px 18px rgba(15, 32, 58, 0.12);
	}

	.thumb.active {
		border-color: #29c492;
	}

	.thumb:hover:not(.active) {
		border-color: #97abc9;
	}

	.thumb-number {
		position: absolute;
		top: 4px;
		left: 6px;
		font-size: 10px;
		font-weight: 700;
		color: #2a4469;
		z-index: 1;
		background: rgba(255, 255, 255, 0.72);
		border-radius: 999px;
		padding: 2px 6px;
	}

	.thumb-inner {
		container-type: inline-size;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		position: relative;
		pointer-events: none;
	}

	.thumb-inner > :global(.slide-render) {
		width: var(--slide-w);
		height: var(--slide-h);
		zoom: tan(atan2(100cqi, var(--slide-w)));
	}
</style>
