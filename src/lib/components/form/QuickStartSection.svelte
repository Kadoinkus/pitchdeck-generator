<script lang="ts">
	import { autofill } from '$lib/ai/client';
	import AiPromptModal from '$lib/components/AiPromptModal.svelte';
	import Haiku from '$lib/components/Haiku.svelte';
	import { ai } from '$lib/stores/ai.svelte';
	import {
		applyDraft,
		applyImageDraft,
		getPayload,
		getStatus,
		getTemplates,
		handleFieldChange,
		markDirty,
		pushHistory,
		setPayloadField,
		setStatus,
		type TemplateEntry,
	} from '$lib/stores/editor.svelte';
	import { onMount } from 'svelte';

	interface Props {
		onTemplateChange: (template: TemplateEntry) => void;
		onPublish: () => void;
	}

	let { onTemplateChange, onPublish }: Props = $props();

	let autofilling = $state(false);
	let generating = $state(false);
	let showPromptModal = $state(false);

	const payload = $derived(getPayload());
	const templates = $derived(getTemplates());
	const status = $derived(getStatus());

	onMount(() => ai.init());

	function handleTemplateSelect(event: Event) {
		const target = event.target;
		if (!(target instanceof HTMLSelectElement)) return;
		setPayloadField('templateId', target.value);
		const template = templates.find((t) => t.id === target.value);
		if (template) onTemplateChange(template);
		pushHistory();
		markDirty();
		setStatus(`Template selected: ${template?.label || target.value}`);
	}

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

	async function runAutofill() {
		if (ai.needsSetup) {
			showPromptModal = true;
			return;
		}

		autofilling = true;
		setStatus('AI is generating all slide text and image prompts...');
		try {
			const result = await autofill(ai.config, payload);
			applyDraft(result.draft);
			applyImageDraft(result.imageDraft);
			pushHistory();
			markDirty();
			setStatus('Autofill complete.');
		} catch (error) {
			console.error(error);
			setStatus(
				error instanceof Error ? error.message : 'Could not run AI autofill.',
				true,
			);
		} finally {
			autofilling = false;
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		generating = true;
		onPublish();
		generating = false;
	}
</script>

<section class="form-section">
	<div class="section-head">
		<h2>Quick Start</h2>
		<p>Designed for speed. Everything else is optional.</p>
	</div>
	<div class="section-grid quick-grid">
		<div class="field">
			<label for="templateId">Template</label>
			<select
				id="templateId"
				name="templateId"
				value={String(payload.templateId || '')}
				onchange={handleTemplateSelect}
			>
				{#each templates as template (template.id)}
					<option value={template.id} title={template.description}>
						{template.label}
					</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="clientName">Client name</label>
			<input
				id="clientName"
				name="clientName"
				value={String(payload.clientName || '')}
				oninput={handleInput('clientName')}
				onchange={handleInput('clientName')}
			>
		</div>
		<div class="field">
			<label for="clientUrl">Client URL</label>
			<input
				id="clientUrl"
				name="clientUrl"
				value={String(payload.clientUrl || '')}
				oninput={handleInput('clientUrl')}
				onchange={handleInput('clientUrl')}
			>
		</div>
		<div class="field">
			<label for="brandName">Brand</label>
			<input
				id="brandName"
				name="brandName"
				value={String(payload.brandName || '')}
				oninput={handleInput('brandName')}
				onchange={handleInput('brandName')}
			>
		</div>
		<div class="field">
			<label for="deckVersion">Version</label>
			<input
				id="deckVersion"
				name="deckVersion"
				value={String(payload.deckVersion || '')}
				oninput={handleInput('deckVersion')}
				onchange={handleInput('deckVersion')}
			>
		</div>
	</div>
	<div class="actions-row">
		<button
			id="ai-autofill"
			type="button"
			disabled={autofilling}
			onclick={runAutofill}
		>
			AI Autofill
		</button>
		<button
			id="publish-button"
			type="button"
			disabled={generating}
			onclick={handleSubmit}
		>
			Publish
		</button>
		<p class="status" class:error={status.isError}>{status.text}</p>
	</div>
	{#if autofilling}
		<Haiku variant="inline" />
	{/if}
	{#if showPromptModal}
		<AiPromptModal onClose={() => (showPromptModal = false)} />
	{/if}
</section>
