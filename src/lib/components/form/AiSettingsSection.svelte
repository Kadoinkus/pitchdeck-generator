<script lang="ts">
	import {
		getImageProviders,
		getPayload,
		getTextProviders,
		handleFieldChange,
		saveAiSettings,
		setPayloadField,
	} from '$lib/stores/editor.svelte';

	const payload = $derived(getPayload());
	const textProviders = $derived(getTextProviders());
	const imageProviders = $derived(getImageProviders());

	function handleInput(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (
				target instanceof HTMLInputElement
				|| target instanceof HTMLSelectElement
			) {
				setPayloadField(field, target.value);
				handleFieldChange(event.type === 'input');
			}
		};
	}
</script>

<details class="form-section">
	<summary>AI Provider Keys</summary>
	<div class="section-grid two-col">
		<div class="field">
			<label for="aiTextProvider">Text provider</label>
			<select
				id="aiTextProvider"
				name="aiTextProvider"
				value={String(payload.aiTextProvider || '')}
				onchange={handleInput('aiTextProvider')}
			>
				{#each textProviders as provider (provider.id)}
					<option value={provider.id}>{provider.label}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="aiTextModel">Text model</label>
			<input
				id="aiTextModel"
				name="aiTextModel"
				value={String(payload.aiTextModel || '')}
				oninput={handleInput('aiTextModel')}
				onchange={handleInput('aiTextModel')}
			>
		</div>
		<div class="field">
			<label for="aiTextApiKey">Text API key</label>
			<input
				id="aiTextApiKey"
				name="aiTextApiKey"
				type="password"
				autocomplete="off"
				value={String(payload.aiTextApiKey || '')}
				oninput={handleInput('aiTextApiKey')}
				onchange={handleInput('aiTextApiKey')}
			>
		</div>
		<div class="field">
			<label for="aiTextBaseUrl">Text base URL</label>
			<input
				id="aiTextBaseUrl"
				name="aiTextBaseUrl"
				value={String(payload.aiTextBaseUrl || '')}
				oninput={handleInput('aiTextBaseUrl')}
				onchange={handleInput('aiTextBaseUrl')}
			>
		</div>
		<div class="field">
			<label for="aiImageProvider">Image provider</label>
			<select
				id="aiImageProvider"
				name="aiImageProvider"
				value={String(payload.aiImageProvider || '')}
				onchange={handleInput('aiImageProvider')}
			>
				{#each imageProviders as provider (provider.id)}
					<option value={provider.id}>{provider.label}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="aiImageModel">Image model</label>
			<input
				id="aiImageModel"
				name="aiImageModel"
				value={String(payload.aiImageModel || '')}
				oninput={handleInput('aiImageModel')}
				onchange={handleInput('aiImageModel')}
			>
		</div>
		<div class="field">
			<label for="aiImageApiKey">Image API key</label>
			<input
				id="aiImageApiKey"
				name="aiImageApiKey"
				type="password"
				autocomplete="off"
				value={String(payload.aiImageApiKey || '')}
				oninput={handleInput('aiImageApiKey')}
				onchange={handleInput('aiImageApiKey')}
			>
		</div>
		<div class="field">
			<label for="aiImageBaseUrl">Image base URL</label>
			<input
				id="aiImageBaseUrl"
				name="aiImageBaseUrl"
				value={String(payload.aiImageBaseUrl || '')}
				oninput={handleInput('aiImageBaseUrl')}
				onchange={handleInput('aiImageBaseUrl')}
			>
		</div>
	</div>
	<div class="inline-actions">
		<button type="button" class="ghost" onclick={saveAiSettings}>
			Save locally
		</button>
	</div>
</details>
