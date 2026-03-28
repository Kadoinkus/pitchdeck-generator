<script lang="ts">
	import BrandStyleSection from '$lib/components/form/BrandStyleSection.svelte';
	import CharacterAssetsSection from '$lib/components/form/CharacterAssetsSection.svelte';
	import OutputSection from '$lib/components/form/OutputSection.svelte';
	import QuickStartSection from '$lib/components/form/QuickStartSection.svelte';
	import SlideSelector from '$lib/components/form/SlideSelector.svelte';
	import { publishDeck } from '$lib/deck.remote';
	import {
		getPayload,
		getTemplateById,
		getTemplates,
		setDeckResult,
		setExcludedSlides,
		setStatus,
		snapshotPublishSignature,
		type TemplateSlide,
	} from '$lib/stores/editor.svelte';

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

	let isPublishing = $state(false);

	async function handlePublish() {
		if (isPublishing) return;
		isPublishing = true;
		setStatus('Publishing deck...');

		try {
			const p = getPayload();
			const totalSlides = currentSlides.length;
			const excludedCount = Array.isArray(p.excludedSlides)
				? p.excludedSlides.length
				: 0;
			if (excludedCount >= totalSlides) {
				throw new Error('Include at least one slide before generating.');
			}

			const result = await publishDeck(p);

			setDeckResult({
				slideData: result.slideData,
				shareToken: result.shareToken,
				downloadUrl: result.downloadUrl,
				pdfUrl: result.pdfUrl,
				shareUrl: result.shareUrl,
				payloadHash: result.payloadHash,
				publishedAt: new Date().toISOString(),
				publishedSignature: snapshotPublishSignature(),
			});

			setStatus('Deck published.');
			onOpenViewer();
		} catch (error) {
			console.error(error);
			setStatus(
				error instanceof Error ? error.message : 'Could not generate deck.',
				true,
			);
		} finally {
			isPublishing = false;
		}
	}
</script>

<form
	id="deck-form"
	class="card form-grid minimal"
	onsubmit={(e) => e.preventDefault()}
>
	<QuickStartSection
		onTemplateChange={handleTemplateChange}
		onPublish={handlePublish}
	/>

	<SlideSelector slides={currentSlides} />

	<BrandStyleSection />

	<CharacterAssetsSection />

	<OutputSection {onOpenViewer} />

	<!--
		Hidden fields mirror payload state into the DOM so external tools
		(e.g. browser extensions, form-scraping scripts) can read current
		values even though this form never does a traditional submit.
	-->
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
		border: 1px solid var(--card-border);
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

	/* TODO: Move :global() form styles to a shared stylesheet */
	:global(.form-section) {
		margin: 0;
		border: 1px solid var(--card-border);
		border-radius: 14px;
		padding: 12px;
		background: linear-gradient(
			180deg,
			var(--card-bg-subtle),
			var(--card)
		);
	}

	:global(.form-section > summary) {
		list-style: none;
		cursor: pointer;
		font-family: "Sora", "DM Sans", sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text);
	}

	:global(.form-section > summary::-webkit-details-marker) {
		display: none;
	}

	:global(.form-section > summary::after) {
		content: " +";
		color: var(--muted);
	}

	:global(.form-section[open] > summary::after) {
		content: " -";
	}

	:global(.section-head h2) {
		margin: 0;
		font-family: "Sora", "DM Sans", sans-serif;
		font-size: 1rem;
	}

	:global(.section-head p) {
		margin: 6px 0 10px;
		color: var(--muted);
		font-size: 0.9rem;
	}

	:global(.section-head.compact p) {
		margin-bottom: 2px;
	}

	:global(.section-grid) {
		display: grid;
		gap: 10px;
	}

	:global(.section-grid.quick-grid) {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}

	:global(.section-grid.two-col) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	:global(.section-grid.five-col) {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}

	:global(.field) {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}

	:global(.field label) {
		font-size: 0.82rem;
		color: var(--label-color);
		font-weight: 700;
	}

	:global(.field input),
	:global(.field textarea),
	:global(.field select) {
		width: 100%;
		border: 1px solid var(--input-border);
		border-radius: 10px;
		background: var(--input-bg);
		color: var(--text);
		font: inherit;
		padding: 9px 10px;
		outline: none;
		transition: border-color 0.16s, box-shadow 0.16s;
	}

	:global(.field input:focus),
	:global(.field textarea:focus),
	:global(.field select:focus) {
		border-color: var(--input-focus-border);
		box-shadow: 0 0 0 3px var(--input-focus-shadow);
	}

	:global(.field select.is-locked) {
		border-style: dashed;
		border-color: #9ab8ec;
	}

	:global(.field textarea) {
		min-height: 108px;
		resize: vertical;
	}

	:global(.field input[type="color"]) {
		min-height: 40px;
		padding: 2px;
	}

	:global(.field input.is-color-warning) {
		border-color: #f0b453;
		box-shadow: 0 0 0 3px rgba(240, 180, 83, 0.2);
	}

	:global(.actions-row) {
		margin-top: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}

	:global(.status) {
		margin: 0;
		color: var(--status-color);
		font-size: 0.9rem;
	}

	:global(.status.error) {
		color: var(--status-error);
	}

	:global(.status.warning) {
		color: var(--status-warning);
	}

	:global(.inline-actions) {
		margin-top: 10px;
	}

	:global(.slide-chip) {
		border: 1px solid var(--line);
		background: var(--card-bg-subtle);
		border-radius: 10px;
		padding: 7px 9px;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 8px;
		align-items: center;
		color: var(--label-color);
	}

	:global(.slide-chip input) {
		accent-color: var(--secondary);
	}

	:global(.slide-chip span) {
		font-size: 0.86rem;
		font-weight: 600;
	}

	:global(.slide-chip small) {
		grid-column: 2;
		color: var(--muted);
		font-size: 0.71rem;
	}

	@media (max-width: 1050px) {
		:global(.section-grid.quick-grid),
		:global(.section-grid.five-col) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		:global(.section-grid.quick-grid),
		:global(.section-grid.two-col),
		:global(.section-grid.five-col) {
			grid-template-columns: 1fr;
		}

		:global(.actions-row) {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
