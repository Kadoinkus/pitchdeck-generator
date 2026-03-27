<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import { ensureItems, fitList, fitText } from '$lib/slides/core/utils';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const steps = $derived(
		fitList(
			ensureItems(slide.steps, [
				'Greeting',
				'Discovery',
				'Suggestions',
				'Personalization',
				'Conversion',
			]),
			6,
			48,
		),
	);
</script>

<Frame {slide} {theme}>
	<div class="split-layout">
		<article class="text-surface text-panel">
			<TitlePanel
				kicker="Chat Flow"
				title="Conversation Logic That Converts"
				accentPhrase="Converts"
				{target}
				compact
				asPanel={false}
				variant="transparent"
			/>
			<p class="paragraph">
				Every conversation follows a clear structure to reduce friction and move users to the right
				next action.
			</p>
			<ul class="bullet-list">
				<li>Intent routing with context memory</li>
				<li>Simple decision points and transitions</li>
				<li>Escalation path for human handoff</li>
			</ul>
		</article>
		<article
			class="panel flow-panel"
			data-ai-target={target}
			data-ai-label="{slide.title} steps"
		>
			<div class="vertical-steps">
				{#each steps as step, i (i)}
					<div class="flow-step">
						<span>{i + 1}</span>
						<p>{fitText(step, 44)}</p>
					</div>
				{/each}
			</div>
			<ImageSlot
				{slide}
				{deckData}
				target="imagePrompts"
				label="Chat flow image"
				helper="Step-based funnel illustration"
				ratio={RATIO_4_3}
			/>
		</article>
	</div>
</Frame>
