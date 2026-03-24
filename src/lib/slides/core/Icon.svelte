<script lang="ts">
	/**
	 * Renders an inline SVG icon from the icon registry.
	 * Replaces `renderIcon()` from icons.ts.
	 */
	import { getIconPaths, resolveIconSize } from './icons.ts';

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
		{@html paths}
	</svg>
</span>
