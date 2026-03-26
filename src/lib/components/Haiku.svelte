<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { type HaikuSource, randomHaiku } from '$lib/haiku';

	interface Props {
		variant?: 'inline' | 'card' | 'ghost';
		lang?: 'nl' | 'en';
	}

	let { variant = 'ghost', lang }: Props = $props();

	const enabled = env.PUBLIC_FEATURE_HAIKU === 'true'
		|| env.PUBLIC_FEATURE_HAIKU === '1';

	const haiku = $derived(enabled ? randomHaiku(lang) : undefined);

	const sourceLabels: Record<HaikuSource, { nl: string; en: string }> = {
		classic: { nl: 'klassiek', en: 'classic' },
		free_translation: { nl: 'vrije vertaling', en: 'free translation' },
		original: { nl: 'origineel', en: 'original' },
		uncertain: { nl: 'onzekere bron', en: 'uncertain source' },
	};

	function sourceLabel(source: HaikuSource, haikuLang: 'nl' | 'en'): string {
		return sourceLabels[source][haikuLang];
	}

	function provenanceLabel(haikuLang: 'nl' | 'en'): string {
		return haikuLang === 'nl' ? 'Bron' : 'Source';
	}
</script>

{#if haiku}
	<figure class="haiku {variant}" lang={haiku.lang}>
		<blockquote>
			{#each haiku.lines as line, i (i)}
				<p>{line}</p>
			{/each}
		</blockquote>
		<figcaption>
			{#if haiku.author}— {haiku.author}{/if}
			{#if haiku.author}
				·
			{/if}
			{provenanceLabel(haiku.lang)}: {sourceLabel(haiku.source, haiku.lang)}
		</figcaption>
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
		font-size: 0.75rem;
	}

	.inline {
		color: var(--muted);
		padding: 0.5rem 0;
	}

	.card {
		color: var(--text);
		background: var(--card);
		border: 1px solid var(--card-border);
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 1.5rem;
	}
</style>
