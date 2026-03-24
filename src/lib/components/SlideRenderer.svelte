<script lang="ts">
	import SlideRenderer from '$lib/slides/SlideRenderer.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types.ts';

	let { slide, theme, deckData }: {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	} = $props();
</script>

<SlideRenderer {slide} {theme} {deckData} />
