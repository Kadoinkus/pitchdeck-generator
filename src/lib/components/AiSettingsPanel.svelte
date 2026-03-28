<script lang="ts">
	import { getDefaultConfig } from '$lib/ai/config';
	import { PROVIDER_IDS, type ProviderId, PROVIDERS } from '$lib/ai/registry';
	import { ai } from '$lib/stores/ai.svelte';

	interface Props {
		onClose?: () => void;
	}

	let { onClose }: Props = $props();

	let providerId = $state<ProviderId>(ai.config?.providerId ?? 'openai');
	let modelId = $state(ai.config?.modelId ?? '');
	let baseURL = $state(ai.config?.baseURL ?? '');
	let apiKey = $state(ai.config?.apiKey ?? '');
	let customModel = $state('');

	const provider = $derived(PROVIDERS[providerId]);
	const models = $derived(provider.models);
	const showCustomModel = $derived(
		models.length === 0 || !(models as readonly string[]).includes(modelId),
	);

	// Intentionally does NOT preserve apiKey (unlike ai.setProvider) because
	// the settings panel exposes a dedicated API key field that the user
	// controls independently per provider.
	function handleProviderChange() {
		const defaults = getDefaultConfig(providerId);
		modelId = defaults.modelId;
		baseURL = defaults.baseURL;
		customModel = '';
	}

	function handleSave() {
		const finalModelId = showCustomModel && customModel ? customModel : modelId;
		ai.update({
			providerId,
			modelId: finalModelId,
			baseURL,
			apiKey,
		});
		onClose?.();
	}

	function handleClear() {
		ai.clear();
		onClose?.();
	}
</script>

<div class="settings-panel">
	<h3>AI Settings</h3>

	<label class="field">
		<span>Provider</span>
		<select bind:value={providerId} onchange={handleProviderChange}>
			{#each PROVIDER_IDS as id (id)}
				<option value={id}>{PROVIDERS[id].label}</option>
			{/each}
		</select>
	</label>

	{#if models.length > 0}
		<label class="field">
			<span>Model</span>
			<select bind:value={modelId}>
				{#each models as model (model)}
					<option value={model}>{model}</option>
				{/each}
				<option value="">Custom...</option>
			</select>
		</label>
	{/if}

	{#if showCustomModel}
		<label class="field">
			<span>Custom Model ID</span>
			<input
				type="text"
				bind:value={customModel}
				placeholder="e.g. gpt-4-turbo"
			>
		</label>
	{/if}

	<label class="field">
		<span>Base URL</span>
		<input
			type="url"
			bind:value={baseURL}
			placeholder={provider.defaultBaseURL || 'https://...'}
		>
	</label>

	{#if provider.requiresKey}
		<label class="field">
			<span>API Key</span>
			<input type="password" bind:value={apiKey} placeholder={provider.keyPlaceholder}>
		</label>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={handleClear}>Clear</button>
		<button type="button" class="primary" onclick={handleSave}>Save</button>
	</div>
</div>

<style>
	.settings-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 20px;
	}

	h3 {
		margin: 0 0 8px;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
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
		font-size: 0.9rem;
	}

	select:focus,
	input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--input-focus-shadow);
	}

	.actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 8px;
	}

	button {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	button.primary {
		background: var(--accent);
		color: white;
	}

	button.secondary {
		background: var(--subtle-bg);
		color: var(--muted);
	}

	button:hover {
		opacity: 0.9;
	}
</style>
