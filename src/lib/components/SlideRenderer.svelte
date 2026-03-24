<script lang="ts">
	import { renderSlide } from '$lib/slides/index.ts';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types.ts';

	let { slide, theme, deckData }: {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	} = $props();
</script>

{@html renderSlide(slide, theme, deckData)}
