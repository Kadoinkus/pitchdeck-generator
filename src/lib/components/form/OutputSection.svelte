<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { toAbsoluteUrl } from '$lib/routing/share-links';
	import { getDeckResult, isPublishStale, setStatus } from '$lib/stores/editor.svelte';

	interface Props {
		onOpenViewer: () => void;
	}

	let { onOpenViewer }: Props = $props();

	const result = $derived(getDeckResult());
	const token = $derived(result?.shareToken ?? null);
	const hasResult = $derived(Boolean(token));
	const stale = $derived(hasResult && isPublishStale());

	async function copyShareLink() {
		if (!token) return;
		try {
			const sharePath = resolve('/share/[token]', { token });
			const absoluteUrl = toAbsoluteUrl(
				sharePath,
				page.url.origin,
			);
			await navigator.clipboard.writeText(absoluteUrl);
			setStatus('Share link copied.');
		} catch {
			setStatus(
				'Could not copy link. Copy manually from Open share page.',
				true,
			);
		}
	}
</script>

<section class="form-section output-section">
	<div class="section-head compact">
		<h2>Output</h2>
		<p>
			{#if stale}
				Content changed since last publish. Republish to update links.
			{:else if hasResult}
				Deck published. Open viewer, export files, or share web link.
			{:else}
				Publish a deck to unlock links and exports.
			{/if}
		</p>
	</div>
	<div class="output-actions">
		<button
			type="button"
			class="ghost-link"
			class:disabled={!hasResult}
			onclick={onOpenViewer}
			disabled={!hasResult}
		>
			Open viewer
		</button>
		{#if token}
			<a class="ghost-link" href={resolve('/api/download/[token]', { token })}>
				Download .pptx
			</a>

			<a
				class="ghost-link"
				href={resolve('/api/pdf/[token]', { token })}
				target="_blank"
				rel="noopener"
			>
				Download PDF
			</a>

			<a
				class="ghost-link"
				href={resolve('/share/[token]', { token })}
				target="_blank"
				rel="noopener"
			>
				Open share page
			</a>
		{:else}
			<button class="ghost-link" type="button" disabled>Download .pptx</button>
			<button class="ghost-link" type="button" disabled>Download PDF</button>
			<button class="ghost-link" type="button" disabled>Open share page</button>
		{/if}
		<button
			type="button"
			class="ghost"
			disabled={!token}
			onclick={copyShareLink}
		>
			Copy share link
		</button>
	</div>
</section>

<style>
	.output-section {
		background: linear-gradient(160deg, var(--card-bg-subtle), var(--card));
	}

	.output-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	@media (max-width: 760px) {
		.output-actions {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
