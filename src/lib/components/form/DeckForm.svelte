<script lang="ts">
	import {
		getPayload,
		getTemplateById,
		getTemplates,
		setDeckResult,
		setExcludedSlides,
		setStatus,
		type TemplateSlide,
	} from '$lib/stores/editor.svelte.ts';

	import AiSettingsSection from './AiSettingsSection.svelte';
	import BrandStyleSection from './BrandStyleSection.svelte';
	import CharacterAssetsSection from './CharacterAssetsSection.svelte';
	import OutputSection from './OutputSection.svelte';
	import QuickStartSection from './QuickStartSection.svelte';
	import SlideSelector from './SlideSelector.svelte';

	interface Props {
		onOpenViewer: () => void;
	}

	const { onOpenViewer }: Props = $props();

	const payload = $derived(getPayload());
	const templates = $derived(getTemplates());

	const currentTemplate = $derived(
		getTemplateById(String(payload.templateId || '')) || templates[0],
	);

	const currentSlides = $derived<TemplateSlide[]>(
		currentTemplate?.slides ?? [],
	);

	function handleTemplateChange() {
		setExcludedSlides([]);
	}

	async function handleGenerate() {
		setStatus('Generating pitch deck...');

		try {
			const p = getPayload();
			const totalSlides = currentSlides.length;
			const excludedCount = Array.isArray(p.excludedSlides)
				? p.excludedSlides.length
				: 0;
			if (excludedCount >= totalSlides) {
				throw new Error('Include at least one slide before generating.');
			}

			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(p),
			});

			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.message || 'Could not generate deck.');
			}

			const shareUrlAbsolute = result.shareUrl
				? new URL(result.shareUrl, window.location.origin).toString()
				: null;
			const pdfUrlAbsolute = result.pdfUrl
				? new URL(result.pdfUrl, window.location.origin).toString()
				: null;
			const downloadUrlAbsolute = result.downloadUrl
				? new URL(result.downloadUrl, window.location.origin).toString()
				: null;

			setDeckResult({
				slideData: result.slideData,
				downloadUrl: downloadUrlAbsolute,
				pdfUrl: pdfUrlAbsolute,
				shareUrl: shareUrlAbsolute,
			});

			setStatus('Deck generated successfully.');
			onOpenViewer();
		} catch (error) {
			console.error(error);
			setStatus(
				error instanceof Error ? error.message : 'Could not generate deck.',
				true,
			);
		}
	}
</script>

<form id="deck-form" class="card form-grid minimal">
	<QuickStartSection
		onTemplateChange={handleTemplateChange}
		onGenerate={handleGenerate}
	/>

	<SlideSelector slides={currentSlides} />

	<BrandStyleSection />

	<AiSettingsSection />

	<CharacterAssetsSection />

	<OutputSection {onOpenViewer} />

	<!-- Hidden fields for content payloads (same as vanilla version) -->
	<div class="hidden">
		<input name="projectTitle" value={String(payload.projectTitle || '')}>
		<input name="coverOneLiner" value={String(payload.coverOneLiner || '')}>
		<input name="subtitle" value={String(payload.subtitle || '')}>
		<input name="proposalDate" value={String(payload.proposalDate || '')}>
		<input name="mascotName" value={String(payload.mascotName || '')}>
		<textarea
			name="problemPoints"
			value={String(payload.problemPoints || '')}
		></textarea>
		<textarea
			name="opportunityPoints"
			value={String(payload.opportunityPoints || '')}
		></textarea>
		<textarea
			name="solutionPillars"
			value={String(payload.solutionPillars || '')}
		></textarea>
		<textarea
			name="whatNotsoIntro"
			value={String(payload.whatNotsoIntro || '')}
		></textarea>
		<textarea
			name="whatNotsoCards"
			value={String(payload.whatNotsoCards || '')}
		></textarea>
		<textarea
			name="buddyDescription"
			value={String(payload.buddyDescription || '')}
		></textarea>
		<textarea
			name="buddyPersonality"
			value={String(payload.buddyPersonality || '')}
		></textarea>
		<textarea
			name="toneSliders"
			value={String(payload.toneSliders || '')}
		></textarea>
		<textarea
			name="experienceConcept"
			value={String(payload.experienceConcept || '')}
		></textarea>
		<textarea name="chatFlow" value={String(payload.chatFlow || '')}></textarea>
		<textarea
			name="interactionExample"
			value={String(payload.interactionExample || '')}
		></textarea>
		<textarea
			name="businessImpact"
			value={String(payload.businessImpact || '')}
		></textarea>
		<textarea
			name="analyticsDescription"
			value={String(payload.analyticsDescription || '')}
		></textarea>
		<textarea
			name="analyticsBullets"
			value={String(payload.analyticsBullets || '')}
		></textarea>
		<textarea
			name="deliverables"
			value={String(payload.deliverables || '')}
		></textarea>
		<textarea name="pricing" value={String(payload.pricing || '')}></textarea>
		<textarea name="timeline" value={String(payload.timeline || '')}></textarea>
		<textarea
			name="closingText"
			value={String(payload.closingText || '')}
		></textarea>
		<textarea
			name="teamCards"
			value={String(payload.teamCards || '')}
		></textarea>
		<textarea
			name="characterAssets"
			value={String(payload.characterAssets || '')}
		></textarea>
		<textarea
			name="imagePrompts"
			value={String(payload.imagePrompts || '')}
		></textarea>
		<input name="contactName" value={String(payload.contactName || '')}>
		<input name="contactEmail" value={String(payload.contactEmail || '')}>
		<input name="contactPhone" value={String(payload.contactPhone || '')}>
	</div>
</form>

<style>
	.card {
		background: var(--card);
		border: 1px solid rgba(130, 156, 212, 0.27);
		border-radius: 18px;
		box-shadow: var(--shadow);
	}

	.form-grid {
		padding: 14px;
		display: grid;
		gap: 12px;
	}

	.form-grid.minimal {
		max-width: 100%;
	}
</style>
