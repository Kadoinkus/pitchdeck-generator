<script lang="ts">
	import { resolve } from '$app/paths';
	import { getDeckResult, setStatus } from '$lib/stores/editor.svelte';

	interface Props {
		onOpenViewer: () => void;
	}

	let { onOpenViewer }: Props = $props();

	const result = $derived(getDeckResult());
	const token = $derived(result?.shareToken ?? null);
	const hasResult = $derived(Boolean(token));

	async function copyShareLink() {
		if (!token) return;
		try {
			const url = new URL(
				resolve('/share/[token]', { token }),
				window.location.origin,
			);
			await navigator.clipboard.writeText(url.toString());
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
			class:disabled={!token}
			href={token ? resolve('/api/download/[token]', { token }) : undefined}
		>
			Download .pptx
		</a>

		<a
			class="ghost-link"
			class:disabled={!token}
			href={token ? `${resolve('/share/[token]', { token })}?print=1` : undefined}
			target="_blank"
			rel="noopener"
		>
			Download PDF
		</a>

		<a
			class="ghost-link"
			class:disabled={!token}
			href={token ? resolve('/share/[token]', { token }) : undefined}
			target="_blank"
			rel="noopener"
		>
			Open share page
		</a>
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
		background: linear-gradient(160deg, #f7fbff, #eef6ff);
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
