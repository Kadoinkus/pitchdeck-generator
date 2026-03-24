<script lang="ts">
	/**
	 * Renders an inline SVG icon from the icon registry.
	 * Replaces `renderIcon()` from icons.ts.
	 */
	import { getIconPaths, resolveIconSize } from '$lib/slides/core/icons';

	interface IconProps {
		name: string;
		size?: string | number;
		className?: string;
		label?: string;
	}

	let { name, size = 'md', className = '', label = '' }: IconProps = $props();

	const paths = $derived(getIconPaths(name));
	const px = $derived(resolveIconSize(size));
	const ariaHidden = $derived(label ? 'false' : 'true');
</script>

<span
	class="deck-icon {className}"
	style:--icon-size="{px}px"
	aria-hidden={ariaHidden}
	aria-label={label || undefined}
	role={label ? 'img' : undefined}
>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#each paths as pathData, index (`${name}-${index}`)}
			<path d={pathData} />
		{/each}
	</svg>
</span>

<style>
	.deck-icon {
		--icon-size: 22px;
		width: var(--icon-size);
		height: var(--icon-size);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--icon-primary, var(--deck-primary, #004b49));
		flex: 0 0 auto;
	}

	.deck-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	:global(.icon-inline) {
		margin-right: 7px;
		color: var(--icon-accent, var(--deck-accent, #30d89e));
		vertical-align: -3px;
	}

	:global(.icon-muted) {
		color: var(
			--icon-muted,
			color-mix(in srgb, var(--deck-primary, #004b49) 65%, #7f93aa)
		);
	}

	:global(.icon-accent) {
		color: var(--icon-accent, var(--deck-accent, #30d89e));
	}

	:global(.icon-panel) {
		color: var(--icon-accent, var(--deck-accent, #30d89e));
		--icon-size: clamp(44px, 4.2cqi, 72px);
	}
</style>
