<script lang="ts">
	import {
		getPayload,
		markDirty,
		pushHistory,
		setExcludedSlides,
		setStatus,
		type TemplateSlide,
	} from '$lib/stores/editor.svelte.ts';

	interface Props {
		slides: TemplateSlide[];
	}

	let { slides }: Props = $props();

	const payload = $derived(getPayload());
	const excluded = $derived(
		new Set(
			Array.isArray(payload.excludedSlides) ? payload.excludedSlides : [],
		),
	);

	function toggleSlide(slideId: string, checked: boolean) {
		const current = Array.isArray(payload.excludedSlides)
			? [...payload.excludedSlides]
			: [];
		if (checked) {
			setExcludedSlides(current.filter((id) => id !== slideId));
		} else {
			setExcludedSlides([...current, slideId]);
		}
		pushHistory();
		markDirty();
	}

	function includeAll() {
		setExcludedSlides([]);
		pushHistory();
		markDirty();
		setStatus('All slides included.');
	}

	function coreOnly() {
		const required = new Set(slides.filter((s) => s.required).map((s) => s.id));
		const nextExcluded = slides.filter((s) => !required.has(s.id)).map((s) =>
			s.id
		);
		setExcludedSlides(nextExcluded);
		pushHistory();
		markDirty();
		setStatus('Core slides selected.');
	}
</script>

<details class="form-section" open>
	<summary>Slide Inclusion</summary>
	<div class="section-head compact">
		<p>Uncheck slides to exclude from this version.</p>
	</div>
	<div class="slide-toolbar">
		<button type="button" class="ghost" onclick={includeAll}>
			Include all
		</button>
		<button type="button" class="ghost" onclick={coreOnly}>Core only</button>
	</div>
	<div class="slide-selector">
		{#each slides as slide (slide.id)}
			<label class="slide-chip">
				<input
					type="checkbox"
					checked={!excluded.has(slide.id)}
					onchange={(e) => {
						if (e.target instanceof HTMLInputElement) {
							toggleSlide(slide.id, e.target.checked);
						}
					}}
				>
				<span>{slide.label}</span>
				<small>{slide.required ? 'Core' : 'Optional'}</small>
			</label>
		{/each}
	</div>
</details>

<style>
	.slide-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 9px;
	}

	.slide-selector {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}

	@media (max-width: 1050px) {
		.slide-selector {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.slide-selector {
			grid-template-columns: 1fr;
		}
	}
</style>
