<script lang="ts">
	import { RATIO_4_3 } from '$lib/deck/types';
	import { getTargetField } from '$lib/slides/core/fields';
	import Frame from '$lib/slides/core/Frame.svelte';
	import ImageSlot from '$lib/slides/core/ImageSlot.svelte';
	import {
		ensureItems,
		findAssetForSlide,
		fitList,
		fitText,
	} from '$lib/slides/core/utils';
	import TitlePanel from '$lib/slides/panels/TitlePanel.svelte';
	import type { DeckData, SlideData, ThemeData } from '$lib/slides/types';

	interface Props {
		slide: SlideData;
		theme: ThemeData;
		deckData: DeckData;
	}

	let { slide, theme, deckData }: Props = $props();

	const target = $derived(getTargetField(slide));
	const lines = $derived(
		fitList(
			ensureItems(slide.messages, [
				'User: I need help picking the right option.',
				'Buddy: Great, what is your main priority?',
				'User: Comfort for long work sessions.',
				'Buddy: I recommend Comfort LX006. Want a quick comparison?',
			]),
			7,
			92,
		),
	);
	const hasVisual = $derived(
		Boolean(findAssetForSlide(slide, deckData)?.dataUrl) || !slide.hideImages,
	);
	const interactionLayoutClass = $derived(
		hasVisual
			? 'split-layout interaction-layout'
			: 'stack-layout interaction-layout',
	);

	interface ChatLine {
		speaker: string;
		content: string;
		bubbleClass: string;
	}

	const chatLines: ChatLine[] = $derived(
		lines.map((line) => {
			const text = String(line || '');
			const colonIndex = text.indexOf(':');
			const speaker = colonIndex > 0 ? text.slice(0, colonIndex).trim() : '';
			const content = colonIndex > 0 ? text.slice(colonIndex + 1).trim() : text;
			const bubbleClass = speaker.toLowerCase().includes('user')
				? 'is-user'
				: 'is-assistant';
			return { speaker, content, bubbleClass };
		}),
	);
</script>

<Frame {slide} {theme}>
	<div class="stack-layout">
		<TitlePanel
			kicker="Example Interaction"
			title="How The Experience Feels In Practice"
			accentPhrase="Feels In Practice"
			{target}
			align="center"
			variant="transparent"
		/>
		<div class={interactionLayoutClass}>
			<article
				class="panel device-panel"
				data-ai-target={target}
				data-ai-label="{slide.title} messages"
			>
				<div class="chat-thread">
					{#each chatLines as line, i (i)}
						<div class="chat-bubble {line.bubbleClass}">
							{#if line.speaker}
								<strong>{fitText(line.speaker, 20)}</strong>
							{/if}
							<p>{fitText(line.content, 82)}</p>
						</div>
					{/each}
				</div>
			</article>
			{#if hasVisual}
				<ImageSlot
					{slide}
					{deckData}
					target="imagePrompts"
					label="Example interaction image"
					helper="Phone/tablet interaction with mascot"
					ratio={RATIO_4_3}
					className="is-large"
				/>
			{/if}
		</div>
	</div>
</Frame>
