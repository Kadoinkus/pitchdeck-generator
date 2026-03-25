<script lang="ts">
	import AiSettingsSection from '$lib/components/form/AiSettingsSection.svelte';
	import BrandStyleSection from '$lib/components/form/BrandStyleSection.svelte';
	import CharacterAssetsSection from '$lib/components/form/CharacterAssetsSection.svelte';
	import OutputSection from '$lib/components/form/OutputSection.svelte';
	import QuickStartSection from '$lib/components/form/QuickStartSection.svelte';
	import SlideSelector from '$lib/components/form/SlideSelector.svelte';
	import {
		getPayload,
		getTemplateById,
		getTemplates,
		setDeckResult,
		setExcludedSlides,
		setStatus,
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
				shareToken: result.shareToken ?? null,
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

<form
	id="deck-form"
	class="card form-grid minimal"
	onsubmit={(e) => e.preventDefault()}
>
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

	:global(.form-section) {
		margin: 0;
		border: 1px solid rgba(173, 196, 238, 0.42);
		border-radius: 14px;
		padding: 12px;
		background: linear-gradient(
			180deg,
			rgba(248, 252, 255, 0.88),
			rgba(255, 255, 255, 0.94)
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
		color: #4062a6;
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
		color: #183569;
		font-weight: 700;
	}

	:global(.field input),
	:global(.field textarea),
	:global(.field select) {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: #fff;
		color: var(--text);
		font: inherit;
		padding: 9px 10px;
		outline: none;
		transition: border-color 0.16s, box-shadow 0.16s;
	}

	:global(.field input:focus),
	:global(.field textarea:focus),
	:global(.field select:focus) {
		border-color: #8aa8e9;
		box-shadow: 0 0 0 3px rgba(0, 196, 204, 0.16);
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
		color: #3a5888;
		font-size: 0.9rem;
	}

	:global(.status.error) {
		color: #b32358;
	}

	:global(.status.warning) {
		color: #8a6118;
	}

	:global(.inline-actions) {
		margin-top: 10px;
	}

	:global(.slide-chip) {
		border: 1px solid #d2e0ff;
		background: #f6f9ff;
		border-radius: 10px;
		padding: 7px 9px;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 8px;
		align-items: center;
		color: #264474;
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
		color: #5a6e97;
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
