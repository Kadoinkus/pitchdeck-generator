<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		getDeckResult,
		getPayload,
		hydrateBrandPalette,
		loadAiSettings,
		loadDraft,
		markDirty,
		parseAssetsFromPayload,
		pushHistory,
		redo,
		restoreDeckResult,
		saveDraft,
		setPayloadField,
		undo,
	} from '$lib/stores/editor.svelte';
	import { viewer, type ViewerDeckData } from '$lib/stores/viewer.svelte';
	import { createUndoRedoHandler } from '$lib/utils/keyboard';
	import { onMount } from 'svelte';

	import SlideViewer from '$lib/components/SlideViewer.svelte';

	const projectName = $derived(
		(getPayload().projectTitle as string | undefined) || 'Untitled Deck',
	);

	function handleRename(name: string): void {
		setPayloadField('projectTitle', name);
		viewer.updateProject({ projectTitle: name });
		pushHistory();
		markDirty();
	}

	const handleKeyboard = createUndoRedoHandler(undo, redo);

	onMount(() => {
		// If viewer already has data (navigated from form), we're good.
		if (viewer.isOpen) return;

		// Otherwise, restore from localStorage (direct navigation / refresh).
		loadAiSettings();
		loadDraft();
		parseAssetsFromPayload();
		hydrateBrandPalette();
		const hasResult = restoreDeckResult();
		pushHistory();
		saveDraft(true);

		if (!hasResult) {
			goto(resolve('/'), { replaceState: true });
			return;
		}

		const result = getDeckResult();
		const sd = result?.slideData;
		if (!sd?.slides?.length) {
			goto(resolve('/'), { replaceState: true });
			return;
		}

		const data: ViewerDeckData = {
			slides: sd.slides.map((s) => ({ ...s })),
			theme: {
				...(typeof sd.deckTheme === 'object' && sd.deckTheme !== null
					? sd.deckTheme
					: {}),
			},
			project: sd.project,
		};

		viewer.show(data, {
			shareToken: result?.shareToken ?? null,
		});
	});
</script>

<svelte:window onkeydown={handleKeyboard} />

<svelte:head>
	<title>{projectName} — Editor</title>
</svelte:head>

{#if viewer.isOpen}
	<SlideViewer {projectName} onRename={handleRename} />
{/if}
