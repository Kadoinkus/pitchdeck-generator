<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ThemeInput } from './theme.ts';
	import { themeVars } from './theme.ts';
	import type { SlideData } from './utils.ts';

	interface FrameProps {
		slide?: SlideData | null;
		theme?: ThemeInput | null;
		children: Snippet;
	}

	let { slide = null, theme = null, children }: FrameProps = $props();

	const modeClass = $derived(
		slide?.backgroundMode === 'dark' ? 'mode-dark' : 'mode-light',
	);
	const textMode = $derived(
		String(slide?.textMode || 'fit').toLowerCase() === 'clamp'
			? 'text-mode-clamp'
			: 'text-mode-fit',
	);
	const slideType = $derived(slide?.type || 'generic');
	const style = $derived(themeVars(theme));
	const brandName = $derived(theme?.brandName || 'Notso AI');
</script>

<article
	class="slide-render deck-slide {modeClass} {textMode} {slideType}-slide"
	{style}
>
	<section class="deck-content">
		{@render children()}
	</section>
	<footer class="deck-footer">{brandName}</footer>
</article>

<style>
	.slide-render {
		--ref-w: 1020px;

		width: var(--ref-w);
		height: calc(var(--ref-w) * 9 / 16);
		position: relative;
		container-type: inline-size;
		zoom: tan(atan2(100cqi, var(--ref-w)));
	}

	.deck-slide {
		--surface: #ffffff;
		--surface-soft: #f4f7fa;
		--line: rgba(10, 26, 46, 0.12);
		--muted: rgba(11, 29, 46, 0.74);
		--shadow: 0 12px 30px rgba(13, 27, 47, 0.08);
		--icon-primary: color-mix(
			in srgb,
			var(--deck-primary, #004b49) 80%,
			#6f8298
		);
		--icon-accent: var(--deck-accent, #30d89e);
		--icon-muted: color-mix(in srgb, var(--deck-primary, #004b49) 58%, #889ab0);

		background: var(--deck-bg, #f2f4f6);
		color: var(--deck-text, #0b1d2e);
		font-family: var(--deck-body, "Inter", sans-serif);
		padding: clamp(20px, 2.2cqi, 34px) clamp(22px, 2.6cqi, 42px)
			clamp(18px, 2cqi, 30px);
		display: grid;
		grid-template-rows: 1fr auto;
		gap: clamp(10px, 1.1cqi, 16px);
	}

	.deck-slide.mode-dark {
		--surface: rgba(255, 255, 255, 0.1);
		--surface-soft: rgba(255, 255, 255, 0.08);
		--line: rgba(255, 255, 255, 0.22);
		--muted: rgba(244, 255, 252, 0.88);
		--shadow: 0 14px 34px rgba(0, 0, 0, 0.25);
		--icon-primary: rgba(236, 255, 249, 0.9);
		--icon-accent: color-mix(in srgb, var(--deck-accent, #30d89e) 86%, #fff);
		--icon-muted: rgba(232, 248, 241, 0.8);

		background: var(--deck-secondary, #0b6e6c);
		color: #f4fffc;
	}

	.deck-content {
		min-height: 0;
		display: grid;
		gap: clamp(10px, 1.2cqi, 16px);
		align-content: stretch;
	}

	.deck-footer {
		font-size: 10px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--muted);
	}
</style>
