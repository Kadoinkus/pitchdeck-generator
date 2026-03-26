<script lang="ts">
	import { page } from '$app/state';
	import type { ThemeInput } from '$lib/slides/core/theme';
	import { themeVars } from '$lib/slides/core/theme';
	import type { SlideData } from '$lib/slides/core/utils';
	import type { Snippet } from 'svelte';

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
	const footerIsEditable = $derived(page.route.id === '/editor');
</script>

<article class="slide-render" {style}>
	<div class="deck-slide {modeClass} {textMode} {slideType}-slide">
		<section class="deck-content">
			{@render children()}
		</section>
		<footer
			class="deck-footer"
			data-footer-brand={footerIsEditable ? 'true' : undefined}
			contenteditable={footerIsEditable ? 'plaintext-only' : 'false'}
			spellcheck={footerIsEditable ? false : undefined}
		>
			{brandName}
		</footer>
	</div>
</article>

<style>
	.slide-render {
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		position: relative;
		overflow: hidden;
		container-type: inline-size;
		text-align: start;
	}

	.deck-slide {
		--ref-w: 1020px;
		--ref-h: calc(var(--ref-w) * 9 / 16);
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
		width: var(--ref-w);
		height: var(--ref-h);
		zoom: calc(100cqi / var(--ref-w));
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

	/* Panel base + variants (used by many child components) */
	.deck-slide :global(.panel) {
		border: 1px solid var(--line);
		border-radius: clamp(12px, 1.2cqi, 18px);
		padding: clamp(12px, 1.2cqi, 18px);
		background: var(--surface);
		box-shadow: var(--shadow);
		min-width: 0;
		overflow: hidden;
	}

	.deck-slide :global(.panel.is-solid) {
		background: var(--surface);
	}

	.deck-slide :global(.panel.is-soft) {
		background: var(--surface-soft);
	}

	.deck-slide :global(.panel.is-outlined) {
		background: transparent;
		box-shadow: none;
	}

	.deck-slide :global(.panel.is-dark) {
		background: var(--deck-secondary, #0b6e6c);
		border-color: color-mix(
			in srgb,
			var(--deck-accent, #30d89e) 34%,
			var(--deck-secondary, #0b6e6c)
		);
		color: #f4fffc;
	}

	.deck-slide :global(.panel.is-dark p),
	.deck-slide :global(.panel.is-dark li),
	.deck-slide :global(.panel.is-dark .paragraph) {
		color: rgba(244, 255, 252, 0.92);
	}

	.deck-slide :global(.panel.is-transparent) {
		border: none;
		background: transparent;
		box-shadow: none;
		padding: 0;
		border-radius: 0;
		overflow: visible;
	}

	/* Text surface */
	.deck-slide :global(.text-surface) {
		display: grid;
		align-content: start;
		gap: clamp(8px, 0.9cqi, 12px);
		min-width: 0;
	}

	.deck-slide :global(.panel.text-surface) {
		border: none;
		background: transparent;
		box-shadow: none;
		padding: 0;
	}

	.deck-slide :global(.paragraph) {
		margin: 0;
		font-size: clamp(14px, 1.05cqi, 17px);
		line-height: 1.36;
		color: var(--muted);
	}

	.deck-slide :global(.bullet-list) {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: clamp(5px, 0.6cqi, 8px);
	}

	.deck-slide :global(.bullet-list li) {
		font-size: clamp(13px, 0.95cqi, 16px);
		line-height: 1.34;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.deck-slide :global(.bullet-list.with-icons li) {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: start;
		gap: 7px;
	}

	/* Layout classes */
	.deck-slide :global(.stack-layout) {
		display: grid;
		gap: clamp(10px, 1.2cqi, 15px);
		min-height: 0;
	}

	.deck-slide :global(.split-layout) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(10px, 1.2cqi, 15px);
		min-height: 0;
		align-items: stretch;
	}

	.deck-slide :global(.split-layout > *) {
		min-width: 0;
		min-height: 0;
	}

	.deck-slide :global(.split-layout > .text-surface) {
		align-content: center;
	}

	.deck-slide :global(.grid-3) {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(8px, 0.9cqi, 12px);
	}

	.deck-slide :global(.grid-4) {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: clamp(8px, 0.9cqi, 12px);
	}

	.deck-slide :global(.grid-2x2) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(8px, 0.9cqi, 12px);
	}

	/* Cover layout */
	.deck-slide :global(.cover-layout) {
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
		gap: clamp(12px, 1.3cqi, 20px);
		min-height: 0;
	}

	.deck-slide :global(.cover-copy) {
		display: grid;
		align-content: center;
		gap: clamp(8px, 0.8cqi, 12px);
		min-height: 0;
	}

	.deck-slide :global(.cover-layout.stack-layout) {
		grid-template-columns: 1fr;
	}

	.deck-slide :global(.cover-visual) {
		min-height: 0;
		display: grid;
		align-content: center;
	}

	.deck-slide :global(.meta-pills) {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.deck-slide :global(.meta-pills span) {
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface-soft);
		padding: 7px 12px;
		font-size: 12px;
		font-weight: 600;
		color: var(--muted);
	}

	.deck-slide :global(.meta-url) {
		margin: 0;
		font-size: 12px;
		color: var(--muted);
	}

	/* Utility: line clamping */
	.deck-slide :global(.fit-lines-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.deck-slide :global(.fit-lines-3) {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Text mode clamping */
	.deck-slide.text-mode-clamp :global(.headline-title),
	.deck-slide.text-mode-clamp :global(.headline-subtitle),
	.deck-slide.text-mode-clamp :global(.paragraph) {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.deck-slide.text-mode-clamp :global(.headline-title) {
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.deck-slide.text-mode-clamp :global(.headline-subtitle) {
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.deck-slide.text-mode-clamp :global(.paragraph) {
		-webkit-line-clamp: 5;
		line-clamp: 5;
	}

	/* AI clickable */
	.deck-slide :global(.ai-clickable) {
		transition: outline-color 120ms ease;
		outline: 2px solid transparent;
		outline-offset: -2px;
	}

	@media (hover: hover) {
		.deck-slide :global(.ai-clickable:hover) {
			outline-color: color-mix(
				in srgb,
				var(--deck-accent, #30d89e) 55%,
				transparent
			);
		}
	}

	/* Summary panel — accent callout style */
	.deck-slide :global(.summary-panel) {
		border-left: 3px solid var(--deck-accent, #30d89e);
		display: grid;
		align-content: center;
		gap: clamp(4px, 0.5cqi, 8px);
	}

	.deck-slide :global(.summary-panel h2) {
		margin: 0;
		font-size: clamp(9px, 0.7cqi, 12px);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--deck-accent, #30d89e);
	}

	.deck-slide :global(.summary-panel p) {
		margin: 0;
		font-family: var(--deck-heading, "Sora", sans-serif);
		font-size: clamp(15px, 1.15cqi, 22px);
		line-height: 1.28;
		color: var(--text);
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Short card */
	.deck-slide :global(.short-card) {
		padding: clamp(10px, 1cqi, 14px);
	}

	.deck-slide :global(.short-card p),
	.deck-slide :global(.feature-card p),
	.deck-slide :global(.team-card p),
	.deck-slide :global(.timeline-card p),
	.deck-slide :global(.impact-card p) {
		margin: 0;
		font-size: clamp(13px, 0.95cqi, 16px);
		line-height: 1.32;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.deck-slide :global(.card-index) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface-soft);
		color: var(--muted);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		padding: 4px 7px;
	}

	/* Panel h2 shared across feature/deliverable/pricing/timeline */
	.deck-slide :global(.feature-card h2),
	.deck-slide :global(.deliverable-card h2),
	.deck-slide :global(.pricing-card h2),
	.deck-slide :global(.timeline-card h2) {
		margin: 0 0 6px;
		font-family: var(--deck-heading, "Sora", sans-serif);
		font-size: clamp(17px, 1.25cqi, 24px);
		line-height: 1.1;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* What layout */
	.deck-slide :global(.what-layout) {
		grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
	}

	.deck-slide :global(.what-layout.stack-layout) {
		grid-template-columns: 1fr;
	}

	/* Buddy layout */
	.deck-slide :global(.buddy-layout > .text-surface) {
		align-content: center;
	}

	/* Tone */
	.deck-slide :global(.tone-list) {
		display: grid;
		gap: 10px;
	}

	.deck-slide :global(.tone-row) {
		display: grid;
		grid-template-columns: 80px 1fr;
		align-items: center;
		gap: 12px;
	}

	.deck-slide :global(.tone-row span) {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--muted);
		text-align: right;
	}

	.deck-slide :global(.tone-track) {
		height: 10px;
		border-radius: 999px;
		background: var(--surface-soft);
		border: 1px solid var(--line);
		overflow: hidden;
	}

	.deck-slide :global(.tone-track i) {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			var(--deck-primary, #004b49),
			var(--deck-accent, #30d89e)
		);
	}

	/* Flow panel */
	.deck-slide :global(.flow-panel) {
		display: grid;
		gap: 10px;
	}

	.deck-slide :global(.flow-list),
	.deck-slide :global(.vertical-steps) {
		display: grid;
		gap: 7px;
	}

	.deck-slide :global(.flow-step) {
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface-soft);
		padding: 8px 10px;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 8px;
		align-items: center;
	}

	.deck-slide :global(.flow-step span) {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--deck-primary, #004b49);
		color: #fff;
		font-size: 11px;
		font-weight: 700;
	}

	.deck-slide :global(.flow-step p) {
		margin: 0;
		font-size: 13px;
		line-height: 1.25;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Interaction layout */
	.deck-slide :global(.interaction-layout) {
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
	}

	.deck-slide :global(.interaction-layout.stack-layout) {
		grid-template-columns: 1fr;
	}

	.deck-slide :global(.device-panel) {
		background: color-mix(in srgb, var(--surface-soft) 68%, #ffffff);
	}

	/* Chat */
	.deck-slide :global(.chat-thread) {
		display: grid;
		gap: 8px;
	}

	.deck-slide :global(.chat-bubble) {
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 8px 10px;
		max-width: 88%;
		background: #fff;
	}

	.deck-slide.mode-dark :global(.chat-bubble) {
		background: rgba(255, 255, 255, 0.12);
	}

	.deck-slide :global(.chat-bubble.is-assistant) {
		justify-self: end;
		background: color-mix(in srgb, var(--deck-accent, #30d89e) 15%, #ffffff);
	}

	.deck-slide.mode-dark :global(.chat-bubble.is-assistant) {
		background: color-mix(
			in srgb,
			var(--deck-accent, #30d89e) 30%,
			rgba(255, 255, 255, 0.1)
		);
	}

	.deck-slide :global(.chat-bubble strong) {
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.deck-slide :global(.chat-bubble p) {
		margin: 4px 0 0;
		font-size: 13px;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Impact layout */
	.deck-slide :global(.impact-layout .headline-title) {
		max-width: 14ch;
	}

	.deck-slide :global(.impact-card) {
		text-align: center;
		display: grid;
		place-items: center;
		min-height: 86px;
	}

	.deck-slide :global(.impact-card p) {
		font-size: clamp(15px, 1.1cqi, 18px);
		font-weight: 600;
	}

	/* Deliverable */
	.deck-slide :global(.deliverable-grid .deliverable-card) {
		display: grid;
		gap: 8px;
		align-content: start;
	}

	.deck-slide :global(.deliverable-card ul),
	.deck-slide :global(.pricing-card ul) {
		margin: 0;
		padding-left: 1rem;
		display: grid;
		gap: 5px;
	}

	.deck-slide :global(.deliverable-card li),
	.deck-slide :global(.pricing-card li) {
		font-size: clamp(12px, 0.9cqi, 14px);
		line-height: 1.28;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Pricing */
	.deck-slide :global(.pricing-grid) {
		align-items: start;
	}

	.deck-slide :global(.pricing-grid .pricing-card) {
		position: relative;
		min-height: 0;
		display: grid;
		grid-template-rows: auto auto auto;
		align-content: start;
		gap: clamp(6px, 0.6cqi, 10px);
		padding: clamp(12px, 1.2cqi, 18px);
		padding-top: clamp(16px, 1.4cqi, 22px);
	}

	.deck-slide :global(.pricing-card .pricing-accent) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		border-radius: clamp(12px, 1.2cqi, 18px) clamp(12px, 1.2cqi, 18px) 0 0;
		background: linear-gradient(
			90deg,
			var(--deck-accent, #30d89e),
			color-mix(
				in srgb,
				var(--deck-primary, #004b49) 60%,
				var(--deck-accent, #30d89e)
			)
		);
		opacity: 0.5;
	}

	.deck-slide :global(.pricing-card.is-featured .pricing-accent) {
		height: 5px;
		opacity: 1;
	}

	.deck-slide :global(.pricing-card.is-dark .pricing-accent) {
		background: linear-gradient(
			90deg,
			var(--deck-accent, #30d89e),
			rgba(255, 255, 255, 0.4)
		);
		opacity: 0.6;
	}

	.deck-slide :global(.pricing-badge) {
		position: absolute;
		top: clamp(10px, 1cqi, 14px);
		right: clamp(10px, 1cqi, 14px);
		font-size: clamp(8px, 0.6cqi, 10px);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 3px 8px;
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			var(--deck-accent, #30d89e),
			color-mix(
				in srgb,
				var(--deck-primary, #004b49) 50%,
				var(--deck-accent, #30d89e)
			)
		);
		color: #fff;
		line-height: 1.3;
	}

	.deck-slide :global(.pricing-card .price) {
		margin: 0;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface-soft);
		padding: 8px 12px;
		font-family: var(--deck-heading, "Sora", sans-serif);
		font-size: clamp(18px, 1.6cqi, 28px);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.deck-slide :global(.pricing-card.is-featured) {
		border-width: 2px;
		border-color: var(--deck-primary, #004b49);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	.deck-slide :global(.pricing-card.is-dark) {
		background: var(--deck-secondary, #0b6e6c);
		color: #f4fffc;
		border-color: color-mix(
			in srgb,
			var(--deck-accent, #30d89e) 38%,
			var(--deck-secondary, #0b6e6c)
		);
	}

	.deck-slide :global(.pricing-card.is-dark .price) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.22);
		color: #f4fffc;
	}

	.deck-slide :global(.pricing-card.is-dark li) {
		color: rgba(244, 255, 252, 0.92);
	}

	.deck-slide :global(.pricing-card li) {
		display: flex;
		align-items: baseline;
		gap: clamp(4px, 0.4cqi, 7px);
		list-style: none;
	}

	.deck-slide :global(.pricing-card ul) {
		padding-left: 0;
		gap: clamp(3px, 0.3cqi, 5px);
		margin-top: clamp(2px, 0.3cqi, 4px);
	}

	.deck-slide :global(.pricing-card .check-icon) {
		flex-shrink: 0;
		width: clamp(11px, 0.85cqi, 14px);
		height: clamp(11px, 0.85cqi, 14px);
		color: var(--deck-accent, #30d89e);
	}

	.deck-slide :global(.pricing-card.is-dark .check-icon) {
		color: var(--deck-accent, #30d89e);
	}

	/* Timeline */
	.deck-slide :global(.timeline-grid .timeline-card) {
		display: grid;
		gap: 6px;
	}

	/* Closing layout */
	.deck-slide :global(.closing-layout) {
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
	}

	.deck-slide :global(.closing-copy) {
		display: grid;
		gap: 10px;
		align-content: start;
	}

	.deck-slide :global(.contact-lines) {
		display: grid;
		gap: 5px;
	}

	.deck-slide :global(.contact-lines p) {
		margin: 0;
		font-size: 13px;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.deck-slide :global(.closing-right) {
		display: grid;
		gap: 10px;
		min-height: 0;
	}

	.deck-slide :global(.team-card h2) {
		margin: 0;
		font-size: clamp(13px, 1cqi, 16px);
		line-height: 1.2;
		font-family: var(--deck-heading, "Sora", sans-serif);
	}

	/* Problem slide specifics */
	.deck-slide :global(.problem-slide .short-card) {
		display: grid;
		align-content: start;
		gap: 7px;
	}

	.deck-slide :global(.problem-slide .ratio-4-3 .image-frame) {
		aspect-ratio: 16 / 9;
	}

	/* Business impact slide specifics */
	.deck-slide :global(.business-impact-slide .impact-card) {
		gap: 8px;
	}

	/* Panel card with icon */
	.deck-slide :global(.panel-card-with-icon) {
		display: grid;
		align-content: center;
		gap: 8px;
	}

	.deck-slide :global(.panel-card-with-icon h2),
	.deck-slide :global(.panel-card-with-icon p) {
		text-align: center;
	}

	/* Panel hero icon */
	.deck-slide :global(.panel-hero-icon) {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
	}
</style>
