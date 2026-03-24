<script lang="ts">
	import {
		applyDraft,
		applyImageDraft,
		getDeckResult,
		getPayload,
		loadAiSettings,
		loadDraft,
		parseAssetsFromPayload,
		pushHistory,
		redo,
		restoreDeckResult,
		saveDraft,
		setProviders,
		setSaveState,
		setStatus,
		setTemplates,
		syncBrandPalette,
		undo,
	} from '$lib/stores/editor.svelte.ts';
	import {
		showViewer,
		viewer,
		type ViewerDeckData,
	} from '$lib/stores/viewer.svelte.ts';
	import { onMount } from 'svelte';

	import DeckForm from '$lib/components/form/DeckForm.svelte';
	import SlideViewer from '$lib/components/SlideViewer.svelte';

	function handleOpenViewer() {
		const result = getDeckResult();
		if (!result) return;
		const sd = result.slideData;
		if (!sd?.slides?.length) return;

		const data: ViewerDeckData = {
			slides: sd.slides.map((s) => ({ ...s })),
			theme: { ...sd.theme },
			project: sd.project,
		};
		showViewer(data, {
			downloadUrl: result.downloadUrl ?? null,
			pdfUrl: result.pdfUrl ?? null,
			shareUrl: result.shareUrl ?? null,
		});
	}

	function handleKeyboard(event: KeyboardEvent) {
		if (!event.metaKey && !event.ctrlKey) return;

		const target = event.target;
		if (target instanceof HTMLInputElement) return;
		if (target instanceof HTMLTextAreaElement) return;
		if (target instanceof HTMLSelectElement) return;
		if (target instanceof HTMLElement && target.isContentEditable) return;

		const key = event.key.toLowerCase();
		const wantsUndo = key === 'z' && !event.shiftKey;
		const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
		if (!wantsUndo && !wantsRedo) return;

		event.preventDefault();
		if (wantsUndo) {
			undo();
		} else {
			redo();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeyboard);
		bootstrap();

		return () => {
			document.removeEventListener('keydown', handleKeyboard);
		};
	});

	async function bootstrap() {
		setSaveState('is-saved');

		try {
			parseAssetsFromPayload();
			syncBrandPalette();

			// Load templates
			const templatesRes = await fetch('/api/templates');
			const templatesData = await templatesRes.json();
			if (
				templatesRes.ok && templatesData.success
				&& Array.isArray(templatesData.templates)
			) {
				setTemplates(templatesData.templates);
			}

			// Load AI providers
			const providersRes = await fetch('/api/ai/providers');
			const providersData = await providersRes.json();
			if (providersRes.ok && providersData.success && providersData.providers) {
				setProviders(
					providersData.providers.textProviders || [],
					providersData.providers.imageProviders || [],
				);
			}

			loadAiSettings();

			const restoredDraft = loadDraft();
			if (!restoredDraft) {
				// Run autofill on fresh start
				await runInitialAutofill();
			}

			restoreDeckResult();
			pushHistory();
			saveDraft(true);
		} catch (error) {
			console.error(error);
			setStatus(
				error instanceof Error ? error.message : 'Could not initialize editor.',
				true,
			);
			setSaveState('is-error');
		}
	}

	async function runInitialAutofill() {
		setStatus('AI is generating all slide text and image prompts...');
		try {
			const response = await fetch('/api/ai/autofill', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(getPayload()),
			});
			const result = await response.json();
			if (response.ok && result.success) {
				applyDraft(result.draft || {});
				applyImageDraft(result.imageDraft || {});
				setStatus(`Autofill complete (${result.provider || 'local'}).`);
			}
		} catch (error) {
			console.error(error);
		}
	}
</script>

<svelte:head>
	<title>Notso AI Pitch Deck Studio</title>
</svelte:head>

<div class="page">
	<header class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Notso AI Studio</p>
			<h1>Pitch Deck Generator</h1>
			<p class="intro">
				Minimal workflow: set client name + URL, let AI fill the deck, exclude
				slides, and export to PowerPoint, PDF, or shareable web link.
			</p>
		</div>
		<div class="hero-card">
			<strong>Flow</strong>
			<ol>
				<li>Client name + website</li>
				<li>AI autofill content + image prompts</li>
				<li>Exclude slides if needed</li>
				<li>Generate and share</li>
			</ol>
		</div>
	</header>

	<main class="layout single">
		<DeckForm onOpenViewer={handleOpenViewer} />
	</main>
</div>

{#if viewer.isOpen}
	<SlideViewer />
{/if}
