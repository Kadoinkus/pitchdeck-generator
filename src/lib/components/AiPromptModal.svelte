<script lang="ts">
	import { getDefaultConfig } from '$lib/ai/config';
	import { PROVIDER_IDS, type ProviderId, PROVIDERS } from '$lib/ai/registry';
	import { ai } from '$lib/stores/ai.svelte';

	interface Props {
		onClose: () => void;
		onOpenSettings?: () => void;
	}

	let { onClose, onOpenSettings }: Props = $props();

	let providerId = $state<ProviderId>('openai');
	let apiKey = $state('');

	function handleSave() {
		const defaults = getDefaultConfig(providerId);
		ai.update({
			...defaults,
			apiKey,
		});
		onClose();
	}

	function handleSkip() {
		onClose();
	}

	function handleSettings() {
		onOpenSettings?.();
		onClose();
	}
</script>

<div
	class="modal-backdrop"
	role="presentation"
	onclick={handleSkip}
	onkeydown={(e) => e.key === 'Escape' && handleSkip()}
>
	<dialog
		class="modal"
		aria-labelledby="modal-title"
		open
		onclick={(e) => e.stopPropagation()}
	>
		<h2 id="modal-title">Connect AI Provider</h2>
		<p class="subtitle">
			Enter your API key to enable AI features, or skip to use the template engine.
		</p>

		<label class="field">
			<span>Provider</span>
			<select bind:value={providerId}>
				{#each PROVIDER_IDS.filter((id) => PROVIDERS[id].requiresKey) as id (id)}
					<option value={id}>{PROVIDERS[id].label}</option>
				{/each}
			</select>
		</label>

		<label class="field">
			<span>API Key</span>
			<input type="password" bind:value={apiKey} placeholder="sk-..." autofocus>
		</label>

		<div class="actions">
			<button type="button" class="link" onclick={handleSettings}>
				More options...
			</button>
			<div class="buttons">
				<button type="button" class="secondary" onclick={handleSkip}>
					Skip
				</button>
				<button
					type="button"
					class="primary"
					onclick={handleSave}
					disabled={!apiKey}
				>
					Connect
				</button>
			</div>
		</div>
	</dialog>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--card);
		border-radius: 16px;
		padding: 28px;
		width: 90%;
		max-width: 400px;
		box-shadow: var(--shadow);
	}

	h2 {
		margin: 0 0 8px;
		font-size: 1.25rem;
	}

	.subtitle {
		margin: 0 0 20px;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 16px;
	}

	.field span {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--muted);
	}

	select,
	input {
		padding: 10px 12px;
		border: 1px solid var(--input-border);
		border-radius: 8px;
		background: var(--input-bg);
		color: var(--text);
		font: inherit;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20px;
	}

	.buttons {
		display: flex;
		gap: 12px;
	}

	button {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	button.primary {
		background: var(--accent);
		color: white;
	}

	button.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.secondary {
		background: var(--subtle-bg);
		color: var(--muted);
	}

	button.link {
		background: none;
		padding: 0;
		color: var(--accent);
		font-weight: 500;
	}
</style>
