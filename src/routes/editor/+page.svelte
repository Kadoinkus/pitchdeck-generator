<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
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
		syncBrandPalette,
		undo,
	} from '$lib/stores/editor.svelte';
	import {
		showViewer,
		updateViewerProject,
		viewer,
		type ViewerDeckData,
	} from '$lib/stores/viewer.svelte';
	import { onMount } from 'svelte';

	import SlideViewer from '$lib/components/SlideViewer.svelte';

	const projectName = $derived(
		(getPayload().projectTitle as string | undefined) || 'Untitled Deck',
	);

	function handleRename(name: string): void {
		setPayloadField('projectTitle', name);
		updateViewerProject({ projectTitle: name });
		pushHistory();
		markDirty();
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
		// If viewer already has data (navigated from form), we're good.
		if (viewer.isOpen) return;

		// Otherwise, restore from localStorage (direct navigation / refresh).
		loadAiSettings();
		loadDraft();
		parseAssetsFromPayload();
		syncBrandPalette();
		const hasResult = restoreDeckResult();
		pushHistory();
		saveDraft(true);

		if (!hasResult) {
			goto(resolve('/'));
			return;
		}

		const result = getDeckResult();
		const sd = result?.slideData;
		if (!sd?.slides?.length) {
			goto(resolve('/'));
			return;
		}

		const data: ViewerDeckData = {
			slides: sd.slides.map((s) => ({ ...s })),
			theme: { ...sd.theme },
			project: sd.project,
		};

		showViewer(data, {
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
