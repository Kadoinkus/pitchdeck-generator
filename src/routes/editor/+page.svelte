<script lang="ts">
	import { pushState, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import {
		applyDraft,
		applyImageDraft,
		getDeckResult,
		getPayload,
		loadAiSettings,
		loadDraft,
		markDirty,
		parseAssetsFromPayload,
		pushHistory,
		redo,
		restoreDeckResult,
		saveDraft,
		setPayloadField,
		setProviders,
		setSaveState,
		setStatus,
		setTemplates,
		syncBrandPalette,
		undo,
	} from '$lib/stores/editor.svelte';
	import {
		hideViewer,
		showViewer,
		viewer,
		type ViewerDeckData,
		wasViewerOpen,
	} from '$lib/stores/viewer.svelte';
	import { onMount, tick } from 'svelte';

	import DeckForm from '$lib/components/form/DeckForm.svelte';
	import SlideViewer from '$lib/components/SlideViewer.svelte';

	function getViewerDeckData() {
		const result = getDeckResult();
		if (!result) return null;
		const sd = result.slideData;
		if (!sd?.slides?.length) return null;

		const data: ViewerDeckData = {
			slides: sd.slides.map((s) => ({ ...s })),
			theme: { ...sd.theme },
			project: sd.project,
		};

		return {
			data,
			shareToken: result.shareToken ?? null,
		};
	}

	function handleOpenViewer() {
		const payload = getViewerDeckData();
		if (!payload) return;

		pushState('', {
			...page.state,
			viewer: { open: true },
		});
	}

	const viewerPayload = $derived(getViewerDeckData());
	const projectName = $derived(
		(getPayload().projectTitle as string | undefined) || 'Untitled Deck',
	);

	function handleRename(name: string): void {
		setPayloadField('projectTitle', name);
		pushHistory();
		markDirty();
	}

	$effect(() => {
		const wantsViewerOpen = page.state.viewer?.open === true;

		if (wantsViewerOpen && !viewer.isOpen) {
			if (!viewerPayload) return;
			queueMicrotask(() => {
				if (page.state.viewer?.open !== true || viewer.isOpen) return;
				showViewer(viewerPayload.data, {
					shareToken: viewerPayload.shareToken,
				});
			});
			return;
		}

		if (!wantsViewerOpen && viewer.isOpen) {
			queueMicrotask(() => {
				if (page.state.viewer?.open === true || !viewer.isOpen) return;
				hideViewer();
			});
		}
	});

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
		bootstrap();
	});

	async function bootstrap() {
		setSaveState('is-saved');

		try {
			// Synchronous restores first — no flash of editor form
			loadAiSettings();
			const restoredDraft = loadDraft();
			parseAssetsFromPayload();
			syncBrandPalette();
			restoreDeckResult();
			pushHistory();
			saveDraft(true);

			// Reopen viewer immediately if it was open before reload
			const prev = wasViewerOpen();
			if (prev.open) {
				const payload = getViewerDeckData();
				if (payload) {
					// Defer until after SvelteKit's router has finished initializing —
					// onMount fires before start() sets router.initialized = true.
					await tick();
					replaceState('', {
						...page.state,
						viewer: { open: true },
					});
				}
			}

			// Async fetches — happen in background, don't block UI
			const [templatesRes, providersRes] = await Promise.all([
				fetch('/api/templates'),
				fetch('/api/ai/providers'),
			]);

			const templatesData = await templatesRes.json();
			if (
				templatesRes.ok && templatesData.success
				&& Array.isArray(templatesData.templates)
			) {
				setTemplates(templatesData.templates);
			}

			const providersData = await providersRes.json();
			if (providersRes.ok && providersData.success && providersData.providers) {
				setProviders(
					providersData.providers.textProviders || [],
					providersData.providers.imageProviders || [],
				);
			}

			if (!restoredDraft) {
				await runInitialAutofill();
			}
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

<svelte:window onkeydown={handleKeyboard} />

<svelte:head>
	<title>Notso AI Pitch Deck Studio</title>
</svelte:head>

<div class="page">
	<header class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Notso Canva</p>
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
	<SlideViewer {projectName} onRename={handleRename} />
{/if}

<style>
	.page {
		max-width: 1220px;
		margin: 0 auto;
		padding: 32px 18px 48px;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: 18px;
		margin-bottom: 18px;
	}

	.hero-copy h1 {
		margin: 8px 0 10px;
		font-family: "Sora", "DM Sans", sans-serif;
		font-size: clamp(2rem, 3.4vw, 2.8rem);
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	.eyebrow {
		margin: 0;
		font-family: "Pacifico", cursive;
		font-size: 24px;
		font-weight: 400;
		letter-spacing: 0.02em;
		background:
			radial-gradient(ellipse 60% 120% at 10% 70%, #00c4cc 0%, transparent 60%),
			radial-gradient(ellipse 50% 100% at 85% 30%, #6420ff 0%, transparent 50%),
			radial-gradient(ellipse 40% 90% at 45% 90%, #6420ff 0%, transparent 50%),
			linear-gradient(135deg, #7d2ae7, #6420ff);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
	}

	.intro {
		margin: 0;
		color: var(--muted);
		line-height: 1.55;
		max-width: 760px;
	}

	.hero-card {
		background: var(--card);
		border: 1px solid rgba(130, 156, 212, 0.27);
		border-radius: 18px;
		box-shadow: var(--shadow);
		padding: 16px 18px;
	}

	.hero-card strong {
		display: block;
		margin-bottom: 8px;
		font-family: "Sora", "DM Sans", sans-serif;
	}

	.hero-card ol {
		margin: 0;
		padding-left: 1rem;
		color: var(--muted);
		line-height: 1.58;
	}

	.layout.single {
		display: block;
	}

	@media (max-width: 1050px) {
		.hero {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 760px) {
		.page {
			padding: 20px 10px 34px;
		}
	}
</style>
