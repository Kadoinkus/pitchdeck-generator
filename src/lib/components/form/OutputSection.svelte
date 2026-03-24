<script lang="ts">
	import { getDeckResult, setStatus } from '$lib/stores/editor.svelte.ts';

	interface Props {
		onOpenViewer: () => void;
	}

	let { onOpenViewer }: Props = $props();

	const result = $derived(getDeckResult());
	const hasResult = $derived(Boolean(result?.downloadUrl));

	async function copyShareLink() {
		if (!result?.shareUrl) return;
		try {
			await navigator.clipboard.writeText(result.shareUrl);
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
			{#if hasResult}
				Deck ready. Open viewer, export files, or share web link.
			{:else}
				Generate a deck to unlock links and exports.
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
		<a
			class="ghost-link"
			class:disabled={!result?.downloadUrl}
			href={result?.downloadUrl || '#'}
		>
			Download .pptx
		</a>

		<a
			class="ghost-link"
			class:disabled={!result?.pdfUrl}
			href={result?.pdfUrl || '#'}
			target="_blank"
			rel="noopener"
		>
			Download PDF
		</a>

		<a
			class="ghost-link"
			class:disabled={!result?.shareUrl}
			href={result?.shareUrl || '#'}
			target="_blank"
			rel="noopener"
		>
			Open share page
		</a>
		<button
			type="button"
			class="ghost"
			disabled={!result?.shareUrl}
			onclick={copyShareLink}
		>
			Copy share link
		</button>
	</div>
</section>
