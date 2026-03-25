<script lang="ts">
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import { viewer } from '$lib/stores/viewer.svelte';

	let thumbsEl: HTMLDivElement | undefined = $state();

	const slides = $derived(viewer.slideData?.slides ?? []);
	const theme = $derived(viewer.slideData?.theme);
	const deckData = $derived(viewer.slideData ?? undefined);

	/**
	 * Auto-scroll active thumbnail into view on slide change.
	 * Uses scrollTo instead of scrollIntoView so the container's
	 * padding is always visible around the active thumbnail.
	 */
	$effect(() => {
		void viewer.currentSlide;
		if (!thumbsEl) return;
		const el = thumbsEl.querySelector<HTMLElement>('.thumb.active');
		if (!el) return;

		const cs = getComputedStyle(thumbsEl);
		const isVertical = cs.flexDirection === 'column';

		if (isVertical) {
			const padTop = parseFloat(cs.paddingTop);
			const padBottom = parseFloat(cs.paddingBottom);
			const elTop = el.offsetTop - thumbsEl.offsetTop;
			const elBottom = elTop + el.offsetHeight;
			const viewTop = thumbsEl.scrollTop;
			const viewBottom = viewTop + thumbsEl.clientHeight;

			if (elTop - padTop < viewTop) {
				thumbsEl.scrollTo({ top: elTop - padTop, behavior: 'smooth' });
			} else if (elBottom + padBottom > viewBottom) {
				thumbsEl.scrollTo({
					top: elBottom + padBottom - thumbsEl.clientHeight,
					behavior: 'smooth',
				});
			}
		} else {
			const padLeft = parseFloat(cs.paddingLeft);
			const padRight = parseFloat(cs.paddingRight);
			const elLeft = el.offsetLeft - thumbsEl.offsetLeft;
			const elRight = elLeft + el.offsetWidth;
			const viewLeft = thumbsEl.scrollLeft;
			const viewRight = viewLeft + thumbsEl.clientWidth;

			if (elLeft - padLeft < viewLeft) {
				thumbsEl.scrollTo({ left: elLeft - padLeft, behavior: 'smooth' });
			} else if (elRight + padRight > viewRight) {
				thumbsEl.scrollTo({
					left: elRight + padRight - thumbsEl.clientWidth,
					behavior: 'smooth',
				});
			}
		}
	});
</script>

<div class="thumbnails" bind:this={thumbsEl}>
	{#each slides as slide, index (index)}
		<button
			class="thumb"
			class:active={index === viewer.currentSlide}
			type="button"
			onclick={() => viewer.goToSlide(index)}
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
		display: block;
		width: 100%;
		padding: 0;
		background: none;
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

	/* Hide empty image placeholders — unreadable noise at thumbnail scale */
	.thumb-inner :global(.image-slot:not(:has(.has-image))) {
		visibility: hidden;
	}

	@media (max-width: 680px) {
		.thumbnails {
			flex-direction: row;
			width: 100%;
			height: 72px;
			padding: 6px;
			overflow-x: auto;
			overflow-y: hidden;
			scroll-snap-type: x mandatory;
		}

		.thumb {
			flex: 0 0 auto;
			width: 108px;
			scroll-snap-align: center;
		}
	}
</style>
