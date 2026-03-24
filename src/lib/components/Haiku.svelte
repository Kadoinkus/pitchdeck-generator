<script lang="ts">
	import { PUBLIC_FEATURE_HAIKU } from '$env/static/public';
	import { randomHaiku } from '$lib/haiku';

	interface Props {
		variant?: 'inline' | 'card' | 'ghost';
		lang?: 'nl' | 'en';
	}

	let { variant = 'ghost', lang }: Props = $props();

	const enabled = PUBLIC_FEATURE_HAIKU === 'true'
		|| PUBLIC_FEATURE_HAIKU === '1';

	const haiku = $derived(enabled ? randomHaiku(lang) : undefined);
</script>

{#if haiku}
	<figure class="haiku {variant}" lang={haiku.lang}>
		<blockquote>
			{#each haiku.lines as line, i (i)}
				<p>{line}</p>
			{/each}
		</blockquote>
		{#if haiku.author}
			<figcaption>— {haiku.author}</figcaption>
		{/if}
	</figure>
{/if}

<style>
	.haiku {
		text-align: center;
		margin: 0;
		padding: 1rem 0;
	}

	blockquote {
		margin: 0;
		font-style: italic;
		line-height: 1.8;
	}

	blockquote p {
		margin: 0;
	}

	figcaption {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		font-style: normal;
	}

	/* ── Variants ── */

	.ghost {
		color: var(--muted);
	}

	.ghost figcaption {
		opacity: 0.7;
	}

	.inline {
		color: var(--muted);
		padding: 0.5rem 0;
	}

	.card {
		color: var(--text);
		background: var(--card);
		border: 1px solid rgba(130, 156, 212, 0.27);
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 1.5rem;
	}
</style>
