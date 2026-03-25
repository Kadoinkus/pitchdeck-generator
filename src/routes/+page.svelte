<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		getDeckResult,
		hydrateBrandPalette,
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
		undo,
	} from '$lib/stores/editor.svelte';
	import { viewer, type ViewerDeckData } from '$lib/stores/viewer.svelte';
	import { onMount } from 'svelte';

	import DeckForm from '$lib/components/form/DeckForm.svelte';

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

		viewer.show(payload.data, {
			shareToken: payload.shareToken,
		});
		goto(resolve('/editor'));
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
		bootstrap();
	});

	async function bootstrap() {
		setSaveState('is-saved');

		try {
			loadAiSettings();
			loadDraft();
			parseAssetsFromPayload();
			hydrateBrandPalette();
			restoreDeckResult();
			pushHistory();
			saveDraft(true);

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
		} catch (error) {
			console.error(error);
			setStatus(
				error instanceof Error ? error.message : 'Could not initialize editor.',
				true,
			);
			setSaveState('is-error');
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
		background: var(--brand-gradient);
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
