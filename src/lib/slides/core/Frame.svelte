<script lang="ts">
	/**
	 * Outer slide wrapper with theme CSS variables and footer.
	 * Replaces `renderFrame()` from components.ts.
	 */
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
