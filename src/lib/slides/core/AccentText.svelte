<script lang="ts">
	/**
	 * Renders text with an optional accent phrase wrapped in `<span class="accent-text">`.
	 * Replaces the old `highlightTitle()` HTML string helper.
	 */

	interface AccentTextProps {
		text: string;
		accent?: string;
	}

	let { text, accent = '' }: AccentTextProps = $props();

	interface TextSegment {
		kind: 'plain' | 'accent';
		value: string;
	}

	const segments: TextSegment[] = $derived.by(() => {
		const t = String(text || '');
		const phrase = String(accent || '').trim();
		if (!phrase) return [{ kind: 'plain', value: t }];

		const index = t.toLowerCase().indexOf(phrase.toLowerCase());
		if (index < 0) return [{ kind: 'plain', value: t }];

		const result: TextSegment[] = [];
		const before = t.slice(0, index);
		const hit = t.slice(index, index + phrase.length);
		const after = t.slice(index + phrase.length);

		if (before) result.push({ kind: 'plain', value: before });
		result.push({ kind: 'accent', value: hit });
		if (after) result.push({ kind: 'plain', value: after });
		return result;
	});
</script>

{#each segments as seg (seg)}
	{#if seg.kind === 'accent'}
		<span class="accent-text">{seg.value}</span>
	{:else}
		{seg.value}
	{/if}
{/each}

<style>
	.accent-text {
		color: var(--deck-accent, #30d89e);
	}
</style>
